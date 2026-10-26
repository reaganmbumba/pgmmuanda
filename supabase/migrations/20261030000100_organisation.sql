-- =====================================================================
-- PGM MUANDA DIGITAL — Étape 7 : commissions, formations, projets,
-- finances, hébergement et répertoire des chants.
-- À exécuter après 20261029000100_programmes.sql
--
-- Règles principales :
--  * une commission est gérée par l'administration et par son responsable ;
--  * les finances ne sont visibles que par l'administration et, pour ses
--    projets, par le responsable de la commission ;
--  * l'hébergement n'est visible que par l'administration (super admin,
--    présidence) et par le choriste concerné, qui ne voit que sa chambre.
-- =====================================================================

-- Droit commun : administration, ou responsable de la commission donnée.
create or replace function public.peut_gerer_commission(p_commission uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.est_admin()
      or (public.mon_role() = 'responsable_commission' and p_commission is not null
          and p_commission = public.ma_commission());
$$;

-- Fiche du choriste connecté
create or replace function public.mon_membre()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.membres where profil_id = auth.uid();
$$;

-- Notifie le compte d'un membre (s'il en a un)
create or replace function public.notifier_membre(p_membre uuid, p_titre text, p_lien text)
returns void language sql security definer set search_path = '' as $$
  select public.notifier((select profil_id from public.membres where id = p_membre), p_titre, p_lien);
$$;
revoke execute on function public.notifier_membre(uuid, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Commissions : membres et fonctions
-- ---------------------------------------------------------------------
create table public.commission_membres (
  commission_id uuid not null references public.commissions(id) on delete cascade,
  membre_id uuid not null references public.membres(id) on delete cascade,
  fonction text not null default 'Membre' check (length(trim(fonction)) between 2 and 60),
  depuis date not null default current_date,
  ajoute_par uuid default auth.uid() references public.profils(id) on delete set null,
  primary key (commission_id, membre_id)
);
create index on public.commission_membres (membre_id);

create or replace function public.controler_commission_membre()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (new.commission_id <> old.commission_id or new.membre_id <> old.membre_id) then
    raise exception 'Changez la fonction, pas la commission ni le membre.';
  end if;
  if tg_op = 'INSERT' and exists (select 1 from public.membres where id = new.membre_id and archive) then
    raise exception 'Ce membre est archivé.';
  end if;
  if tg_op = 'INSERT' then new.ajoute_par := auth.uid(); end if;
  return new;
end $$;
create trigger commission_membres_controle before insert or update on public.commission_membres
  for each row execute function public.controler_commission_membre();

create or replace function public.notifier_commission_membre()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.notifier_membre(new.membre_id,
    'Vous faites partie de la commission ' || (select nom from public.commissions where id = new.commission_id)
      || ' (' || new.fonction || ')',
    '/choriste/paroisse');
  return null;
end $$;
create trigger commission_membres_notification after insert on public.commission_membres
  for each row execute function public.notifier_commission_membre();

alter table public.commission_membres enable row level security;
create policy "lecture" on public.commission_membres for select to authenticated using (
  public.peut_gerer_commission(commission_id)
  or membre_id = public.mon_membre()
  or exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_paroisse(m.paroisse_id))
);
create policy "gestion" on public.commission_membres for all to authenticated
  using (public.peut_gerer_commission(commission_id)) with check (public.peut_gerer_commission(commission_id));

-- Le responsable peut modifier la description de sa commission (pas en créer ni en supprimer).
create policy "description par le responsable" on public.commissions for update to authenticated
  using (public.peut_gerer_commission(id)) with check (public.peut_gerer_commission(id));
create or replace function public.controler_commission()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not public.est_admin() and new.nom <> old.nom then
    raise exception 'Seule l''administration peut renommer une commission.';
  end if;
  return new;
end $$;
create trigger commissions_controle before update on public.commissions
  for each row execute function public.controler_commission();

-- ---------------------------------------------------------------------
-- Formations
-- ---------------------------------------------------------------------
create type public.statut_formation as enum ('planifiee', 'en_cours', 'terminee', 'annulee');

create table public.formations (
  id uuid primary key default gen_random_uuid(),
  titre text not null check (length(trim(titre)) between 2 and 150),
  description text not null default '' check (length(description) <= 3000),
  formateur text not null default '' check (length(formateur) <= 120),
  lieu text not null default '' check (length(lieu) <= 150),
  debut timestamptz not null,
  fin timestamptz,
  places int check (places is null or places between 1 and 1000),
  commission_id uuid references public.commissions(id) on delete set null,
  statut public.statut_formation not null default 'planifiee',
  cree_par uuid default auth.uid() references public.profils(id) on delete set null,
  est_demo boolean not null default false,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint fin_apres_debut check (fin is null or fin >= debut)
);
create index on public.formations (debut desc);
create trigger formations_modifie_le before update on public.formations
  for each row execute function public.maj_modifie_le();

create table public.formation_inscriptions (
  formation_id uuid not null references public.formations(id) on delete cascade,
  membre_id uuid not null references public.membres(id) on delete cascade,
  statut text not null default 'inscrit' check (statut in ('inscrit', 'valide', 'non_valide', 'abandon')),
  note numeric(4, 1) check (note is null or note between 0 and 20),
  appreciation text not null default '' check (length(appreciation) <= 1000),
  evalue_par uuid references public.profils(id) on delete set null,
  evalue_le timestamptz,
  inscrit_le timestamptz not null default now(),
  primary key (formation_id, membre_id)
);
create index on public.formation_inscriptions (membre_id);

create or replace function public.controler_inscription()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_f public.formations;
begin
  if tg_op = 'UPDATE' and (new.formation_id <> old.formation_id or new.membre_id <> old.membre_id) then
    raise exception 'Une inscription ne change ni de formation ni de membre.';
  end if;
  select * into v_f from public.formations where id = new.formation_id;
  if tg_op = 'INSERT' then
    if v_f.statut = 'annulee' then raise exception 'Cette formation est annulée.'; end if;
    if exists (select 1 from public.membres where id = new.membre_id and archive) then
      raise exception 'Ce membre est archivé.';
    end if;
    if v_f.places is not null
       and (select count(*) from public.formation_inscriptions where formation_id = new.formation_id) >= v_f.places then
      raise exception 'Formation complète : % places.', v_f.places;
    end if;
    new.inscrit_le := now();
  else
    new.inscrit_le := old.inscrit_le;
  end if;
  -- L'évaluation est datée et signée par la base
  if tg_op = 'UPDATE' and new.note is not distinct from old.note and new.appreciation = old.appreciation
     and new.statut = old.statut then
    new.evalue_par := old.evalue_par;
    new.evalue_le := old.evalue_le;
  elsif new.note is not null or new.appreciation <> '' or new.statut in ('valide', 'non_valide') then
    new.evalue_par := auth.uid();
    new.evalue_le := now();
  else
    new.evalue_par := null;
    new.evalue_le := null;
  end if;
  return new;
end $$;
create trigger inscriptions_controle before insert or update on public.formation_inscriptions
  for each row execute function public.controler_inscription();

create or replace function public.notifier_inscription()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_titre text := (select titre from public.formations where id = new.formation_id);
begin
  if tg_op = 'INSERT' then
    perform public.notifier_membre(new.membre_id, 'Inscription à la formation : ' || v_titre, '/choriste/formations');
  elsif new.evalue_le is distinct from old.evalue_le and new.evalue_le is not null then
    perform public.notifier_membre(new.membre_id, 'Évaluation disponible : ' || v_titre, '/choriste/formations');
  end if;
  return null;
end $$;
create trigger inscriptions_notification after insert or update on public.formation_inscriptions
  for each row execute function public.notifier_inscription();

create or replace function public.notifier_formation()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_membre uuid;
  v_titre text;
begin
  if new.statut = 'annulee' and old.statut <> 'annulee' then
    v_titre := 'Formation annulée : ' || new.titre;
  elsif new.statut <> 'annulee' and (new.debut <> old.debut or new.lieu <> old.lieu) then
    v_titre := 'Formation modifiée : ' || new.titre || ' ('
      || to_char(new.debut at time zone 'Africa/Kinshasa', 'DD/MM/YYYY à HH24"h"MI') || ')';
  end if;
  if v_titre is not null then
    for v_membre in select membre_id from public.formation_inscriptions where formation_id = new.id loop
      perform public.notifier_membre(v_membre, v_titre, '/choriste/formations');
    end loop;
  end if;
  return null;
end $$;
create trigger formations_notification after update on public.formations
  for each row execute function public.notifier_formation();

alter table public.formations enable row level security;
alter table public.formation_inscriptions enable row level security;

create policy "lecture" on public.formations for select to authenticated using (
  public.est_staff()
  or exists (select 1 from public.formation_inscriptions i where i.formation_id = formations.id and i.membre_id = public.mon_membre())
);
create policy "création" on public.formations for insert to authenticated
  with check (public.peut_gerer_commission(commission_id));
create policy "modification" on public.formations for update to authenticated
  using (public.peut_gerer_commission(commission_id)) with check (public.peut_gerer_commission(commission_id));
create policy "suppression admin" on public.formations for delete to authenticated using (public.est_admin());

create or replace function public.peut_gerer_formation(p_formation uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.formations f where f.id = p_formation and public.peut_gerer_commission(f.commission_id));
$$;

create policy "lecture" on public.formation_inscriptions for select to authenticated using (
  public.peut_gerer_formation(formation_id)
  or membre_id = public.mon_membre()
  or exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_paroisse(m.paroisse_id))
);
create policy "gestion" on public.formation_inscriptions for all to authenticated
  using (public.peut_gerer_formation(formation_id)) with check (public.peut_gerer_formation(formation_id));

-- ---------------------------------------------------------------------
-- Projets, tâches et rapports d'avancement
-- ---------------------------------------------------------------------
create type public.statut_projet as enum ('planifie', 'en_cours', 'suspendu', 'termine', 'annule');

create table public.projets (
  id uuid primary key default gen_random_uuid(),
  titre text not null check (length(trim(titre)) between 2 and 150),
  description text not null default '' check (length(description) <= 3000),
  commission_id uuid references public.commissions(id) on delete set null,
  responsable text not null default '' check (length(responsable) <= 120),
  debut date,
  fin_prevue date,
  budget_cdf numeric(14, 2) not null default 0 check (budget_cdf >= 0),
  budget_usd numeric(12, 2) not null default 0 check (budget_usd >= 0),
  statut public.statut_projet not null default 'planifie',
  avancement int not null default 0 check (avancement between 0 and 100),
  cree_par uuid default auth.uid() references public.profils(id) on delete set null,
  est_demo boolean not null default false,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint fin_apres_debut check (fin_prevue is null or debut is null or fin_prevue >= debut)
);
create trigger projets_modifie_le before update on public.projets
  for each row execute function public.maj_modifie_le();

create table public.projet_taches (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references public.projets(id) on delete cascade,
  titre text not null check (length(trim(titre)) between 2 and 200),
  responsable text not null default '' check (length(responsable) <= 120),
  echeance date,
  statut text not null default 'a_faire' check (statut in ('a_faire', 'en_cours', 'terminee')),
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
create index on public.projet_taches (projet_id);
create trigger projet_taches_modifie_le before update on public.projet_taches
  for each row execute function public.maj_modifie_le();

create table public.projet_rapports (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references public.projets(id) on delete cascade,
  avancement int not null check (avancement between 0 and 100),
  contenu text not null check (length(trim(contenu)) between 2 and 5000),
  auteur_id uuid default auth.uid() references public.profils(id) on delete set null,
  cree_le timestamptz not null default now()
);
create index on public.projet_rapports (projet_id, cree_le desc);

-- Le rapport est daté et signé par la base ; il met à jour l'avancement du projet.
create or replace function public.controler_rapport()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.auteur_id := auth.uid();
  new.cree_le := now();
  return new;
end $$;
create trigger projet_rapports_controle before insert on public.projet_rapports
  for each row execute function public.controler_rapport();

create or replace function public.appliquer_rapport()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.projets set avancement = new.avancement,
    statut = case when statut = 'planifie' then 'en_cours' else statut end
   where id = new.projet_id;
  return null;
end $$;
create trigger projet_rapports_avancement after insert on public.projet_rapports
  for each row execute function public.appliquer_rapport();

create or replace function public.peut_gerer_projet(p_projet uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projets p where p.id = p_projet and public.peut_gerer_commission(p.commission_id));
$$;

alter table public.projets enable row level security;
alter table public.projet_taches enable row level security;
alter table public.projet_rapports enable row level security;

create policy "lecture" on public.projets for select to authenticated using (public.peut_gerer_commission(commission_id));
create policy "création" on public.projets for insert to authenticated with check (public.peut_gerer_commission(commission_id));
create policy "modification" on public.projets for update to authenticated
  using (public.peut_gerer_commission(commission_id)) with check (public.peut_gerer_commission(commission_id));
create policy "suppression admin" on public.projets for delete to authenticated using (public.est_admin());

create policy "gestion" on public.projet_taches for all to authenticated
  using (public.peut_gerer_projet(projet_id)) with check (public.peut_gerer_projet(projet_id));

create policy "lecture" on public.projet_rapports for select to authenticated using (public.peut_gerer_projet(projet_id));
create policy "rédaction" on public.projet_rapports for insert to authenticated with check (public.peut_gerer_projet(projet_id));
-- Un rapport n'est pas modifiable ; seul le super administrateur peut le supprimer.
create policy "suppression super admin" on public.projet_rapports for delete to authenticated
  using (public.mon_role() = 'super_admin');

-- ---------------------------------------------------------------------
-- Finances : recettes et dépenses, en francs congolais ou en dollars.
-- Les deux devises ne sont jamais additionnées ensemble.
-- ---------------------------------------------------------------------
create type public.devise as enum ('CDF', 'USD');

create table public.operations_financieres (
  id uuid primary key default gen_random_uuid(),
  sens text not null check (sens in ('recette', 'depense')),
  libelle text not null check (length(trim(libelle)) between 2 and 200),
  categorie text not null default 'Divers' check (length(trim(categorie)) between 2 and 60),
  montant numeric(14, 2) not null check (montant > 0),
  devise public.devise not null default 'CDF',
  date_operation date not null default current_date,
  projet_id uuid references public.projets(id) on delete restrict,
  commission_id uuid references public.commissions(id) on delete set null,
  piece text not null default '' check (length(piece) <= 80),  -- n° du reçu ou de la facture
  saisi_par uuid default auth.uid() references public.profils(id) on delete set null,
  saisi_le timestamptz not null default now()
);
create index on public.operations_financieres (date_operation desc);
create index on public.operations_financieres (projet_id);

-- Une opération liée à un projet appartient à la commission du projet.
create or replace function public.controler_operation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.projet_id is not null then
    new.commission_id := (select commission_id from public.projets where id = new.projet_id);
  end if;
  if new.date_operation > current_date + 1 then
    raise exception 'La date de l''opération ne peut pas être dans le futur.';
  end if;
  if tg_op = 'INSERT' then
    new.saisi_par := auth.uid();
    new.saisi_le := now();
  else
    new.saisi_par := old.saisi_par;
    new.saisi_le := old.saisi_le;
  end if;
  return new;
end $$;
create trigger operations_controle before insert or update on public.operations_financieres
  for each row execute function public.controler_operation();

alter table public.operations_financieres enable row level security;
create policy "lecture" on public.operations_financieres for select to authenticated
  using (public.peut_gerer_commission(commission_id));
-- Le responsable de commission enregistre les opérations de ses projets ;
-- l'administration enregistre tout. Correction et suppression : administration seulement.
create policy "saisie" on public.operations_financieres for insert to authenticated with check (
  public.est_admin() or (projet_id is not null and public.peut_gerer_projet(projet_id))
);
create policy "correction admin" on public.operations_financieres for update to authenticated
  using (public.est_admin()) with check (public.est_admin());
create policy "suppression admin" on public.operations_financieres for delete to authenticated
  using (public.est_admin());

-- ---------------------------------------------------------------------
-- Hébergement : chambres et affectations
-- ---------------------------------------------------------------------
create table public.chambres (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (length(trim(nom)) between 1 and 60),
  site text not null default '' check (length(site) <= 120),  -- bâtiment ou lieu d'accueil
  capacite int not null check (capacite between 1 and 100),
  sexe char(1) check (sexe in ('M', 'F')),  -- null = chambre mixte ou familiale
  notes text not null default '' check (length(notes) <= 500),
  active boolean not null default true,
  est_demo boolean not null default false,
  cree_le timestamptz not null default now(),
  unique (site, nom)
);

create table public.affectations_chambre (
  id uuid primary key default gen_random_uuid(),
  chambre_id uuid not null references public.chambres(id) on delete restrict,
  membre_id uuid not null references public.membres(id) on delete cascade,
  du date not null,
  au date not null,
  activite_id uuid references public.activites(id) on delete set null,
  notes text not null default '' check (length(notes) <= 300),
  cree_par uuid default auth.uid() references public.profils(id) on delete set null,
  cree_le timestamptz not null default now(),
  constraint au_apres_du check (au >= du and au - du <= 90)
);
create index on public.affectations_chambre (chambre_id, du);
create index on public.affectations_chambre (membre_id);

-- Contrôles : chambre active, sexe, pas de double hébergement, capacité jour par jour.
create or replace function public.controler_affectation()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_c public.chambres;
  v_m public.membres;
  v_max int;
begin
  select * into v_c from public.chambres where id = new.chambre_id;
  select * into v_m from public.membres where id = new.membre_id;
  if not v_c.active then raise exception 'Cette chambre n''est plus utilisée.'; end if;
  if v_m.archive then raise exception 'Ce membre est archivé.'; end if;
  if v_c.sexe is not null and v_m.sexe is null then
    raise exception 'Renseignez le sexe du membre avant de l''affecter à cette chambre.';
  end if;
  if v_c.sexe is not null and v_m.sexe <> v_c.sexe then
    raise exception 'Cette chambre est réservée aux %.', case v_c.sexe when 'M' then 'hommes' else 'femmes' end;
  end if;
  if exists (select 1 from public.affectations_chambre a
              where a.membre_id = new.membre_id and a.id <> new.id and a.du <= new.au and a.au >= new.du) then
    raise exception 'Ce membre a déjà une chambre sur cette période.';
  end if;
  select max(n) into v_max from (
    select (select count(*) from public.affectations_chambre a
             where a.chambre_id = new.chambre_id and a.id <> new.id and d::date between a.du and a.au) as n
      from generate_series(new.du, new.au, interval '1 day') d
  ) t;
  if v_max >= v_c.capacite then
    raise exception 'Chambre complète sur cette période (% places).', v_c.capacite;
  end if;
  if tg_op = 'INSERT' then new.cree_par := auth.uid(); end if;
  return new;
end $$;
create trigger affectations_controle before insert or update on public.affectations_chambre
  for each row execute function public.controler_affectation();

-- Le choriste est prévenu de sa chambre (sans le nom des autres occupants).
create or replace function public.notifier_affectation()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_c public.chambres;
begin
  if tg_op = 'DELETE' then
    perform public.notifier_membre(old.membre_id, 'Votre hébergement a été annulé', '/choriste/chambre');
    return null;
  end if;
  if tg_op = 'UPDATE' and new.chambre_id = old.chambre_id and new.du = old.du and new.au = old.au then
    return null;
  end if;
  select * into v_c from public.chambres where id = new.chambre_id;
  perform public.notifier_membre(new.membre_id,
    'Hébergement : chambre ' || v_c.nom || coalesce(' (' || nullif(v_c.site, '') || ')', '')
      || ' du ' || to_char(new.du, 'DD/MM') || ' au ' || to_char(new.au, 'DD/MM/YYYY'),
    '/choriste/chambre');
  return null;
end $$;
create trigger affectations_notification after insert or update or delete on public.affectations_chambre
  for each row execute function public.notifier_affectation();

alter table public.chambres enable row level security;
alter table public.affectations_chambre enable row level security;

create policy "lecture" on public.chambres for select to authenticated using (
  public.est_admin()
  or exists (select 1 from public.affectations_chambre a where a.chambre_id = chambres.id and a.membre_id = public.mon_membre())
);
create policy "gestion admin" on public.chambres for all to authenticated
  using (public.est_admin()) with check (public.est_admin());

create policy "lecture" on public.affectations_chambre for select to authenticated using (
  public.est_admin() or membre_id = public.mon_membre()
);
create policy "gestion admin" on public.affectations_chambre for all to authenticated
  using (public.est_admin()) with check (public.est_admin());

-- ---------------------------------------------------------------------
-- Répertoire des chants (paroles et liens vers partitions ou enregistrements)
-- ---------------------------------------------------------------------
create table public.chants (
  id uuid primary key default gen_random_uuid(),
  titre text not null check (length(trim(titre)) between 1 and 150),
  auteur text not null default '' check (length(auteur) <= 120),
  langue text not null default 'Français' check (length(trim(langue)) between 2 and 40),
  categorie text not null default '' check (length(categorie) <= 60),
  paroles text not null default '' check (length(paroles) <= 20000),
  voix public.voix[] not null default '{}',  -- vide = toutes les voix
  lien_partition text check (lien_partition is null or (lien_partition ~ '^https://\S+$' and length(lien_partition) <= 500)),
  lien_audio text check (lien_audio is null or (lien_audio ~ '^https://\S+$' and length(lien_audio) <= 500)),
  archive boolean not null default false,
  cree_par uuid default auth.uid() references public.profils(id) on delete set null,
  est_demo boolean not null default false,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
create index on public.chants (lower(titre));
create trigger chants_modifie_le before update on public.chants
  for each row execute function public.maj_modifie_le();

alter table public.chants enable row level security;
create policy "lecture" on public.chants for select to authenticated using (not archive or public.est_staff());
create policy "gestion" on public.chants for all to authenticated
  using (public.est_admin() or public.mon_role() = 'responsable_commission')
  with check (public.est_admin() or public.mon_role() = 'responsable_commission');

-- ---------------------------------------------------------------------
-- Traçabilité
-- ---------------------------------------------------------------------
create trigger journal_commissions after insert or update or delete on public.commissions
  for each row execute function public.journaliser();
create or replace function public.journaliser_lien()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_ligne jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.journal_operations (action, table_nom, enregistrement_id, details)
  values (lower(tg_op), tg_table_name, v_ligne ->> 'membre_id', v_ligne);
  return null;
end $$;
create trigger journal_commission_membres after insert or update or delete on public.commission_membres
  for each row execute function public.journaliser_lien();
create trigger journal_inscriptions after insert or update or delete on public.formation_inscriptions
  for each row execute function public.journaliser_lien();
create trigger journal_formations after insert or update or delete on public.formations
  for each row execute function public.journaliser();
create trigger journal_projets after insert or update or delete on public.projets
  for each row execute function public.journaliser();
create trigger journal_operations_financieres after insert or update or delete on public.operations_financieres
  for each row execute function public.journaliser();
create trigger journal_chambres after insert or update or delete on public.chambres
  for each row execute function public.journaliser();
create trigger journal_affectations after insert or update or delete on public.affectations_chambre
  for each row execute function public.journaliser();
create trigger journal_chants after insert or update or delete on public.chants
  for each row execute function public.journaliser();

-- Droits d'exécution
grant execute on function
  public.peut_gerer_commission(uuid),
  public.mon_membre(),
  public.peut_gerer_formation(uuid),
  public.peut_gerer_projet(uuid)
  to authenticated;
