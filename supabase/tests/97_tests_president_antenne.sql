-- Compte Président de l'antenne : voit tout, ne modifie rien.
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
\set pres '00000000-0000-0000-0000-0000000000a1'

insert into auth.users (id, email) values (:'pres', 'president.antenne@test.cd');
update public.profils set role = 'president_antenne', identifiant = 'president.antenne' where id = :'pres';

-- Données que seule l'administration voit d'habitude
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';  -- admin
insert into public.sanctions (membre_id, type, manquement, date_faits, defense_entendue)
values (:'membreB', 'avertissement', 'Test président', current_date, true);
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';  -- président de l'antenne
select pg_temp.affirmer((select count(*) from public.membres) = (select count(*) from public.membres where true)
  and (select count(distinct paroisse_id) from public.membres) >= 2, 'il voit les membres de toutes les paroisses');
select pg_temp.affirmer(exists (select 1 from public.sanctions where manquement = 'Test président'), 'il voit les sanctions, comme l''administration');
select pg_temp.affirmer((select count(*) from public.profils) > 1, 'il voit la liste des comptes');
select pg_temp.affirmer(not public.est_admin() and not public.peut_suivre_finances(), 'il n''est pas administrateur');
select pg_temp.refuse($$insert into public.sanctions (membre_id, type, manquement, date_faits, defense_entendue)
  values ('30000000-0000-0000-0000-00000000000a', 'blame', 'x', current_date, true)$$, null, 'il ne note pas de sanction');
with m as (update public.membres set nom = 'Modifié' returning 1)
select pg_temp.affirmer(count(*) = 0, 'il ne modifie aucune fiche de membre') from m;
select pg_temp.refuse($$insert into public.paroisses (nom) values ('Paroisse pirate')$$, null, 'il ne crée pas de paroisse');
with p as (update public.profils set role = 'super_admin' where id = '00000000-0000-0000-0000-0000000000a1' returning 1)
select pg_temp.affirmer(count(*) = 0, 'il ne peut pas se donner plus de droits') from p;
select pg_temp.refuse($$insert into public.operations_financieres (sens, libelle, categorie, montant, devise, date_operation)
  values ('depense', 'x', 'x', 10, 'CDF', current_date)$$, null, 'il n''enregistre pas d''argent');
select pg_temp.refuse($$insert into public.reunions (type, titre, debut, ordre_du_jour) values ('conseil', 'x', now() + interval '1 day', '1. x')$$,
  null, 'il ne convoque pas de réunion');
with s as (delete from public.sanctions returning 1)
select pg_temp.affirmer(count(*) = 0, 'il ne supprime rien') from s;
select pg_temp.refuse($$select public.rappeler_absences('30000000-0000-0000-0000-00000000000a', 3)$$, null, 'il n''envoie pas de rappel');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';  -- resp. paroisse A
select pg_temp.affirmer(not public.est_president_antenne() and not exists (select 1 from public.sanctions),
  'les autres comptes ne gagnent aucun droit');
commit;

select 'Tous les tests du compte Président de l''antenne sont passés.';
