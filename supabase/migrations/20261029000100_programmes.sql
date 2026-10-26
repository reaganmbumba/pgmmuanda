-- =====================================================================
-- PGM MUANDA DIGITAL — Étape 6 : programmes, annonces et présences
-- À exécuter après 20261028000100_notifications.sql
--
-- Ciblage : une activité ou une annonce a une « portée » (toute la PGM,
-- ou une seule paroisse) et des cibles (tous les membres de la portée,
-- ou certaines paroisses, chorales ou voix). La base calcule elle-même
-- qui est concerné : un choriste ne voit que ce qui le concerne.
-- =====================================================================

create type public.statut_activite as enum ('prevue', 'confirmee', 'realisee', 'reportee', 'annulee');
create type public.type_annonce as enum ('officielle', 'communique', 'invitation', 'changement', 'urgente');
create type public.statut_presence as enum ('present', 'absent', 'excuse');
create type public.methode_presence as enum ('manuel', 'qr');

create or replace function public.ma_commission()
returns uuid language sql stable security definer set search_path = '' as $$
  select commission_id from public.profils where id = auth.uid() and actif;
$$;

-- Un membre est-il concerné par un ciblage ?
create or replace function public.concerne(
  p_portee uuid, p_tous boolean, p_paroisses uuid[], p_chorales uuid[], p_voix public.voix[],
  p_membre_paroisse uuid, p_membre_chorale uuid, p_membre_voix public.voix
) returns boolean language sql immutable set search_path = '' as $$
  select coalesce(
    (p_portee is null or p_membre_paroisse = p_portee)
    and (p_tous
         or p_membre_paroisse = any(p_paroisses)
         or p_membre_chorale = any(p_chorales)
         or p_membre_voix = any(p_voix)),
    false);
$$;

-- ---------------------------------------------------------------------
-- Activités (programme)
-- ---------------------------------------------------------------------
create table public.activites (
  id uuid primary key default gen_random_uuid(),
  titre text not null check (length(trim(titre)) between 2 and 150),
  description text not null default '' check (length(description) <= 2000),
  debut timestamptz not null,
  fin timestamptz,
  lieu text not null default '' check (length(lieu) <= 150),
  portee_paroisse uuid references public.paroisses(id) on delete restrict, -- null = toute la PGM
  commission_id uuid references public.commissions(id) on delete set null,
  responsable text not null default '' check (length(responsable) <= 120),
  statut public.statut_activite not null default 'prevue',
  pour_tous boolean not null default true,
  cible_paroisses uuid[] not null default '{}',
  cible_chorales uuid[] not null default '{}',
  cible_voix public.voix[] not null default '{}',
  cree_par uuid default auth.uid() references public.profils(id) on delete set null,
  est_demo boolean not null default false,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint fin_apres_debut check (fin is null or fin >= debut),
  constraint ciblage_non_vide check (
    pour_tous or cardinality(cible_paroisses) + cardinality(cible_chorales) + cardinality(cible_voix) > 0)
);
create index on public.activites (debut);
create index on public.activites (portee_paroisse);
create trigger activites_modifie_le before update on public.activites
  for each row execute function public.maj_modifie_le();

-- ---------------------------------------------------------------------
-- Annonces
-- ---------------------------------------------------------------------
create table public.annonces (
  id uuid primary key default gen_random_uuid(),
  titre text not null check (length(trim(titre)) between 2 and 150),
  contenu text not null check (length(trim(contenu)) between 1 and 5000),
  type public.type_annonce not null default 'communique',
  portee_paroisse uuid references public.paroisses(id) on delete restrict,
  pour_tous boolean not null default true,
  cible_paroisses uuid[] not null default '{}',
  cible_chorales uuid[] not null default '{}',
  cible_voix public.voix[] not null default '{}',
  publiee_le timestamptz not null default now(),
  auteur_id uuid default auth.uid() references public.profils(id) on delete set null,
  archivee boolean not null default false,
  est_demo boolean not null default false,
  modifie_le timestamptz not null default now(),
  constraint ciblage_non_vide check (
    pour_tous or cardinality(cible_paroisses) + cardinality(cible_chorales) + cardinality(cible_voix) > 0)
);
create index on public.annonces (publiee_le desc);
create trigger annonces_modifie_le before update on public.annonces
  for each row execute function public.maj_modifie_le();

-- Cohérence du ciblage (commune aux activités et aux annonces)
create or replace function public.controler_ciblage()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from unnest(new.cible_paroisses) x where x not in (select id from public.paroisses)) then
    raise exception 'Paroisse ciblée inconnue.';
  end if;
  if exists (select 1 from unnest(new.cible_chorales) x where x not in (select id from public.chorales)) then
    raise exception 'Chorale ciblée inconnue.';
  end if;
  if new.portee_paroisse is not null then
    if exists (select 1 from unnest(new.cible_paroisses) x where x <> new.portee_paroisse) then
      raise exception 'Une publication de paroisse ne peut cibler que sa propre paroisse.';
    end if;
    if exists (select 1 from unnest(new.cible_chorales) x
               where x not in (select id from public.chorales where paroisse_id = new.portee_paroisse)) then
      raise exception 'Une publication de paroisse ne peut cibler que les chorales de cette paroisse.';
    end if;
  end if;
  return new;
end $$;
create trigger activites_ciblage before insert or update on public.activites
  for each row execute function public.controler_ciblage();
create trigger annonces_ciblage before insert or update on public.annonces
  for each row execute function public.controler_ciblage();

-- Une annonce est datée par la base et son auteur ne change pas.
create or replace function public.controler_annonce()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.publiee_le := now();
    new.auteur_id := auth.uid();
  else
    new.publiee_le := old.publiee_le;
    new.auteur_id := old.auteur_id;
  end if;
  return new;
end $$;
create trigger annonces_controle before insert or update on public.annonces
  for each row execute function public.controler_annonce();

-- ---------------------------------------------------------------------
-- Présences
-- ---------------------------------------------------------------------
create table public.presences (
  activite_id uuid not null references public.activites(id) on delete cascade,
  membre_id uuid not null references public.membres(id) on delete cascade,
  statut public.statut_presence not null,
  methode public.methode_presence not null default 'manuel',
  saisi_par uuid default auth.uid() references public.profils(id) on delete set null,
  saisi_le timestamptz not null default now(),
  primary key (activite_id, membre_id)
);
create index on public.presences (membre_id);

create or replace function public.controler_presence()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_a public.activites;
  v_m public.membres;
begin
  if tg_op = 'UPDATE' and (new.activite_id <> old.activite_id or new.membre_id <> old.membre_id) then
    raise exception 'Une présence ne change ni d''activité ni de membre.';
  end if;
  select * into v_a from public.activites where id = new.activite_id;
  select * into v_m from public.membres where id = new.membre_id;
  if v_a.statut = 'annulee' then
    raise exception 'Cette activité est annulée : aucune présence ne peut être saisie.';
  end if;
  if v_m.archive then
    raise exception 'Ce membre est archivé.';
  end if;
  if not public.concerne(v_a.portee_paroisse, v_a.pour_tous, v_a.cible_paroisses, v_a.cible_chorales, v_a.cible_voix,
                         v_m.paroisse_id, v_m.chorale_id, v_m.voix) then
    raise exception 'Ce membre n''est pas concerné par cette activité.';
  end if;
  new.saisi_par := auth.uid();
  new.saisi_le := now();
  return new;
end $$;
create trigger presences_controle before insert or update on public.presences
  for each row execute function public.controler_presence();

-- ---------------------------------------------------------------------
-- Droits
-- ---------------------------------------------------------------------
-- Gérer une activité : administration, responsable de la paroisse concernée,
-- responsable de la commission organisatrice.
create or replace function public.peut_gerer_activite(p_portee uuid, p_commission uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.est_admin()
      or (public.mon_role() = 'responsable_paroisse' and p_portee is not null and p_portee = public.ma_paroisse())
      or (public.mon_role() = 'responsable_commission' and p_commission is not null and p_commission = public.ma_commission());
$$;

-- Publier une annonce : administration, ou responsable de paroisse vers sa paroisse.
create or replace function public.peut_gerer_annonce(p_portee uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.est_admin()
      or (public.mon_role() = 'responsable_paroisse' and p_portee is not null and p_portee = public.ma_paroisse());
$$;

-- Saisir une présence : qui gère l'activité, ou qui gère la paroisse du membre
-- (un responsable pointe ses membres lors d'une activité de toute la PGM).
create or replace function public.peut_saisir_presence(p_activite uuid, p_membre uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.activites a where a.id = p_activite
                  and public.peut_gerer_activite(a.portee_paroisse, a.commission_id))
      or exists (select 1 from public.membres m where m.id = p_membre
                  and public.peut_gerer_paroisse(m.paroisse_id));
$$;

-- Le choriste connecté est-il concerné ? (sa fiche, non archivée)
create or replace function public.me_concerne(
  p_portee uuid, p_tous boolean, p_paroisses uuid[], p_chorales uuid[], p_voix public.voix[]
) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.membres m
     where m.profil_id = auth.uid() and not m.archive
       and public.concerne(p_portee, p_tous, p_paroisses, p_chorales, p_voix, m.paroisse_id, m.chorale_id, m.voix));
$$;

alter table public.activites enable row level security;
alter table public.annonces enable row level security;
alter table public.presences enable row level security;

create policy "lecture" on public.activites for select to authenticated using (
  public.est_staff() or public.me_concerne(portee_paroisse, pour_tous, cible_paroisses, cible_chorales, cible_voix)
);
create policy "création" on public.activites for insert to authenticated
  with check (public.peut_gerer_activite(portee_paroisse, commission_id));
create policy "modification" on public.activites for update to authenticated
  using (public.peut_gerer_activite(portee_paroisse, commission_id))
  with check (public.peut_gerer_activite(portee_paroisse, commission_id));
create policy "suppression admin" on public.activites for delete to authenticated using (public.est_admin());

create policy "lecture" on public.annonces for select to authenticated using (
  public.est_staff()
  or (not archivee and public.me_concerne(portee_paroisse, pour_tous, cible_paroisses, cible_chorales, cible_voix))
);
create policy "publication" on public.annonces for insert to authenticated
  with check (public.peut_gerer_annonce(portee_paroisse));
create policy "modification" on public.annonces for update to authenticated
  using (public.peut_gerer_annonce(portee_paroisse)) with check (public.peut_gerer_annonce(portee_paroisse));
create policy "suppression admin" on public.annonces for delete to authenticated using (public.est_admin());

create policy "lecture" on public.presences for select to authenticated using (
  public.peut_saisir_presence(activite_id, membre_id)
  or exists (select 1 from public.membres m where m.id = membre_id and m.profil_id = auth.uid())
);
create policy "saisie" on public.presences for insert to authenticated
  with check (public.peut_saisir_presence(activite_id, membre_id));
create policy "correction" on public.presences for update to authenticated
  using (public.peut_saisir_presence(activite_id, membre_id))
  with check (public.peut_saisir_presence(activite_id, membre_id));
create policy "effacement" on public.presences for delete to authenticated
  using (public.peut_saisir_presence(activite_id, membre_id));

-- ---------------------------------------------------------------------
-- Pointage par QR code (ou matricule) : un seul appel, contrôlé par la base.
-- Le contrôleur peut pointer à toute activité ; les autres selon leurs droits.
-- ---------------------------------------------------------------------
create or replace function public.pointer_presence(p_activite uuid, p_reference text)
returns table (resultat text, prenom text, nom text, matricule text, paroisse text, photo_url text)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_a public.activites;
  v_m public.membres;
  v_carte public.cartes;
  v_ref text := left(trim(coalesce(p_reference, '')), 64);
  v_res text;
begin
  if not public.est_staff() then
    raise exception 'Accès réservé au personnel habilité.' using errcode = '42501';
  end if;
  select * into v_a from public.activites where id = p_activite;
  if not found then
    raise exception 'Activité introuvable.';
  end if;

  if upper(v_ref) ~ '^PGM-MUA-[0-9]+$' then
    select * into v_m from public.membres where membres.matricule = upper(v_ref);
    select * into v_carte from public.cartes c where c.membre_id = v_m.id and c.statut = 'active';
  else
    select * into v_carte from public.cartes c where c.reference_qr = v_ref;
    select * into v_m from public.membres where id = v_carte.membre_id;
  end if;

  v_res := case
    when v_m.id is null then 'inconnue'
    when v_carte.id is null or v_carte.statut <> 'active' or v_m.statut <> 'actif' or v_m.archive then 'carte_invalide'
    when v_a.statut = 'annulee' then 'activite_annulee'
    when not public.concerne(v_a.portee_paroisse, v_a.pour_tous, v_a.cible_paroisses, v_a.cible_chorales, v_a.cible_voix,
                             v_m.paroisse_id, v_m.chorale_id, v_m.voix) then 'non_concerne'
    when public.mon_role() <> 'controleur' and not public.peut_saisir_presence(v_a.id, v_m.id) then 'non_autorise'
    when exists (select 1 from public.presences p where p.activite_id = v_a.id and p.membre_id = v_m.id and p.statut = 'present')
      then 'deja_present'
    else 'enregistre' end;

  if v_res = 'enregistre' then
    insert into public.presences (activite_id, membre_id, statut, methode)
    values (v_a.id, v_m.id, 'present', 'qr')
    on conflict (activite_id, membre_id) do update set statut = 'present', methode = 'qr';
  end if;

  if v_m.id is null then
    return query select v_res, null::text, null::text, null::text, null::text, null::text;
  else
    return query select v_res, v_m.prenom, v_m.nom, v_m.matricule, p.nom, v_m.photo_url
      from public.paroisses p where p.id = v_m.paroisse_id;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Notifications des membres concernés (dans l'application uniquement)
-- ---------------------------------------------------------------------
create or replace function public.notifier_concernes(
  p_portee uuid, p_tous boolean, p_paroisses uuid[], p_chorales uuid[], p_voix public.voix[], p_titre text, p_lien text
) returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (profil_id, titre, lien)
  select m.profil_id, left(p_titre, 200), p_lien
    from public.membres m join public.profils p on p.id = m.profil_id and p.actif
   where not m.archive
     and public.concerne(p_portee, p_tous, p_paroisses, p_chorales, p_voix, m.paroisse_id, m.chorale_id, m.voix);
$$;

create or replace function public.notifier_activite()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_quand text := to_char(new.debut at time zone 'Africa/Kinshasa', 'DD/MM/YYYY à HH24"h"MI');
  v_titre text;
begin
  if tg_op = 'INSERT' then
    if new.statut <> 'annulee' then v_titre := 'Nouvelle activité : ' || new.titre || ' (' || v_quand || ')'; end if;
  elsif new.statut is distinct from old.statut and new.statut = 'annulee' then
    v_titre := 'Activité annulée : ' || new.titre;
  elsif new.statut is distinct from old.statut and new.statut = 'reportee' then
    v_titre := 'Activité reportée : ' || new.titre;
  elsif new.statut <> 'annulee' and (new.debut <> old.debut or new.lieu <> old.lieu) then
    v_titre := 'Activité modifiée : ' || new.titre || ' (' || v_quand || coalesce(', ' || nullif(new.lieu, ''), '') || ')';
  end if;
  if v_titre is not null then
    perform public.notifier_concernes(new.portee_paroisse, new.pour_tous, new.cible_paroisses, new.cible_chorales,
                                      new.cible_voix, v_titre, '/choriste/programme');
  end if;
  return null;
end $$;
create trigger activites_notification after insert or update on public.activites
  for each row execute function public.notifier_activite();

create or replace function public.notifier_annonce()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not new.archivee then
    perform public.notifier_concernes(new.portee_paroisse, new.pour_tous, new.cible_paroisses, new.cible_chorales,
      new.cible_voix,
      case when new.type = 'urgente' then 'Urgent : ' else 'Nouvelle annonce : ' end || new.titre,
      '/choriste/annonces');
  end if;
  return null;
end $$;
create trigger annonces_notification after insert on public.annonces
  for each row execute function public.notifier_annonce();

-- Traçabilité
create trigger journal_activites after insert or update or delete on public.activites
  for each row execute function public.journaliser();
create trigger journal_annonces after insert or update or delete on public.annonces
  for each row execute function public.journaliser();

-- Droits d'exécution
revoke execute on function public.notifier_concernes(uuid, boolean, uuid[], uuid[], public.voix[], text, text)
  from public, anon, authenticated;
grant execute on function
  public.ma_commission(),
  public.concerne(uuid, boolean, uuid[], uuid[], public.voix[], uuid, uuid, public.voix),
  public.me_concerne(uuid, boolean, uuid[], uuid[], public.voix[]),
  public.peut_gerer_activite(uuid, uuid),
  public.peut_gerer_annonce(uuid),
  public.peut_saisir_presence(uuid, uuid),
  public.pointer_presence(uuid, text)
  to authenticated;
