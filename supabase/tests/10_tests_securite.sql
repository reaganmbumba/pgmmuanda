-- Tests des migrations : matricules, historique, RLS et vérification publique.
-- Chaque échec lève une exception et arrête le script (ON_ERROR_STOP).
\set ON_ERROR_STOP on

create or replace function pg_temp.affirmer(condition boolean, message text) returns void
language plpgsql as $$ begin
  if not coalesce(condition, false) then raise exception 'ÉCHEC : %', message; end if;
  raise notice 'OK : %', message;
end $$;

-- Données de test (en super-utilisateur)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test.cd'),
  ('00000000-0000-0000-0000-00000000000b', 'resp.a@test.cd'),
  ('00000000-0000-0000-0000-00000000000c', 'choriste.a@test.cd'),
  ('00000000-0000-0000-0000-00000000000d', 'controleur@test.cd'),
  ('00000000-0000-0000-0000-00000000000e', 'choriste.b@test.cd');

select pg_temp.affirmer((select count(*) = 5 from public.profils where role = 'choriste'),
  'chaque nouveau compte reçoit un profil choriste');

insert into public.paroisses (id, nom) values
  ('10000000-0000-0000-0000-00000000000a', 'Paroisse A'),
  ('10000000-0000-0000-0000-00000000000b', 'Paroisse B');
insert into public.chorales (id, nom, paroisse_id) values
  ('20000000-0000-0000-0000-00000000000a', 'Chorale A', '10000000-0000-0000-0000-00000000000a');

update public.profils set role = 'super_admin', identifiant = 'admin' where id = '00000000-0000-0000-0000-00000000000a';
update public.profils set role = 'responsable_paroisse', paroisse_id = '10000000-0000-0000-0000-00000000000a'
 where id = '00000000-0000-0000-0000-00000000000b';
update public.profils set role = 'controleur' where id = '00000000-0000-0000-0000-00000000000d';

insert into public.membres (id, nom, prenom, paroisse_id, chorale_id, voix, statut, profil_id) values
  ('30000000-0000-0000-0000-00000000000a', 'Nkanga', 'Daniel', '10000000-0000-0000-0000-00000000000a',
   '20000000-0000-0000-0000-00000000000a', 'tenor', 'actif', '00000000-0000-0000-0000-00000000000c'),
  ('30000000-0000-0000-0000-00000000000b', 'Phanzu', 'Samuel', '10000000-0000-0000-0000-00000000000b',
   null, 'basse', 'actif', '00000000-0000-0000-0000-00000000000e');

select pg_temp.affirmer(
  (select array_agg(matricule order by matricule) from public.membres) = array['PGM-MUA-0001', 'PGM-MUA-0002'],
  'les matricules sont générés automatiquement et dans l''ordre');

insert into public.cartes (id, membre_id) values
  ('40000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a'),
  ('40000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-00000000000b');

select pg_temp.affirmer(
  (select bool_and(length(reference_qr) = 22 and reference_qr ~ '^[A-Za-z0-9_-]+$') from public.cartes),
  'les références QR sont aléatoires, 22 caractères, sans le matricule');

do $$ begin
  update public.membres set matricule = 'PGM-MUA-9999' where id = '30000000-0000-0000-0000-00000000000a';
  raise exception 'le matricule a pu être modifié';
exception when raise_exception then
  if sqlerrm like '%matricule ne peut pas%' then raise notice 'OK : le matricule est non modifiable';
  else raise; end if;
end $$;

do $$ begin
  insert into public.cartes (membre_id) values ('30000000-0000-0000-0000-00000000000a');
  raise exception 'deux cartes actives ont été acceptées';
exception when unique_violation then raise notice 'OK : une seule carte active par membre';
end $$;

do $$ begin
  update public.membres set chorale_id = '20000000-0000-0000-0000-00000000000a'
   where id = '30000000-0000-0000-0000-00000000000b';
  raise exception 'chorale d''une autre paroisse acceptée';
exception when raise_exception then
  if sqlerrm like '%chorale n''appartient pas%' then raise notice 'OK : chorale cohérente avec la paroisse';
  else raise; end if;
end $$;

update public.membres set fonction = 'Chef de chœur' where id = '30000000-0000-0000-0000-00000000000a';
select pg_temp.affirmer(
  (select type = 'nomination' and apres ->> 'fonction' = 'Chef de chœur' and not (apres ? 'nom')
     from public.membre_historique where membre_id = '30000000-0000-0000-0000-00000000000a'
    order by id desc limit 1),
  'l''historique enregistre la nomination avec les seuls champs modifiés');

-- -------------------------------------------------------------------
-- Visiteur non connecté (anon)
-- -------------------------------------------------------------------
begin;
set local role anon;
do $$ begin
  perform 1 from public.membres;
  raise exception 'anon a pu lire les membres';
exception when insufficient_privilege then raise notice 'OK : le public ne lit aucune table';
end $$;
rollback;

begin;
create temp table ref_test as select reference_qr from public.cartes where id = '40000000-0000-0000-0000-00000000000a';
grant select on ref_test to anon;
set local role anon;
select pg_temp.affirmer(
  (select resultat = 'valide' and matricule = 'PGM-MUA-0001' and paroisse = 'Paroisse A'
     from public.verifier_carte((select reference_qr from ref_test))),
  'le public vérifie une carte valide (photo, nom, matricule, paroisse seulement)');
select pg_temp.affirmer(
  (select resultat = 'inconnue' and nom is null from public.verifier_carte('reference-inexistante')),
  'une référence inconnue ne révèle rien');
do $$ begin
  perform public.email_pour_identifiant('admin');
  raise exception 'anon a pu retrouver un e-mail';
exception when insufficient_privilege then raise notice 'OK : le public ne peut pas retrouver un e-mail';
end $$;
do $$ begin
  perform public.verifier_matricule('PGM-MUA-0001');
  raise exception 'anon a pu chercher par matricule';
exception when insufficient_privilege then raise notice 'OK : la recherche par matricule est réservée au personnel';
end $$;
rollback;

-- -------------------------------------------------------------------
-- Choriste A
-- -------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.affirmer((select count(*) = 1 from public.membres), 'le choriste ne voit que sa fiche');
select pg_temp.affirmer((select count(*) = 1 from public.cartes), 'le choriste ne voit que sa carte');
select pg_temp.affirmer((select count(*) = 1 from public.profils), 'le choriste ne voit que son profil');
update public.membres set nom = 'Pirate';
select pg_temp.affirmer((select nom = 'Nkanga' from public.membres), 'le choriste ne peut pas modifier sa fiche');
update public.profils set role = 'super_admin';
select pg_temp.affirmer((select role = 'choriste' from public.profils), 'le choriste ne peut pas changer son rôle');
insert into public.demandes_correction (membre_id, champ, valeur_proposee)
values ('30000000-0000-0000-0000-00000000000a', 'telephone', '+243 81 000 0000');
select pg_temp.affirmer((select count(*) = 1 from public.demandes_correction), 'le choriste peut demander une correction');
do $$ begin
  insert into public.demandes_correction (membre_id, champ, valeur_proposee)
  values ('30000000-0000-0000-0000-00000000000b', 'nom', 'X');
  raise exception 'demande pour un autre membre acceptée';
exception when insufficient_privilege then raise notice 'OK : pas de demande pour un autre membre';
end $$;
select pg_temp.affirmer((select count(*) = 0 from public.verifications), 'le choriste ne voit pas l''historique des scans');
select pg_temp.affirmer((select count(*) = 0 from public.journal_operations), 'le choriste ne voit pas le journal');
rollback;

-- -------------------------------------------------------------------
-- Responsable de la paroisse A
-- -------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.affirmer((select count(*) = 1 and min(nom) = 'Nkanga' from public.membres),
  'le responsable de paroisse ne voit que sa paroisse');
insert into public.membres (nom, prenom, paroisse_id) values ('Lusala', 'Esther', '10000000-0000-0000-0000-00000000000a');
select pg_temp.affirmer((select count(*) = 2 from public.membres), 'il peut inscrire un membre dans sa paroisse');
do $$ begin
  insert into public.membres (nom, prenom, paroisse_id) values ('Intrus', 'X', '10000000-0000-0000-0000-00000000000b');
  raise exception 'inscription dans une autre paroisse acceptée';
exception when insufficient_privilege then raise notice 'OK : pas d''inscription hors de sa paroisse';
end $$;
update public.membres set statut = 'suspendu' where id = '30000000-0000-0000-0000-00000000000b';
select pg_temp.affirmer((select count(*) = 0 from public.membres where statut = 'suspendu'),
  'il ne peut pas modifier un membre d''une autre paroisse');
delete from public.membres;
select pg_temp.affirmer((select count(*) = 2 from public.membres), 'il ne peut pas supprimer de membre');
select pg_temp.affirmer((select resultat = 'valide' from public.verifier_matricule('pgm-mua-0001')),
  'le personnel peut vérifier par matricule');
rollback;

-- -------------------------------------------------------------------
-- Contrôleur : scanner sans accès aux fiches
-- -------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select pg_temp.affirmer((select count(*) = 0 from public.membres), 'le contrôleur ne voit aucune fiche');
select pg_temp.affirmer((select resultat = 'valide' from public.verifier_matricule('PGM-MUA-0002')), 'le contrôleur peut vérifier');
select pg_temp.affirmer((select count(*) >= 1 from public.verifications), 'le contrôleur voit l''historique des scans');
rollback;

-- -------------------------------------------------------------------
-- Révocation puis vérification
-- -------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update public.cartes set statut = 'revoquee', revoquee_le = now(), motif_revocation = 'Carte perdue'
 where id = '40000000-0000-0000-0000-00000000000a';
select pg_temp.affirmer((select resultat = 'revoquee' from public.verifier_matricule('PGM-MUA-0001')),
  'une carte révoquée est signalée comme révoquée');
insert into public.cartes (membre_id, remplace_carte_id)
values ('30000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-00000000000a');
select pg_temp.affirmer((select resultat = 'valide' from public.verifier_matricule('PGM-MUA-0001')),
  'la carte de remplacement est valide');
select pg_temp.affirmer((select count(*) = 5 from public.profils), 'le super administrateur voit tous les profils');
select pg_temp.affirmer((select count(*) > 0 from public.journal_operations), 'le journal des opérations est alimenté');
rollback;

\echo 'Tous les tests de sécurité sont passés.'
