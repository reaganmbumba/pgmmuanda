-- =====================================================================
-- PGM MUANDA DIGITAL — Étape 8 : protection de la connexion
-- À exécuter après 20261030000100_organisation.sql
--
-- Après 5 mots de passe faux en 15 minutes pour un même identifiant,
-- la connexion à ce compte est suspendue 15 minutes. Ces fonctions ne
-- sont appelables que par le serveur de l'application (clé service_role).
-- =====================================================================

create table public.tentatives_connexion (
  id bigint generated always as identity primary key,
  cle text not null,
  cree_le timestamptz not null default now()
);
create index on public.tentatives_connexion (cle, cree_le desc);
-- Aucune règle d'accès : illisible par les utilisateurs, même connectés.
alter table public.tentatives_connexion enable row level security;
revoke all on public.tentatives_connexion from anon, authenticated;

create or replace function public.connexion_bloquee(p_cle text)
returns boolean language sql stable security definer set search_path = '' as $$
  select count(*) >= 5 from public.tentatives_connexion
   where cle = lower(trim(p_cle)) and cree_le > now() - interval '15 minutes';
$$;

create or replace function public.noter_echec_connexion(p_cle text)
returns void language sql security definer set search_path = '' as $$
  delete from public.tentatives_connexion where cree_le < now() - interval '1 day';
  insert into public.tentatives_connexion (cle) values (left(lower(trim(p_cle)), 200));
$$;

create or replace function public.effacer_echecs_connexion(p_cle text)
returns void language sql security definer set search_path = '' as $$
  delete from public.tentatives_connexion where cle = lower(trim(p_cle));
$$;

revoke execute on function public.connexion_bloquee(text), public.noter_echec_connexion(text),
  public.effacer_echecs_connexion(text) from public, anon, authenticated;
grant execute on function public.connexion_bloquee(text), public.noter_echec_connexion(text),
  public.effacer_echecs_connexion(text) to service_role;
