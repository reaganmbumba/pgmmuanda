-- Cotisations des membres. Comptes : ...a admin, ...b resp. paroisse A (accès finances coché
-- par 50_tests_organisation.sql), ...c choriste A (membre ...a, paroisse A), ...d contrôleur,
-- ...e choriste B (membre ...b, paroisse B), ...f resp. commission X (accès finances coché).
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
select date_trunc('month', current_date)::date as ce_mois \gset

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';  -- resp. paroisse A, choisi
insert into public.cotisations (membre_id, mois, montant) values (:'membreA', :'ce_mois', 2000);
select pg_temp.affirmer((select saisi_par_nom = (select nom_affiche from public.profils where id = auth.uid())
  from public.cotisations), 'le responsable choisi enregistre la cotisation d''un membre de sa paroisse, signée de son nom');
select pg_temp.refuse($$insert into public.cotisations (membre_id, mois, montant)
  values ('30000000-0000-0000-0000-00000000000b', date_trunc('month', current_date), 2000)$$,
  'row-level security', 'mais pas celle d''un membre d''une autre paroisse');
select pg_temp.refuse($$insert into public.cotisations (membre_id, mois, montant)
  values ('30000000-0000-0000-0000-00000000000a', date_trunc('month', current_date), 500)$$,
  'cotisations_membre_id_mois_key', 'un mois ne se paie qu''une fois');
select pg_temp.refuse($$insert into public.cotisations (membre_id, mois, montant)
  values ('30000000-0000-0000-0000-00000000000a', current_date - extract(day from current_date)::int + 2, 500)$$,
  'mois_check', 'un mois commence toujours le 1er');
select pg_temp.refuse($$insert into public.cotisations (membre_id, mois, montant)
  values ('30000000-0000-0000-0000-00000000000a', (date_trunc('month', current_date) + interval '2 years')::date, 500)$$,
  'avance', 'pas plus de 12 mois à l''avance');
select pg_temp.affirmer((select montant = 2000 and categorie = 'Cotisations' and sens = 'recette'
  from public.operations_financieres where cotisations_mois = :'ce_mois'), 'le total du mois entre dans la caisse');
delete from public.cotisations;
select pg_temp.affirmer((select count(*) = 1 from public.cotisations), 'il ne peut pas supprimer une cotisation');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';  -- resp. commission, choisi
insert into public.cotisations (membre_id, mois, montant) values (:'membreB', :'ce_mois', 3000);
insert into public.cotisations (membre_id, mois, montant, devise) values (:'membreB', (:'ce_mois'::date - interval '1 month')::date, 2, 'USD');
select pg_temp.affirmer((select count(*) = 3 from public.cotisations), 'il voit les cotisations de tous les membres');
select pg_temp.affirmer((select montant = 5000 from public.operations_financieres where cotisations_mois = :'ce_mois' and devise = 'CDF')
  and (select count(*) = 1 from public.operations_financieres where cotisations_mois = :'ce_mois'),
  'une seule ligne par mois dans la caisse, recalculée à chaque paiement');
select pg_temp.affirmer((select montant = 2 from public.operations_financieres where devise = 'USD' and cotisations_mois is not null),
  'francs et dollars restent séparés');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';  -- choriste A
select pg_temp.affirmer((select count(*) = 1 and bool_and(membre_id = :'membreA') from public.cotisations),
  'un choriste voit seulement ses propres cotisations');
select pg_temp.refuse($$insert into public.cotisations (membre_id, mois, montant)
  values ('30000000-0000-0000-0000-00000000000a', (date_trunc('month', current_date) + interval '1 month')::date, 2000)$$,
  'row-level security', 'et ne peut pas en enregistrer');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';  -- contrôleur
select pg_temp.affirmer((select count(*) = 0 from public.cotisations), 'le contrôleur ne voit aucune cotisation');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';  -- admin
delete from public.cotisations where membre_id = :'membreB' and mois = :'ce_mois';
select pg_temp.affirmer((select montant = 2000 from public.operations_financieres where cotisations_mois = :'ce_mois' and devise = 'CDF'),
  'l''administration corrige une erreur : la caisse est recalculée');
delete from public.cotisations where devise = 'USD';
select pg_temp.affirmer((select count(*) = 0 from public.operations_financieres where devise = 'USD' and cotisations_mois is not null),
  'plus de cotisation : la ligne de caisse disparaît');
select pg_temp.affirmer((select count(*) >= 3 from public.journal_operations where table_nom = 'cotisations'),
  'chaque cotisation est inscrite au journal');
commit;

\echo 'Tous les tests des cotisations sont passés.'

-- Rappel du règlement
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';  -- resp. paroisse A, choisi
select pg_temp.affirmer(public.rappeler_cotisation(:'membreA', (:'ce_mois'::date + interval '1 month')::date) = 'notifie',
  'le responsable rappelle le règlement à un membre qui n''a pas payé');
select pg_temp.refuse($$select public.rappeler_cotisation('30000000-0000-0000-0000-00000000000a', (date_trunc('month', current_date) + interval '1 month')::date)$$,
  '3 jours', 'pas deux rappels en moins de 3 jours');
select pg_temp.refuse($$select public.rappeler_cotisation('30000000-0000-0000-0000-00000000000a', date_trunc('month', current_date)::date)$$,
  'déjà payé', 'pas de rappel pour un mois déjà payé');
select pg_temp.refuse($$select public.rappeler_cotisation('30000000-0000-0000-0000-00000000000b', date_trunc('month', current_date)::date)$$,
  'hors de votre paroisse', 'pas de rappel hors de sa paroisse');
select pg_temp.refuse($$insert into public.cotisations_rappels (membre_id, mois) values ('30000000-0000-0000-0000-00000000000b', current_date)$$,
  'permission', 'la liste des rappels ne s''écrit que par la fonction');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';  -- choriste A
select pg_temp.affirmer((select count(*) = 1 from public.notifications where titre like 'Rappel : votre cotisation%' and lien = '/choriste/cotisations'),
  'le membre reçoit le rappel dans l''application');
select pg_temp.refuse($$select public.rappeler_cotisation('30000000-0000-0000-0000-00000000000a', date_trunc('month', current_date)::date)$$,
  'réservée', 'un choriste ne peut pas envoyer de rappel');
commit;

\echo 'Tous les tests des rappels de cotisation sont passés.'
