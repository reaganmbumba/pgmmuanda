-- Conseil et réunions. Comptes : ...a admin, ...b resp. paroisse A, ...c choriste A (membre ...a),
-- ...d contrôleur, ...e choriste B (membre ...b), ...f resp. commission X.
\set ON_ERROR_STOP on

create or replace function pg_temp.affirmer(condition boolean, message text) returns void
language plpgsql as $$ begin
  if not coalesce(condition, false) then raise exception 'ÉCHEC : %', message; end if;
  raise notice 'OK : %', message;
end $$;

create or replace function pg_temp.refuse(requete text, attendu text, message text) returns void
language plpgsql as $$ begin
  execute requete;
  raise exception 'ÉCHEC : % (aucune erreur)', message;
exception when others then
  if sqlerrm like 'ÉCHEC%' then raise; end if;
  if attendu is not null and sqlerrm not like '%' || attendu || '%' then
    raise exception 'ÉCHEC : % (erreur inattendue : %)', message, sqlerrm;
  end if;
  raise notice 'OK : %', message;
end $$;

\set membreA '30000000-0000-0000-0000-00000000000a'
\set membreB '30000000-0000-0000-0000-00000000000b'
delete from public.notifications;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';  -- admin
insert into public.conseil_mandats (membre_id, fonction, debut, fin)
values (:'membreA', 'secretaire', current_date - 10, current_date - 10 + interval '4 years');
select pg_temp.refuse($$insert into public.conseil_mandats (membre_id, fonction, debut, fin)
  values ('30000000-0000-0000-0000-00000000000b', 'secretaire', current_date, current_date + interval '4 years')$$,
  'déjà occupée', 'une fonction n''a qu''un titulaire à la fois');
insert into public.conseil_mandats (membre_id, fonction, adjoint, debut, fin)
values (:'membreB', 'secretaire', true, current_date, current_date + interval '4 years');
select pg_temp.affirmer((select count(*) = 2 from public.conseil_actuel()), 'le titulaire et son adjoint siègent ensemble');
select pg_temp.refuse($$insert into public.conseil_mandats (membre_id, fonction, adjoint, debut, fin)
  values ('30000000-0000-0000-0000-00000000000b', 'president', true, current_date, current_date + 1)$$,
  'pas_adjoint_president', 'le Président n''a pas d''adjoint');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';  -- resp. paroisse A
select pg_temp.affirmer((select count(*) = 2 and bool_and(nom <> '') from public.conseil_actuel()),
  'le staff voit la composition du Conseil, avec les noms, même hors de sa paroisse');
select pg_temp.refuse($$insert into public.conseil_mandats (membre_id, fonction, debut, fin)
  values ('30000000-0000-0000-0000-00000000000b', 'presse', current_date, current_date + 1)$$,
  'row-level security', 'seule l''administration nomme au Conseil');
commit;

-- Réunions
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select pg_temp.refuse($$insert into public.reunions (type, titre, debut, ordre_du_jour)
  values ('ag_ordinaire', 'AG 2027', now() + interval '10 days', '1. Rapport')$$,
  'Article 21', 'une Assemblée générale se convoque au moins 15 jours à l''avance');
insert into public.reunions (type, titre, debut, ordre_du_jour)
values ('ag_ordinaire', 'AG 2027', now() + interval '20 days', '1. Rapport financier');
insert into public.reunions (id, type, titre, debut, ordre_du_jour)
values ('a0000000-0000-0000-0000-00000000000a', 'conseil', 'Réunion du Conseil', now() + interval '2 days', '1. Budget');
select pg_temp.refuse($$update public.reunions set ordre_du_jour = 'Autre chose' where type = 'conseil'$$,
  'ordre du jour', 'l''ordre du jour ne change pas après la convocation');
commit;

select pg_temp.affirmer((select count(*) = 1 from public.notifications n
   where n.profil_id = '00000000-0000-0000-0000-00000000000c' and n.titre like 'Convocation : Réunion du Conseil%' and n.lien = '/choriste/reunions'),
  'le membre du Conseil (choriste) est convoqué à la réunion du Conseil');
select pg_temp.affirmer((select count(*) = 0 from public.notifications n
   where n.profil_id = '00000000-0000-0000-0000-00000000000b' and n.titre like 'Convocation : Réunion du Conseil%'),
  'le staff hors Conseil n''est pas convoqué au Conseil');
select pg_temp.affirmer((select count(*) = 1 from public.notifications n
   where n.profil_id = '00000000-0000-0000-0000-00000000000b' and n.titre like 'Convocation : AG 2027%'),
  'tout le staff est convoqué à l''Assemblée générale');

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';  -- choriste A, au Conseil
select pg_temp.affirmer((select count(*) = 2 from public.reunions), 'un membre du Conseil lit ses convocations');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';  -- choriste B, adjoint au Conseil
select pg_temp.affirmer((select count(*) = 2 from public.reunions), 'l''adjoint aussi');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
delete from public.conseil_mandats where adjoint;
insert into public.reunion_presences (reunion_id, membre_id, statut) values ('a0000000-0000-0000-0000-00000000000a', :'membreA', 'present');
update public.reunions set statut = 'tenue', compte_rendu = 'Budget adopté.' where type = 'conseil';
select pg_temp.affirmer((select statut = 'tenue' from public.reunions where type = 'conseil'), 'l''administration note le compte rendu');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';  -- choriste B, plus au Conseil
select pg_temp.affirmer((select count(*) = 0 from public.reunions), 'un choriste hors du Conseil ne voit pas les réunions');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.refuse($$insert into public.reunion_presences (reunion_id, membre_id, statut)
  values ('a0000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000b', 'present')$$,
  'row-level security', 'seule l''administration tient la feuille de présence');
commit;

\echo 'Tous les tests du Conseil et des réunions sont passés.'
