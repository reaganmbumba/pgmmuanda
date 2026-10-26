-- Tests de l'Étape 4 : opérations sur les cartes, photos.
-- Utilise les comptes et membres créés par 10_tests_securite.sql.
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

-- Membre sans carte, en attente
insert into public.membres (id, nom, prenom, paroisse_id, statut) values
  ('30000000-0000-0000-0000-0000000000c1', 'Mbuku', 'Ruth', '10000000-0000-0000-0000-00000000000a', 'en_attente');

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b'; -- responsable paroisse A
select pg_temp.refuse($$select public.emettre_carte('30000000-0000-0000-0000-0000000000c1')$$,
  'membre actif', 'pas de carte pour un membre en attente');
update public.membres set statut = 'actif' where id = '30000000-0000-0000-0000-0000000000c1';
select pg_temp.affirmer((select length(reference_qr) = 22 from public.emettre_carte('30000000-0000-0000-0000-0000000000c1')),
  'le responsable émet la carte d''un membre actif de sa paroisse');
select pg_temp.refuse($$select public.emettre_carte('30000000-0000-0000-0000-0000000000c1')$$,
  'déjà une carte active', 'une seule carte active par membre');
select pg_temp.refuse($$select public.emettre_carte('30000000-0000-0000-0000-00000000000b')$$,
  null, 'pas de carte pour un membre d''une autre paroisse');

-- Réédition : l'ancienne est remplacée, la nouvelle est valide
create temp table ancienne on commit drop as
  select reference_qr from public.cartes where membre_id = '30000000-0000-0000-0000-0000000000c1' and statut = 'active';
select pg_temp.affirmer((select remplace_carte_id is not null from public.reediter_carte('30000000-0000-0000-0000-0000000000c1', 'Carte abîmée')),
  'la réédition crée une nouvelle carte liée à l''ancienne');
select pg_temp.affirmer((select resultat = 'revoquee' from public.verifier_carte((select reference_qr from ancienne))),
  'l''ancienne carte n''est plus valide après réédition');
select pg_temp.affirmer((select resultat = 'valide' from public.verifier_matricule((select matricule from public.membres where id = '30000000-0000-0000-0000-0000000000c1'))),
  'la nouvelle carte est valide');
select pg_temp.affirmer((select count(*) = 2 from public.membre_historique
  where membre_id = '30000000-0000-0000-0000-0000000000c1' and type = 'carte' and apres ->> 'carte' in ('émise', 'rééditée')),
  'émission et réédition apparaissent dans l''historique');

-- Protections de la carte
select pg_temp.refuse($$update public.cartes set reference_qr = 'abc' where membre_id = '30000000-0000-0000-0000-0000000000c1'$$,
  'ne peuvent pas être modifiés', 'la référence d''une carte est immuable');
select public.revoquer_carte(id, 'Perte')
  from public.cartes where membre_id = '30000000-0000-0000-0000-0000000000c1' and statut = 'active';
select pg_temp.affirmer((select revoquee_le is not null and motif_revocation = 'Perte' from public.cartes
  where membre_id = '30000000-0000-0000-0000-0000000000c1' and statut = 'revoquee'),
  'la révocation enregistre la date et le motif');
select pg_temp.refuse($$update public.cartes set statut = 'active' where membre_id = '30000000-0000-0000-0000-0000000000c1' and statut = 'revoquee'$$,
  'ne peut pas être réactivée', 'une carte révoquée ne redevient pas active');
rollback;

-- Le choriste ne peut ni émettre ni révoquer
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.refuse($$select public.reediter_carte('30000000-0000-0000-0000-00000000000a', 'x')$$,
  null, 'le choriste ne peut pas rééditer sa carte');
select pg_temp.refuse($$select public.emettre_carte('30000000-0000-0000-0000-00000000000a')$$,
  null, 'le choriste ne peut pas émettre de carte');
rollback;

-- Le contrôleur vérifie mais ne gère pas les cartes
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select pg_temp.refuse($$select public.revoquer_carte('40000000-0000-0000-0000-00000000000b', 'x')$$,
  null, 'le contrôleur ne peut pas révoquer');
rollback;

-- Photos
select pg_temp.refuse($$update public.membres set photo_url = 'https://exemple.org/photo.jpg' where id = '30000000-0000-0000-0000-00000000000a'$$,
  'membres_photo_format', 'une photo doit être une image intégrée, pas un lien externe');
select pg_temp.refuse($$update public.membres set photo_url = 'data:image/svg+xml;base64,PHN2Zz4=' where id = '30000000-0000-0000-0000-00000000000a'$$,
  'membres_photo_format', 'les images SVG sont refusées');
update public.membres set photo_url = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' where id = '30000000-0000-0000-0000-00000000000a';
select pg_temp.affirmer(true, 'une photo JPEG intégrée est acceptée');
select pg_temp.affirmer((select apres -> 'photo_url' = 'true'::jsonb from public.membre_historique
  where membre_id = '30000000-0000-0000-0000-00000000000a' order by id desc limit 1),
  'l''historique note le changement de photo sans recopier l''image');
select pg_temp.affirmer((select not (details::text like '%base64%') from public.journal_operations
  where table_nom = 'membres' order by id desc limit 1),
  'le journal ne recopie pas la photo');

\echo 'Tous les tests des cartes sont passés.'
