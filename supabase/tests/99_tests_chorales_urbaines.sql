-- Chorales urbaines : sans paroisse, ouvertes aux membres de toutes les paroisses.
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


\set urb '20000000-0000-0000-0000-0000000000f1'
\set ru '00000000-0000-0000-0000-0000000000f1'
\set pA '10000000-0000-0000-0000-00000000000a'
\set pB '10000000-0000-0000-0000-00000000000b'

-- Le responsable de paroisse ne crée pas de chorale urbaine
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.refuse($$insert into public.chorales (nom, paroisse_id) values ('Oracle Test', null)$$,
  null, 'un responsable de paroisse ne crée pas de chorale urbaine');
commit;

-- L'administration la crée
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.chorales (id, nom, paroisse_id) values (:'urb', 'Oracle Test', null);
select pg_temp.affirmer(true, 'l''administration crée une chorale urbaine');
select pg_temp.refuse($$insert into public.chorales (nom, paroisse_id) values ('oracle test', null)$$,
  'chorales_urbaines_nom_unique', 'pas deux chorales urbaines du même nom');
-- Des membres de deux paroisses dans la même chorale urbaine
insert into public.membres (id, nom, prenom, paroisse_id, chorale_id) values
  ('30000000-0000-0000-0000-0000000000f1', 'Kiese', 'Anne', :'pA', :'urb'),
  ('30000000-0000-0000-0000-0000000000f2', 'Mbuta', 'Jean', :'pB', :'urb');
select pg_temp.affirmer(true, 'des membres de deux paroisses chantent dans la chorale urbaine');
select pg_temp.refuse($$insert into public.membres (nom, prenom, paroisse_id, chorale_id) values ('X', 'Y', '10000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-00000000000a')$$,
  'n''appartient pas', 'une chorale de paroisse reste réservée à sa paroisse');
commit;

-- Responsable de la chorale urbaine : pas de paroisse, gère seulement sa chorale
insert into auth.users (id, email) values (:'ru', 'resp.urbain@test.cd');
update public.profils set role = 'responsable_chorale', chorale_id = :'urb' where id = :'ru';
select pg_temp.affirmer((select paroisse_id is null from public.profils where id = :'ru'), 'le responsable de chorale urbaine n''a pas de paroisse');

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
select pg_temp.affirmer((select count(*) = 2 and bool_and(chorale_id = '20000000-0000-0000-0000-0000000000f1') from public.membres),
  'il voit les membres de sa chorale, de toutes les paroisses');
insert into public.membres (nom, prenom, paroisse_id, chorale_id) values ('Nzuzi', 'Paul', :'pB', :'urb');
select pg_temp.affirmer(true, 'il inscrit un membre de n''importe quelle paroisse dans sa chorale');
select pg_temp.refuse($$insert into public.membres (nom, prenom, paroisse_id) values ('X', 'Y', '10000000-0000-0000-0000-00000000000a')$$,
  null, 'mais pas un membre hors de sa chorale');
commit;

-- Le responsable de paroisse voit le membre de sa paroisse qui chante en chorale urbaine
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.affirmer(exists (select 1 from public.membres where id = '30000000-0000-0000-0000-0000000000f1'),
  'le responsable de paroisse voit son membre de la chorale urbaine');
select pg_temp.affirmer(not exists (select 1 from public.membres where id = '30000000-0000-0000-0000-0000000000f2'),
  'mais pas celui d''une autre paroisse');
commit;

update public.profils set role = 'choriste' where id = :'ru';
delete from public.membres where chorale_id = :'urb';
delete from public.chorales where id = :'urb';
