-- Conseil de la PGM et réunions (Cadre général, art. 20 à 31) :
-- 1. les fonctions du Conseil (art. 28), avec un mandat de 4 ans renouvelable (art. 29) ;
-- 2. les réunions du Conseil et les Assemblées générales : convocation avec ordre du jour,
--    au moins 15 jours à l'avance pour une Assemblée (art. 21), feuille de présence et
--    compte rendu (art. 23), quorum de 50 % pour le Conseil (art. 30).

-- ---------------------------------------------------------------------
-- Mandats au Conseil
-- ---------------------------------------------------------------------
create table public.conseil_mandats (
  id uuid primary key default gen_random_uuid(),
  membre_id uuid not null references public.membres(id) on delete cascade,
  fonction text not null check (fonction in ('president', 'administration', 'secretaire', 'finances', 'caisse',
    'technique', 'social', 'juridique', 'discipline', 'relations', 'presse')),
  adjoint boolean not null default false,
  debut date not null default current_date,
  fin date not null,
  cree_par uuid default auth.uid() references public.profils(id) on delete set null,
  cree_le timestamptz not null default now(),
  constraint pas_adjoint_president check (not (fonction = 'president' and adjoint)),
  constraint fin_apres_debut check (fin > debut)
);
create index on public.conseil_mandats (membre_id);

-- Une seule personne à la fois par fonction (titulaire ou adjoint).
create or replace function public.controler_mandat()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.conseil_mandats m
              where m.fonction = new.fonction and m.adjoint = new.adjoint and m.id <> new.id
                and daterange(m.debut, m.fin) && daterange(new.debut, new.fin)) then
    raise exception 'Cette fonction est déjà occupée sur cette période. Terminez d''abord le mandat en cours.';
  end if;
  return new;
end $$;
create trigger mandats_controle before insert or update on public.conseil_mandats
  for each row execute function public.controler_mandat();
create trigger journal_conseil_mandats after insert or update or delete on public.conseil_mandats
  for each row execute function public.journaliser();

alter table public.conseil_mandats enable row level security;
-- La composition du Conseil n'est pas secrète : tout membre connecté peut la lire.
create policy "lecture" on public.conseil_mandats for select to authenticated using (true);
create policy "administration" on public.conseil_mandats for all to authenticated
  using (public.est_admin()) with check (public.est_admin());

-- Membre du Conseil aujourd'hui (pour lire ses convocations)
create or replace function public.est_au_conseil()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.conseil_mandats c join public.membres m on m.id = c.membre_id
                  where m.profil_id = auth.uid() and current_date >= c.debut and current_date < c.fin);
$$;
grant execute on function public.est_au_conseil() to authenticated;

-- ---------------------------------------------------------------------
-- Réunions et Assemblées générales
-- ---------------------------------------------------------------------
create type public.type_reunion as enum ('conseil', 'ag_ordinaire', 'ag_extraordinaire');

create table public.reunions (
  id uuid primary key default gen_random_uuid(),
  type public.type_reunion not null,
  titre text not null check (length(trim(titre)) between 2 and 150),
  debut timestamptz not null,
  lieu text not null default '' check (length(lieu) <= 150),
  ordre_du_jour text not null check (length(trim(ordre_du_jour)) between 2 and 4000),
  statut text not null default 'convoquee' check (statut in ('convoquee', 'tenue', 'annulee')),
  compte_rendu text not null default '' check (length(compte_rendu) <= 20000),
  convoque_par uuid default auth.uid() references public.profils(id) on delete set null,
  convoque_par_nom text not null default '',
  cree_le timestamptz not null default now()
);
create index on public.reunions (debut desc);

create or replace function public.controler_reunion()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.convoque_par := auth.uid();
    new.convoque_par_nom := coalesce((select nom_affiche from public.profils where id = auth.uid()), '');
    new.cree_le := now();
  else
    new.type := old.type;
    new.convoque_par := old.convoque_par;
    new.convoque_par_nom := old.convoque_par_nom;
    new.cree_le := old.cree_le;
    -- Art. 21 : seuls les points de l'ordre du jour peuvent faire l'objet d'une décision.
    if new.ordre_du_jour <> old.ordre_du_jour then
      raise exception 'L''ordre du jour ne se change pas après la convocation. Annulez et convoquez à nouveau.';
    end if;
  end if;
  if new.type <> 'conseil' and (tg_op = 'INSERT' or new.debut <> old.debut)
     and new.debut < now() + interval '15 days' then
    raise exception 'Article 21 : une Assemblée générale se convoque au moins 15 jours à l''avance.';
  end if;
  return new;
end $$;
create trigger reunions_controle before insert or update on public.reunions
  for each row execute function public.controler_reunion();
create trigger journal_reunions after insert or update or delete on public.reunions
  for each row execute function public.journaliser();

-- Convocation : le Conseil pour une réunion du Conseil ; le Conseil et tout le staff pour une Assemblée.
create or replace function public.convoquer_reunion()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_profil uuid;
  v_role public.role_utilisateur;
begin
  for v_profil, v_role in
    select p.id, p.role from public.profils p
     where p.actif and (
       exists (select 1 from public.conseil_mandats c join public.membres m on m.id = c.membre_id
                where m.profil_id = p.id and new.debut::date >= c.debut and new.debut::date < c.fin)
       or (new.type <> 'conseil' and p.role <> 'choriste'))
  loop
    perform public.notifier(v_profil,
      'Convocation : ' || new.titre || ' le ' || to_char(new.debut at time zone 'Africa/Kinshasa', 'DD/MM/YYYY à HH24"h"MI'),
      case when v_role = 'choriste' then '/choriste/reunions' else '/staff/reunions/' || new.id end);
  end loop;
  return null;
end $$;
create trigger reunions_convocation after insert on public.reunions
  for each row execute function public.convoquer_reunion();

alter table public.reunions enable row level security;
create policy "lecture" on public.reunions for select to authenticated using (
  public.mon_role() <> 'choriste' or public.est_au_conseil()
);
create policy "administration" on public.reunions for all to authenticated
  using (public.est_admin()) with check (public.est_admin());

-- Feuille de présence (art. 23)
create table public.reunion_presences (
  reunion_id uuid not null references public.reunions(id) on delete cascade,
  membre_id uuid not null references public.membres(id) on delete cascade,
  statut public.statut_presence not null,
  saisi_le timestamptz not null default now(),
  primary key (reunion_id, membre_id)
);
alter table public.reunion_presences enable row level security;
create policy "lecture" on public.reunion_presences for select to authenticated using (
  public.mon_role() <> 'choriste'
  or exists (select 1 from public.membres m where m.id = membre_id and m.profil_id = auth.uid())
);
create policy "administration" on public.reunion_presences for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
create trigger journal_reunion_presences after insert or update or delete on public.reunion_presences
  for each row execute function public.journaliser();

-- Composition du Conseil à une date (aujourd'hui par défaut), avec les noms : information
-- publique pour les membres, sans ouvrir les fiches des membres elles-mêmes.
create or replace function public.conseil_actuel(p_jour date default current_date)
returns table (mandat_id uuid, membre_id uuid, nom text, fonction text, adjoint boolean, debut date, fin date)
language sql stable security definer set search_path = '' as $$
  select c.id, c.membre_id, trim(m.prenom || ' ' || m.nom || ' ' || m.postnom), c.fonction, c.adjoint, c.debut, c.fin
    from public.conseil_mandats c join public.membres m on m.id = c.membre_id
   where auth.uid() is not null and p_jour >= c.debut and p_jour < c.fin
   order by c.fonction, c.adjoint;
$$;
grant execute on function public.conseil_actuel(date) to authenticated;
