-- Tests de l'Étape 5 : notifications automatiques.
\set ON_ERROR_STOP on

create or replace function pg_temp.affirmer(condition boolean, message text) returns void
language plpgsql as $$ begin
  if not coalesce(condition, false) then raise exception 'ÉCHEC : %', message; end if;
  raise notice 'OK : %', message;
end $$;

delete from public.notifications;

-- Le choriste A (compte ...c, membre ...a, paroisse A) demande une correction
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
insert into public.demandes_correction (membre_id, champ, valeur_proposee)
values ('30000000-0000-0000-0000-00000000000a', 'telephone', '+243 81 000 0000');
select pg_temp.affirmer((select count(*) = 0 from public.notifications), 'le choriste ne voit pas les notifications du staff');
select pg_temp.affirmer((select count(*) = 0 from public.notifications where profil_id <> auth.uid()), 'chacun ne lit que ses notifications');
commit;

select pg_temp.affirmer((select count(*) = 1 from public.notifications where profil_id = '00000000-0000-0000-0000-00000000000a'),
  'l''administrateur est prévenu d''une nouvelle demande');
select pg_temp.affirmer((select count(*) = 1 from public.notifications where profil_id = '00000000-0000-0000-0000-00000000000b'),
  'le responsable de la paroisse du membre est prévenu');
select pg_temp.affirmer((select count(*) = 0 from public.notifications where profil_id = '00000000-0000-0000-0000-00000000000d'),
  'le contrôleur n''est pas prévenu');

-- Le responsable refuse la demande → le choriste est prévenu
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
update public.demandes_correction set statut = 'refusee' where membre_id = '30000000-0000-0000-0000-00000000000a';
commit;
select pg_temp.affirmer((select count(*) = 1 from public.notifications
  where profil_id = '00000000-0000-0000-0000-00000000000c' and titre like '%refusée%'),
  'le choriste est prévenu que sa demande est refusée');

-- Émission d'une carte → le choriste est prévenu
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select public.reediter_carte('30000000-0000-0000-0000-00000000000a', 'Perte');
commit;
select pg_temp.affirmer((select count(*) = 1 from public.notifications
  where profil_id = '00000000-0000-0000-0000-00000000000c' and lien = '/choriste/carte'),
  'le choriste est prévenu que sa nouvelle carte est disponible');

-- Le choriste marque comme lue, mais ne peut pas modifier le texte ni écrire pour un autre
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
update public.notifications set lue = true;
select pg_temp.affirmer((select bool_and(lue) from public.notifications), 'le choriste marque ses notifications comme lues');
do $$ begin
  update public.notifications set titre = 'Piraté' where profil_id = '00000000-0000-0000-0000-00000000000c';
  raise exception 'ÉCHEC : le texte d''une notification a pu être modifié';
exception when raise_exception then
  if sqlerrm like 'ÉCHEC%' then raise; end if;
  raise notice 'OK : le texte d''une notification ne peut pas être modifié';
end $$;
do $$ begin
  insert into public.notifications (profil_id, titre) values ('00000000-0000-0000-0000-00000000000a', 'Faux message');
  raise exception 'ÉCHEC : un utilisateur a créé une notification';
exception when insufficient_privilege then
  raise notice 'OK : un utilisateur ne peut pas créer de notification pour un autre';
end $$;
do $$ begin
  perform public.notifier('00000000-0000-0000-0000-00000000000a', 'Faux', null);
  raise exception 'ÉCHEC : la fonction notifier est accessible';
exception when insufficient_privilege then
  raise notice 'OK : la fonction interne de notification n''est pas accessible';
end $$;
rollback;

\echo 'Tous les tests des notifications sont passés.'
