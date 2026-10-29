-- Discipline : sanctions et rappels d'absence. Comptes : ...a admin, ...b resp. paroisse A,
-- ...c choriste A (membre ...a, paroisse A), ...d contrôleur, ...e choriste B (membre ...b, paroisse B),
-- ...f resp. commission X.
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

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';  -- admin
insert into public.sanctions (membre_id, type, manquement, date_faits, defense_entendue)
values (:'membreA', 'avertissement', 'Toute absence ou retard non justifié', current_date - 3, true);
select pg_temp.affirmer((select decide_par_nom = (select nom_affiche from public.profils where id = auth.uid()) from public.sanctions),
  'l''administration note une sanction, signée de son nom');
select pg_temp.refuse($$insert into public.sanctions (membre_id, type, manquement, date_faits, defense_entendue)
  values ('30000000-0000-0000-0000-00000000000a', 'blame', 'Tenue indécente', current_date, false)$$,
  'defense_entendue', 'aucune sanction sans que le membre ait présenté sa défense (art. 25)');
select pg_temp.refuse($$insert into public.sanctions (membre_id, type, manquement, date_faits, defense_entendue, fin_suspension)
  values ('30000000-0000-0000-0000-00000000000a', 'blame', 'Tenue indécente', current_date, true, current_date + 7)$$,
  'fin_si_suspension', 'une date de fin seulement pour une suspension');
insert into public.sanctions (membre_id, type, manquement, date_faits, defense_entendue, fin_suspension)
values (:'membreB', 'suspension', 'Insolence', current_date - 1, true, current_date + 30);
select pg_temp.refuse($$insert into public.sanctions (membre_id, type, manquement, date_faits, defense_entendue)
  values ('30000000-0000-0000-0000-00000000000a', 'blame', 'Plus tard', current_date + 5, true)$$,
  'faits_avant_decision', 'les faits ne peuvent pas être après la décision');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';  -- resp. paroisse A
select pg_temp.affirmer((select count(*) = 0 from public.sanctions), 'un responsable de paroisse ne voit pas les sanctions');
select pg_temp.refuse($$insert into public.sanctions (membre_id, type, manquement, date_faits, defense_entendue)
  values ('30000000-0000-0000-0000-00000000000a', 'blame', 'Tenue indécente', current_date, true)$$,
  'row-level security', 'ni n''en décide');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';  -- choriste A
select pg_temp.affirmer((select count(*) = 0 from public.sanctions), 'le membre ne voit pas la liste des sanctions');
commit;

-- Rappel pour absences sans motif
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';  -- resp. paroisse A
select pg_temp.affirmer(public.rappeler_absences(:'membreA', 3) = 'notifie', 'le responsable rappelle le règlement à un membre souvent absent');
select pg_temp.refuse($$select public.rappeler_absences('30000000-0000-0000-0000-00000000000a', 3)$$, '3 jours', 'pas deux rappels en moins de 3 jours');
select pg_temp.refuse($$select public.rappeler_absences('30000000-0000-0000-0000-00000000000b', 2)$$, 'hors de votre paroisse', 'pas de rappel hors de sa paroisse');
select pg_temp.affirmer((select count(*) = 1 and bool_and(nb_absences = 3) from public.absences_rappels), 'la date du rappel est gardée');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';  -- resp. commission
select pg_temp.refuse($$select public.rappeler_absences('30000000-0000-0000-0000-00000000000b', 2)$$, 'hors de votre paroisse', 'un responsable de commission ne fait pas de rappel');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';  -- choriste A
select pg_temp.affirmer((select count(*) = 1 from public.notifications where titre like 'Rappel : 3 absences sans motif%' and lien = '/choriste/presences'),
  'le membre reçoit le rappel dans l''application');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
delete from public.sanctions where type = 'suspension';
select pg_temp.affirmer((select count(*) = 1 from public.sanctions), 'l''administration annule une sanction saisie par erreur');
select pg_temp.affirmer((select count(*) >= 3 from public.journal_operations where table_nom = 'sanctions'), 'chaque sanction est inscrite au journal');
commit;

\echo 'Tous les tests de la discipline sont passés.'
