-- Contenu du site public : lecture par tous, gestion par l'administration.
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

\set admin '00000000-0000-0000-0000-0000000000b1'
\set choriste '00000000-0000-0000-0000-0000000000b2'
insert into auth.users (id, email) values (:'admin', 'admin.site@test.cd'), (:'choriste', 'choriste.site@test.cd');
update public.profils set role = 'presidence' where id = :'admin';
update public.profils set role = 'choriste' where id = :'choriste';
insert into public.site_elements (rubrique, titre, publie) values ('question', 'Question cachée', false);

-- Visiteur sans compte
begin;
set local role anon;
select pg_temp.affirmer((select count(*) = 5 from public.site_elements where rubrique = 'chorale'),
  'un visiteur lit les chorales du site');
select pg_temp.affirmer((select count(*) = 0 from public.site_elements where titre = 'Question cachée'),
  'un visiteur ne voit pas ce qui n''est pas publié');
select pg_temp.affirmer((select valeur = '+243 825 717 444' from public.site_reglages where cle = 'telephone'),
  'un visiteur lit le téléphone de contact');
select pg_temp.refuse($$insert into public.site_elements (rubrique, titre) values ('question', 'Pirate')$$, null,
  'un visiteur ne peut rien ajouter');
rollback;

-- Choriste connecté
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select pg_temp.refuse($$insert into public.site_elements (rubrique, titre) values ('question', 'Pirate')$$, null,
  'un choriste ne peut rien ajouter au site');
update public.site_reglages set valeur = 'pirate' where cle = 'telephone';
select pg_temp.affirmer((select valeur = '+243 825 717 444' from public.site_reglages where cle = 'telephone'),
  'un choriste ne peut pas changer le téléphone');
rollback;

-- Administration
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
select pg_temp.affirmer((select count(*) = 1 from public.site_elements where titre = 'Question cachée'),
  'l''administration voit aussi ce qui n''est pas publié');
insert into public.site_elements (rubrique, titre, sous_titre, date_element, fichier)
  values ('audio', 'Répétition du jeudi', 'Vision Femme', '2026-10-29', 'audios/2026-10-29-vision.mp3');
select pg_temp.refuse($$insert into public.site_elements (rubrique, titre) values ('audio', 'Sans fichier')$$, 'audio_avec_fichier',
  'un audio doit avoir un fichier');
select pg_temp.refuse($$insert into public.site_elements (rubrique, titre, fichier) values ('audio', 'x', '../secret')$$, null,
  'le chemin du fichier est contrôlé');
update public.site_reglages set valeur = 'Nouveau titre' where cle = 'accueil_titre';
select pg_temp.affirmer((select valeur = 'Nouveau titre' from public.site_reglages where cle = 'accueil_titre'),
  'l''administration modifie les textes du site');
delete from public.site_elements where titre = 'Question cachée';
select pg_temp.affirmer((select count(*) = 0 from public.site_elements where titre = 'Question cachée'),
  'l''administration supprime un élément');
rollback;

-- Causerie
begin;
set local role anon;
select pg_temp.affirmer(public.causerie_envoyer('Maman Rose', 'Paix à tous !', 'appareil-test-0000001') > 0,
  'un visiteur écrit dans la causerie sans compte');
select pg_temp.refuse($$select public.causerie_envoyer('Maman Rose', 'Encore', 'appareil-test-0000001')$$, 'Doucement',
  'la causerie refuse les messages trop rapprochés');
select pg_temp.refuse($$select public.causerie_envoyer('Papa', 'Appelez le 0825 717 444', 'appareil-test-0000002')$$, 'numéro',
  'la causerie refuse les numéros de téléphone');
select pg_temp.refuse($$select public.causerie_envoyer('X', 'Bonjour', 'appareil-test-0000003')$$, 'nom',
  'la causerie exige un nom de 2 caractères au moins');
select pg_temp.refuse($$insert into public.causerie_messages (pseudo, texte, appareil) values ('Pirate', 'x', 'appareil-test-0000004')$$, null,
  'un visiteur n''écrit pas directement dans la table');
select pg_temp.refuse($$select appareil from public.causerie_messages$$, 'permission',
  'la clé d''appareil reste privée');
select pg_temp.affirmer((select count(*) = 1 from public.causerie_messages), 'un visiteur lit la causerie');
select pg_temp.refuse($$update public.causerie_messages set masque = true$$, null, 'un visiteur ne peut pas masquer un message');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
update public.causerie_messages set masque = true where pseudo = 'Maman Rose';
reset role;
set local role anon;
select pg_temp.affirmer((select count(*) = 0 from public.causerie_messages), 'un message masqué par l''administration disparaît');
reset role;
update public.site_reglages set valeur = 'non' where cle = 'causerie_ouverte';
set local role anon;
select pg_temp.refuse($$select public.causerie_envoyer('Maman Rose', 'Re', 'appareil-test-0000009')$$, 'fermée',
  'personne n''écrit quand la causerie est fermée');
rollback;

-- Images des publications
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
insert into public.site_elements (rubrique, titre, date_element, image)
  values ('soiree', 'Grande soirée musicale', '2026-12-20', 'images/2026-10-30-affiche.jpg');
select pg_temp.affirmer((select image = 'images/2026-10-30-affiche.jpg' from public.site_elements where titre = 'Grande soirée musicale'),
  'une publication garde son image');
select pg_temp.refuse($$insert into public.site_elements (rubrique, titre, image) values ('soiree', 'x', 'audios/../x.jpg')$$, null,
  'le chemin de l''image est contrôlé');
rollback;
