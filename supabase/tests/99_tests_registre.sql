-- Registre de présence des chorales.
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


\set choraleA '20000000-0000-0000-0000-00000000000a'
\set rc '00000000-0000-0000-0000-0000000000e1'

select pg_temp.affirmer((select count(*) = 3 from public.chorale_horaires where chorale_id = :'choraleA'),
  'chaque chorale a ses jours habituels (lundi, jeudi, dimanche)');
insert into public.chorales (id, nom, paroisse_id) values ('20000000-0000-0000-0000-0000000000e2', 'Chorale E2', '10000000-0000-0000-0000-00000000000b');
select pg_temp.affirmer((select count(*) = 3 from public.chorale_horaires where chorale_id = '20000000-0000-0000-0000-0000000000e2'),
  'une nouvelle chorale reçoit les jours habituels');

insert into auth.users (id, email) values (:'rc', 'resp.registre@test.cd');
update public.profils set role = 'responsable_chorale', chorale_id = :'choraleA' where id = :'rc';
delete from public.notifications;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
-- Un jeudi : répétition à l'heure habituelle
select set_config('t.seance', public.ouvrir_seance(:'choraleA', date '2026-10-29', 'repetition')::text, true);
select pg_temp.affirmer((select titre = 'Répétition — Chorale A' and seance_jour = '2026-10-29'
                           and to_char(debut at time zone 'Africa/Kinshasa', 'HH24:MI') = '17:00'
                           from public.activites where id = current_setting('t.seance')::uuid),
  'le responsable de chorale ouvre le registre du jour, à l''heure habituelle');
select pg_temp.affirmer(public.ouvrir_seance(:'choraleA', date '2026-10-29', 'repetition') = current_setting('t.seance')::uuid,
  'rouvrir le même jour retrouve le même registre');
-- Un jour inhabituel (mardi)
select pg_temp.affirmer(public.ouvrir_seance(:'choraleA', date '2026-10-27', 'repetition', '15:00') <> current_setting('t.seance')::uuid,
  'on peut ouvrir un registre un jour inhabituel');
insert into public.presences (activite_id, membre_id, statut) values (current_setting('t.seance')::uuid, '30000000-0000-0000-0000-00000000000a', 'absent');
select pg_temp.affirmer(true, 'il marque un membre de sa chorale absent');
select pg_temp.refuse($$select public.ouvrir_seance('20000000-0000-0000-0000-0000000000e2', date '2026-10-29', 'repetition')$$,
  'ne pouvez pas', 'pas le registre d''une autre chorale');
update public.chorale_horaires set heure = '18:30' where chorale_id = '20000000-0000-0000-0000-00000000000a' and jour = 1;
select pg_temp.affirmer((select heure = '18:30' from public.chorale_horaires where chorale_id = '20000000-0000-0000-0000-00000000000a' and jour = 1),
  'il change l''heure d''un jour habituel');
with m as (update public.chorale_horaires set heure = '06:00' where chorale_id = '20000000-0000-0000-0000-0000000000e2' returning 1)
select pg_temp.affirmer(count(*) = 0, 'mais pas ceux d''une autre chorale') from m;
select pg_temp.refuse($$select public.ouvrir_seance('20000000-0000-0000-0000-00000000000a', current_date + 30, 'culte')$$,
  'une semaine', 'pas de registre un mois à l''avance');
commit;

select pg_temp.affirmer(not exists (select 1 from public.notifications where titre like '%Répétition%'),
  'ouvrir un registre n''envoie pas de notification');

-- Le choriste voit son absence
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.affirmer(exists (select 1 from public.presences p join public.activites a on a.id = p.activite_id
                                 where p.statut = 'absent' and a.seance_type = 'repetition'),
  'le choriste voit son absence à la répétition');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
select public.supprimer_seance(id) from public.activites where seance_chorale = '20000000-0000-0000-0000-00000000000a';
select pg_temp.affirmer(not exists (select 1 from public.activites where seance_chorale = '20000000-0000-0000-0000-00000000000a'),
  'il retire un registre ouvert par erreur');
commit;

update public.profils set role = 'choriste' where id = :'rc';
delete from public.chorales where id = '20000000-0000-0000-0000-0000000000e2';
