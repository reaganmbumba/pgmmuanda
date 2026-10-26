-- =====================================================================
-- PGM MUANDA DIGITAL — Étape 2 : schéma initial
-- Tables de base, matricules automatiques, historique et journal.
-- À exécuter dans Supabase › SQL Editor (ou `supabase db push`).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------
create type public.role_utilisateur as enum (
  'super_admin',            -- toute la plateforme
  'presidence',             -- présidence PGM
  'responsable_paroisse',   -- sa paroisse
  'responsable_commission', -- sa commission
  'controleur',             -- scanner uniquement
  'choriste'                -- ses propres données
);
create type public.voix as enum ('soprano', 'alto', 'tenor', 'basse');
create type public.statut_membre as enum ('en_attente', 'actif', 'inactif', 'suspendu');
create type public.statut_carte as enum ('active', 'revoquee', 'remplacee');
create type public.resultat_verification as enum ('valide', 'revoquee', 'inconnue');

-- ---------------------------------------------------------------------
-- Fonctions utilitaires
-- ---------------------------------------------------------------------
create or replace function public.maj_modifie_le()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.modifie_le := now();
  return new;
end $$;

-- Référence aléatoire de 22 caractères (base64url), sans lien avec le matricule.
create or replace function public.nouvelle_reference_qr()
returns text language sql volatile set search_path = '' as $$
  select replace(replace(rtrim(encode(extensions.gen_random_bytes(16), 'base64'), '='), '+', '-'), '/', '_');
$$;

-- ---------------------------------------------------------------------
-- Organisation
-- ---------------------------------------------------------------------
create table public.paroisses (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique check (length(trim(nom)) between 2 and 120),
  ville text not null default 'Muanda',
  est_demo boolean not null default false,
  cree_le timestamptz not null default now()
);

create table public.chorales (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (length(trim(nom)) between 2 and 120),
  paroisse_id uuid not null references public.paroisses(id) on delete restrict,
  est_demo boolean not null default false,
  cree_le timestamptz not null default now(),
  unique (paroisse_id, nom)
);
create index on public.chorales (paroisse_id);

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique check (length(trim(nom)) between 2 and 120),
  description text,
  est_demo boolean not null default false,
  cree_le timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Comptes : un profil par utilisateur Supabase Auth
-- ---------------------------------------------------------------------
create table public.profils (
  id uuid primary key references auth.users(id) on delete cascade,
  identifiant text unique check (identifiant ~ '^[a-z0-9._-]{3,40}$'),
  nom_affiche text not null default '',
  role public.role_utilisateur not null default 'choriste',
  paroisse_id uuid references public.paroisses(id) on delete set null,
  commission_id uuid references public.commissions(id) on delete set null,
  actif boolean not null default true,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint perimetre_paroisse check (role <> 'responsable_paroisse' or paroisse_id is not null),
  constraint perimetre_commission check (role <> 'responsable_commission' or commission_id is not null)
);
create trigger profils_modifie_le before update on public.profils
  for each row execute function public.maj_modifie_le();

-- Tout nouveau compte reçoit un profil « choriste » (le moins de droits).
-- Le rôle n'est jamais lu depuis les métadonnées fournies par l'utilisateur.
create or replace function public.creer_profil_pour_nouvel_utilisateur()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profils (id, nom_affiche)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nom_affiche', split_part(new.email, '@', 1)));
  return new;
end $$;
create trigger nouvel_utilisateur after insert on auth.users
  for each row execute function public.creer_profil_pour_nouvel_utilisateur();

-- ---------------------------------------------------------------------
-- Fonctions de rôle (utilisées par les règles RLS)
-- ---------------------------------------------------------------------
create or replace function public.mon_role()
returns public.role_utilisateur language sql stable security definer set search_path = '' as $$
  select role from public.profils where id = auth.uid() and actif;
$$;

create or replace function public.ma_paroisse()
returns uuid language sql stable security definer set search_path = '' as $$
  select paroisse_id from public.profils where id = auth.uid() and actif;
$$;

create or replace function public.est_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.mon_role() in ('super_admin', 'presidence'), false);
$$;

create or replace function public.est_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.mon_role() <> 'choriste', false);
$$;

create or replace function public.peut_gerer_paroisse(p_paroisse uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.est_admin()
      or (public.mon_role() = 'responsable_paroisse' and public.ma_paroisse() = p_paroisse);
$$;

-- ---------------------------------------------------------------------
-- Membres (choristes)
-- ---------------------------------------------------------------------
create sequence public.matricule_seq start 1;

create table public.membres (
  id uuid primary key default gen_random_uuid(),
  -- Attribué par la base : deux inscriptions simultanées ne peuvent pas recevoir le même numéro.
  matricule text not null unique
    default 'PGM-MUA-' || lpad(nextval('public.matricule_seq')::text, 4, '0'),
  profil_id uuid unique references public.profils(id) on delete set null,
  nom text not null check (length(trim(nom)) between 1 and 80),
  postnom text not null default '' check (length(postnom) <= 80),
  prenom text not null check (length(trim(prenom)) between 1 and 80),
  photo_url text,
  sexe char(1) check (sexe in ('M', 'F')),
  telephone text check (telephone is null or telephone ~ '^\+?[0-9 ]{6,20}$'),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  paroisse_id uuid not null references public.paroisses(id) on delete restrict,
  chorale_id uuid references public.chorales(id) on delete set null,
  voix public.voix,
  fonction text not null default 'Choriste',
  date_adhesion date not null default current_date,
  statut public.statut_membre not null default 'en_attente',
  archive boolean not null default false,
  est_demo boolean not null default false,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
create index on public.membres (paroisse_id);
create index on public.membres (statut);
create index on public.membres (lower(nom), lower(prenom));

create or replace function public.controler_membre()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.matricule <> old.matricule then
    raise exception 'Le matricule ne peut pas être modifié.';
  end if;
  if new.chorale_id is not null and not exists (
    select 1 from public.chorales c where c.id = new.chorale_id and c.paroisse_id = new.paroisse_id
  ) then
    raise exception 'La chorale n''appartient pas à la paroisse du membre.';
  end if;
  return new;
end $$;
create trigger membres_controle before insert or update on public.membres
  for each row execute function public.controler_membre();
create trigger membres_modifie_le before update on public.membres
  for each row execute function public.maj_modifie_le();

-- Historique des modifications et nominations
create table public.membre_historique (
  id bigint generated always as identity primary key,
  membre_id uuid not null references public.membres(id) on delete cascade,
  type text not null check (type in ('creation', 'modification', 'nomination', 'statut', 'archivage')),
  avant jsonb,
  apres jsonb,
  auteur_id uuid default auth.uid(),
  cree_le timestamptz not null default now()
);
create index on public.membre_historique (membre_id, cree_le desc);

create or replace function public.historiser_membre()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_type text;
  v_avant jsonb;
  v_apres jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.membre_historique (membre_id, type, apres)
    values (new.id, 'creation', to_jsonb(new));
    return new;
  end if;
  -- Ne garder que les champs réellement modifiés
  select jsonb_object_agg(a.key, a.value), jsonb_object_agg(a.key, n.value)
    into v_avant, v_apres
    from jsonb_each(to_jsonb(old)) a
    join jsonb_each(to_jsonb(new)) n using (key)
   where a.value is distinct from n.value and a.key <> 'modifie_le';
  if v_avant is null then
    return new;
  end if;
  v_type := case
    when new.archive is distinct from old.archive then 'archivage'
    when new.statut is distinct from old.statut then 'statut'
    when new.fonction is distinct from old.fonction then 'nomination'
    else 'modification' end;
  insert into public.membre_historique (membre_id, type, avant, apres)
  values (new.id, v_type, v_avant, v_apres);
  return new;
end $$;
create trigger membres_historique after insert or update on public.membres
  for each row execute function public.historiser_membre();

-- Demandes de correction faites par le choriste
create table public.demandes_correction (
  id uuid primary key default gen_random_uuid(),
  membre_id uuid not null references public.membres(id) on delete cascade,
  champ text not null check (champ in ('nom', 'postnom', 'prenom', 'telephone', 'email', 'photo', 'voix', 'chorale', 'autre')),
  valeur_proposee text not null check (length(valeur_proposee) between 1 and 500),
  motif text check (length(motif) <= 500),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'acceptee', 'refusee')),
  traitee_par uuid references public.profils(id) on delete set null,
  traitee_le timestamptz,
  cree_le timestamptz not null default now()
);
create index on public.demandes_correction (membre_id);

-- ---------------------------------------------------------------------
-- Cartes et vérifications
-- ---------------------------------------------------------------------
create table public.cartes (
  id uuid primary key default gen_random_uuid(),
  membre_id uuid not null references public.membres(id) on delete cascade,
  reference_qr text not null unique default public.nouvelle_reference_qr(),
  statut public.statut_carte not null default 'active',
  date_emission timestamptz not null default now(),
  revoquee_le timestamptz,
  motif_revocation text,
  remplace_carte_id uuid references public.cartes(id) on delete set null,
  emise_par uuid default auth.uid()
);
-- Une seule carte active par membre
create unique index cartes_une_active on public.cartes (membre_id) where statut = 'active';

create table public.verifications (
  id bigint generated always as identity primary key,
  carte_id uuid references public.cartes(id) on delete set null,
  reference_saisie text not null,
  resultat public.resultat_verification not null,
  verifie_par uuid default auth.uid(),
  cree_le timestamptz not null default now()
);
create index on public.verifications (cree_le desc);

-- ---------------------------------------------------------------------
-- Notifications et journal des opérations
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profil_id uuid not null references public.profils(id) on delete cascade,
  titre text not null,
  lien text,
  lue boolean not null default false,
  cree_le timestamptz not null default now()
);
create index on public.notifications (profil_id, lue, cree_le desc);

create table public.journal_operations (
  id bigint generated always as identity primary key,
  auteur_id uuid default auth.uid(),
  action text not null,
  table_nom text not null,
  enregistrement_id text,
  details jsonb,
  cree_le timestamptz not null default now()
);
create index on public.journal_operations (cree_le desc);

create or replace function public.journaliser()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_ligne jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.journal_operations (action, table_nom, enregistrement_id, details)
  values (lower(tg_op), tg_table_name, v_ligne ->> 'id',
          case when tg_op = 'UPDATE' then jsonb_build_object('avant', to_jsonb(old), 'apres', to_jsonb(new)) else v_ligne end);
  return null;
end $$;

create trigger journal_profils after insert or update or delete on public.profils
  for each row execute function public.journaliser();
create trigger journal_membres after insert or update or delete on public.membres
  for each row execute function public.journaliser();
create trigger journal_cartes after insert or update or delete on public.cartes
  for each row execute function public.journaliser();
create trigger journal_paroisses after insert or update or delete on public.paroisses
  for each row execute function public.journaliser();
