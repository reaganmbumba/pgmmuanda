-- Compte Responsable de chorale : gère sa chorale seulement.
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


\set rc '00000000-0000-0000-0000-0000000000c1'
\set choraleA '20000000-0000-0000-0000-00000000000a'
\set choraleA2 '20000000-0000-0000-0000-0000000000a2'

insert into public.chorales (id, nom, paroisse_id) values (:'choraleA2', 'Chorale A2', '10000000-0000-0000-0000-00000000000a');
insert into auth.users (id, email) values (:'rc', 'resp.chorale@test.cd');
select pg_temp.refuse($$update public.profils set role = 'responsable_chorale' where id = '00000000-0000-0000-0000-0000000000c1'$$,
  'perimetre_chorale', 'un responsable de chorale doit avoir sa chorale');
update public.profils set role = 'responsable_chorale', chorale_id = :'choraleA' where id = :'rc';
select pg_temp.affirmer((select paroisse_id = '10000000-0000-0000-0000-00000000000a' from public.profils where id = :'rc'),
  'sa paroisse est celle de sa chorale');
-- Un membre de la même paroisse, mais d'une autre chorale
insert into public.membres (id, nom, prenom, paroisse_id, chorale_id) values
  ('30000000-0000-0000-0000-0000000000a2', 'Mavinga', 'Ruth', '10000000-0000-0000-0000-00000000000a', :'choraleA2');
insert into public.activites (id, titre, debut) values ('40000000-0000-0000-0000-0000000000c1', 'Répétition chorale', now());

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';  -- responsable de la Chorale A
select pg_temp.affirmer((select count(*) > 0 and bool_and(chorale_id = '20000000-0000-0000-0000-00000000000a') from public.membres),
  'il ne voit que les membres de sa chorale');
insert into public.membres (nom, prenom, paroisse_id, chorale_id) values ('Nsimba', 'Paul', '10000000-0000-0000-0000-00000000000a', :'choraleA');
select pg_temp.affirmer(true, 'il inscrit un membre dans sa chorale');
select pg_temp.refuse($$insert into public.membres (nom, prenom, paroisse_id, chorale_id) values ('X', 'Y', '10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-0000000000a2')$$,
  null, 'pas dans une autre chorale');
select pg_temp.refuse($$insert into public.membres (nom, prenom, paroisse_id) values ('X', 'Y', '10000000-0000-0000-0000-00000000000a')$$,
  null, 'ni sans chorale');
with m as (update public.membres set nom = 'Changé' where id = '30000000-0000-0000-0000-0000000000a2' returning 1)
select pg_temp.affirmer(count(*) = 0, 'il ne modifie pas un membre d''une autre chorale') from m;
select pg_temp.refuse($$update public.membres set chorale_id = '20000000-0000-0000-0000-0000000000a2' where id = '30000000-0000-0000-0000-00000000000a'$$,
  null, 'il ne déplace pas un membre hors de sa chorale');
insert into public.presences (activite_id, membre_id, statut) values ('40000000-0000-0000-0000-0000000000c1', '30000000-0000-0000-0000-00000000000a', 'present');
select pg_temp.affirmer(true, 'il pointe la présence d''un membre de sa chorale');
select pg_temp.refuse($$insert into public.presences (activite_id, membre_id, statut) values ('40000000-0000-0000-0000-0000000000c1', '30000000-0000-0000-0000-0000000000a2', 'present')$$,
  null, 'pas celle d''un membre d''une autre chorale');
select pg_temp.refuse($$insert into public.chorales (nom, paroisse_id) values ('Nouvelle', '10000000-0000-0000-0000-00000000000a')$$,
  null, 'il ne crée pas de chorale');
select pg_temp.refuse($$select public.rappeler_absences('30000000-0000-0000-0000-0000000000a2', 2)$$, 'hors de votre', 'pas de rappel hors de sa chorale');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';  -- resp. paroisse A
select pg_temp.affirmer(exists (select 1 from public.membres where id = '30000000-0000-0000-0000-0000000000a2'),
  'le responsable de paroisse voit toujours toute sa paroisse');
commit;

update public.profils set role = 'choriste' where id = :'rc';
select pg_temp.affirmer((select chorale_id is null from public.profils where id = :'rc'), 'la chorale est retirée quand le rôle change');
delete from public.presences where activite_id = '40000000-0000-0000-0000-0000000000c1';
delete from public.activites where id = '40000000-0000-0000-0000-0000000000c1';
