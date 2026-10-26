-- Tests de l'Étape 6 : programmes, annonces, présences.
-- Comptes (10_tests_securite.sql) : ...a admin, ...b responsable paroisse A, ...c choriste A
-- (membre ...a : paroisse A, chorale A, ténor), ...d contrôleur, ...e choriste B (membre ...b : paroisse B, basse).
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

delete from public.notifications;
-- Chaque membre a une carte active pour les tests de pointage
insert into public.cartes (membre_id)
select m.id from public.membres m
 where m.id in ('30000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000b')
   and not exists (select 1 from public.cartes c where c.membre_id = m.id and c.statut = 'active');
update public.membres set statut = 'actif', archive = false
 where id in ('30000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000b');
delete from public.notifications;

-- ---------------------------------------------------------------------
-- Activités et ciblage
-- ---------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';  -- responsable A
insert into public.activites (id, titre, debut, lieu, portee_paroisse)
values ('50000000-0000-0000-0000-00000000000a', 'Répétition paroisse A', now() + interval '2 days', 'Temple A',
        '10000000-0000-0000-0000-00000000000a');
select pg_temp.affirmer(true, 'le responsable crée une activité pour sa paroisse');
select pg_temp.refuse($$insert into public.activites (titre, debut) values ('Activité PGM', now())$$,
  'row-level security', 'le responsable ne peut pas créer une activité pour toute la PGM');
select pg_temp.refuse($$insert into public.activites (titre, debut, portee_paroisse) values ('Autre paroisse', now(), '10000000-0000-0000-0000-00000000000b')$$,
  'row-level security', 'ni pour une autre paroisse');
select pg_temp.refuse($$insert into public.activites (titre, debut, portee_paroisse, pour_tous, cible_paroisses)
  values ('Ciblage hors paroisse', now(), '10000000-0000-0000-0000-00000000000a', false, '{10000000-0000-0000-0000-00000000000b}')$$,
  'que sa propre paroisse', 'une activité de paroisse ne peut pas cibler une autre paroisse');
select pg_temp.refuse($$insert into public.activites (titre, debut, fin, portee_paroisse)
  values ('Dates incohérentes', now(), now() - interval '1 hour', '10000000-0000-0000-0000-00000000000a')$$,
  'fin_apres_debut', 'la fin ne peut pas précéder le début');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';  -- administrateur
insert into public.activites (id, titre, debut, pour_tous, cible_voix)
values ('50000000-0000-0000-0000-00000000000b', 'Répétition des basses', now() + interval '3 days', false, '{basse}');
select pg_temp.refuse($$insert into public.activites (titre, debut, pour_tous) values ('Sans cible', now(), false)$$,
  'ciblage_non_vide', 'une activité doit avoir au moins une cible');
commit;

select pg_temp.affirmer((select count(*) = 1 from public.notifications
  where profil_id = '00000000-0000-0000-0000-00000000000c' and titre like 'Nouvelle activité : Répétition paroisse A%'),
  'le choriste de la paroisse A est prévenu de l''activité de sa paroisse');
select pg_temp.affirmer((select count(*) = 1 from public.notifications
  where profil_id = '00000000-0000-0000-0000-00000000000e' and titre like 'Nouvelle activité : Répétition des basses%'),
  'le choriste basse est prévenu de la répétition des basses');
select pg_temp.affirmer((select count(*) = 1 from public.notifications where profil_id = '00000000-0000-0000-0000-00000000000c'),
  'le ténor n''est pas prévenu de la répétition des basses');

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';  -- choriste A (ténor)
select pg_temp.affirmer((select array_agg(titre) = array['Répétition paroisse A'] from public.activites),
  'le choriste A ne voit que les activités qui le concernent');
select pg_temp.refuse($$insert into public.activites (titre, debut) values ('Pirate', now())$$,
  'row-level security', 'un choriste ne peut pas créer d''activité');
update public.activites set titre = 'Modifié' where id = '50000000-0000-0000-0000-00000000000a';
select pg_temp.affirmer((select titre = 'Répétition paroisse A' from public.activites where id = '50000000-0000-0000-0000-00000000000a'),
  'un choriste ne peut pas modifier une activité');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';  -- choriste B (basse)
select pg_temp.affirmer((select array_agg(titre) = array['Répétition des basses'] from public.activites),
  'le choriste B ne voit que la répétition des basses');
commit;

-- ---------------------------------------------------------------------
-- Présences
-- ---------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';  -- responsable A
insert into public.presences (activite_id, membre_id, statut)
values ('50000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', 'absent');
select pg_temp.affirmer((select saisi_par = '00000000-0000-0000-0000-00000000000b' from public.presences),
  'le responsable saisit une présence, signée de son compte');
update public.presences set statut = 'excuse', saisi_par = '00000000-0000-0000-0000-00000000000a';
select pg_temp.affirmer((select statut = 'excuse' and saisi_par = '00000000-0000-0000-0000-00000000000b' from public.presences),
  'il corrige la présence ; l''auteur de la saisie ne peut pas être falsifié');
select pg_temp.refuse($$insert into public.presences (activite_id, membre_id, statut)
  values ('50000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-00000000000b', 'present')$$,
  'row-level security', 'il ne peut pas pointer un membre d''une autre paroisse');
commit;

select pg_temp.refuse($$insert into public.presences (activite_id, membre_id, statut)
  values ('50000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-00000000000a', 'present')$$,
  'pas concerné', 'on ne peut pas pointer un membre qui n''est pas concerné par l''activité');

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';  -- choriste A
select pg_temp.affirmer((select count(*) = 1 from public.presences), 'le choriste voit sa propre présence');
select pg_temp.refuse($$insert into public.presences (activite_id, membre_id, statut)
  values ('50000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', 'present')$$,
  null, 'le choriste ne peut pas se pointer lui-même');
update public.presences set statut = 'present';
select pg_temp.affirmer((select statut = 'excuse' from public.presences), 'ni modifier sa présence');
commit;

-- Pointage par QR (contrôleur)
select reference_qr as ref_b from public.cartes where membre_id = '30000000-0000-0000-0000-00000000000b' and statut = 'active' \gset
select reference_qr as ref_a from public.cartes where membre_id = '30000000-0000-0000-0000-00000000000a' and statut = 'active' \gset
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select pg_temp.affirmer((select resultat = 'enregistre' and matricule = 'PGM-MUA-0002'
  from public.pointer_presence('50000000-0000-0000-0000-00000000000b', :'ref_b')),
  'le contrôleur pointe un choriste en scannant sa carte');
select pg_temp.affirmer((select resultat = 'deja_present'
  from public.pointer_presence('50000000-0000-0000-0000-00000000000b', :'ref_b')),
  'un second scan est signalé « déjà présent »');
select pg_temp.affirmer((select resultat = 'non_concerne'
  from public.pointer_presence('50000000-0000-0000-0000-00000000000b', :'ref_a')),
  'un choriste non concerné est signalé et non pointé');
select pg_temp.affirmer((select resultat = 'inconnue' and nom is null
  from public.pointer_presence('50000000-0000-0000-0000-00000000000b', 'reference-inventee')),
  'une carte inconnue est signalée');
select pg_temp.affirmer((select resultat = 'enregistre'
  from public.pointer_presence('50000000-0000-0000-0000-00000000000a', 'pgm-mua-0001')),
  'le pointage par matricule fonctionne aussi');
commit;
select pg_temp.affirmer((select methode = 'qr' and statut = 'present' from public.presences
  where activite_id = '50000000-0000-0000-0000-00000000000b' and membre_id = '30000000-0000-0000-0000-00000000000b'),
  'la présence scannée est enregistrée « présent, par QR »');

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';  -- responsable A
select pg_temp.affirmer((select resultat = 'non_autorise'
  from public.pointer_presence('50000000-0000-0000-0000-00000000000b', 'PGM-MUA-0002')),
  'un responsable ne pointe pas, par QR, un membre d''une autre paroisse');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.refuse($$select * from public.pointer_presence('50000000-0000-0000-0000-00000000000a', 'PGM-MUA-0001')$$,
  'personnel habilité', 'un choriste ne peut pas utiliser le pointage');
commit;

-- Révocation de carte : le pointage est refusé
update public.cartes set statut = 'revoquee' where membre_id = '30000000-0000-0000-0000-00000000000b' and statut = 'active';
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select pg_temp.affirmer((select resultat = 'carte_invalide'
  from public.pointer_presence('50000000-0000-0000-0000-00000000000b', 'PGM-MUA-0002')),
  'une carte révoquée ne permet pas d''être pointé');
commit;
insert into public.cartes (membre_id) values ('30000000-0000-0000-0000-00000000000b');

-- Annulation
delete from public.notifications;
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update public.activites set statut = 'annulee' where id = '50000000-0000-0000-0000-00000000000b';
commit;
select pg_temp.affirmer((select count(*) = 1 from public.notifications
  where profil_id = '00000000-0000-0000-0000-00000000000e' and titre = 'Activité annulée : Répétition des basses'),
  'les choristes concernés sont prévenus de l''annulation');
select pg_temp.refuse($$update public.presences set statut = 'absent' where activite_id = '50000000-0000-0000-0000-00000000000b'$$,
  'annulée', 'aucune présence ne peut être saisie pour une activité annulée');

-- ---------------------------------------------------------------------
-- Annonces
-- ---------------------------------------------------------------------
delete from public.notifications;
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';  -- responsable A
insert into public.annonces (id, titre, contenu, type, portee_paroisse, publiee_le, auteur_id)
values ('60000000-0000-0000-0000-00000000000a', 'Tenue de dimanche', 'Tenue blanche pour tous.', 'officielle',
        '10000000-0000-0000-0000-00000000000a', '2000-01-01', '00000000-0000-0000-0000-00000000000a');
select pg_temp.affirmer((select publiee_le > now() - interval '1 minute' and auteur_id = '00000000-0000-0000-0000-00000000000b'
  from public.annonces), 'la date de publication et l''auteur sont fixés par la base');
select pg_temp.refuse($$insert into public.annonces (titre, contenu) values ('Pour tous', 'Texte')$$,
  'row-level security', 'le responsable ne publie pas pour toute la PGM');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.annonces (id, titre, contenu, type, pour_tous, cible_chorales)
values ('60000000-0000-0000-0000-00000000000b', 'Réunion de la chorale A', 'Samedi à 10 h.', 'urgente', false,
        '{20000000-0000-0000-0000-00000000000a}');
commit;

select pg_temp.affirmer((select count(*) = 2 from public.notifications where profil_id = '00000000-0000-0000-0000-00000000000c'),
  'le choriste A est prévenu des deux annonces qui le concernent');
select pg_temp.affirmer((select count(*) = 1 from public.notifications
  where profil_id = '00000000-0000-0000-0000-00000000000c' and titre = 'Urgent : Réunion de la chorale A'),
  'une annonce urgente est signalée comme telle');
select pg_temp.affirmer((select count(*) = 0 from public.notifications where profil_id = '00000000-0000-0000-0000-00000000000e'),
  'le choriste B n''est pas prévenu');

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';
select pg_temp.affirmer((select count(*) = 0 from public.annonces), 'le choriste B ne lit pas les annonces de la paroisse A');
select pg_temp.refuse($$insert into public.annonces (titre, contenu) values ('Pirate', 'Texte')$$,
  'row-level security', 'un choriste ne peut pas publier');
commit;

update public.annonces set archivee = true where id = '60000000-0000-0000-0000-00000000000a';
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.affirmer((select array_agg(titre) = array['Réunion de la chorale A'] from public.annonces),
  'le choriste A lit ses annonces, sauf celles archivées');
commit;

select pg_temp.affirmer((select count(*) >= 2 from public.journal_operations where table_nom = 'annonces'),
  'les publications sont tracées dans le journal');
select pg_temp.affirmer(not has_function_privilege('authenticated',
  'public.notifier_concernes(uuid, boolean, uuid[], uuid[], public.voix[], text, text)', 'execute'),
  'personne ne peut envoyer des notifications de masse directement');

\echo 'Tous les tests des programmes, annonces et présences sont passés.'
