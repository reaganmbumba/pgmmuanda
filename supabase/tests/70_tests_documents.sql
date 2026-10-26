-- Tests de l'Étape 8 : fichiers (partitions, reçus, documents pour choristes).
-- Comptes : ...a admin, ...b resp. paroisse A, ...c choriste A (ténor), ...d contrôleur,
-- ...e choriste B (basse), ...f resp. commission X. Données créées par 50_tests_organisation.sql.
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

select id as chant from public.chants where titre = 'Yesu azali' \gset
select id as depense from public.operations_financieres where libelle = 'Acompte menuisier' \gset
select id as cotisations from public.operations_financieres where libelle = 'Cotisations' \gset
delete from public.notifications;

-- Partition
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';
insert into public.documents (titre, nom_fichier, type_mime, taille, contenu, chant_id)
values ('Partition', 'yesu.pdf', 'application/pdf', 4, 'JVBERg==', :'chant');
select pg_temp.affirmer(true, 'le responsable de commission dépose une partition');
select pg_temp.refuse($$insert into public.documents (titre, nom_fichier, type_mime, taille, contenu, chant_id) values ('Virus', 'x.exe', 'application/x-msdownload', 4, 'TVqQ', '$$ || :'chant' || $$')$$,
  'type_mime', 'seuls les PDF, photos et MP3 sont acceptés');
select pg_temp.refuse($$insert into public.documents (titre, nom_fichier, type_mime, taille, contenu, chant_id) values ('Chemin', '../../etc/passwd', 'application/pdf', 4, 'JVBERg==', '$$ || :'chant' || $$')$$,
  'nom_fichier', 'un nom de fichier ne peut pas contenir de chemin');
select pg_temp.refuse($$insert into public.documents (titre, nom_fichier, type_mime, taille, contenu, chant_id) values ('Gros', 'g.pdf', 'application/pdf', 5000000, 'JVBERg==', '$$ || :'chant' || $$')$$,
  'taille', 'un fichier ne dépasse pas 4 Mo');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.affirmer((select count(*) = 1 from public.documents where chant_id = :'chant'), 'les choristes lisent les partitions');
select pg_temp.refuse($$insert into public.documents (titre, nom_fichier, type_mime, taille, contenu, chant_id)
  values ('Pirate', 'p.pdf', 'application/pdf', 4, 'JVBERg==', '$$ || :'chant' || $$')$$, 'row-level security', 'mais n''en déposent pas');
commit;

-- Reçus
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';
insert into public.documents (titre, nom_fichier, type_mime, taille, contenu, operation_id)
values ('Reçu menuisier', 'recu.jpg', 'image/jpeg', 3, '/9j/', :'depense');
select pg_temp.affirmer(true, 'le responsable joint le reçu d''une dépense de son projet');
select pg_temp.refuse($$insert into public.documents (titre, nom_fichier, type_mime, taille, contenu, operation_id)
  values ('Reçu', 'r.jpg', 'image/jpeg', 3, '/9j/', '$$ || :'cotisations' || $$')$$, 'row-level security', 'pas à une opération hors de ses projets');
delete from public.documents where titre = 'Reçu menuisier';
select pg_temp.affirmer((select count(*) = 1 from public.documents where titre = 'Reçu menuisier'), 'il ne peut pas supprimer un reçu');
select pg_temp.refuse($$update public.documents set contenu = 'AAAA' where titre = 'Partition'$$, 'ne se modifie pas',
  'un fichier déposé ne peut pas être remplacé en cachette');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.affirmer((select count(*) = 0 from public.documents where operation_id is not null), 'un choriste ne voit aucun reçu');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.affirmer((select count(*) = 0 from public.documents where operation_id is not null), 'un responsable de paroisse non plus');
commit;

-- Documents pour choristes
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.documents (titre, nom_fichier, type_mime, taille, contenu, portee_paroisse)
values ('Règlement de la paroisse A', 'reglement.pdf', 'application/pdf', 4, 'JVBERg==', '10000000-0000-0000-0000-00000000000a');
select pg_temp.affirmer(true, 'le responsable de paroisse dépose un document pour sa paroisse');
select pg_temp.refuse($$insert into public.documents (titre, nom_fichier, type_mime, taille, contenu) values ('Toute la PGM', 'a.pdf', 'application/pdf', 4, 'JVBERg==')$$,
  'row-level security', 'mais pas pour toute la PGM');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.affirmer((select count(*) = 1 from public.documents where titre = 'Règlement de la paroisse A'), 'le choriste de la paroisse A le lit');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';
select pg_temp.affirmer((select count(*) = 0 from public.documents where titre = 'Règlement de la paroisse A'), 'pas le choriste de la paroisse B');
commit;
select pg_temp.affirmer((select count(*) = 1 from public.notifications where profil_id = '00000000-0000-0000-0000-00000000000c'
  and titre = 'Nouveau document : Règlement de la paroisse A' and lien = '/choriste/documents'), 'le choriste concerné est prévenu');
select pg_temp.affirmer((select count(*) = 0 from public.notifications where titre like 'Nouveau document : Partition%'),
  'une partition ou un reçu ne crée pas de notification de document');
select pg_temp.affirmer((select bool_and(not details ? 'contenu') from public.journal_operations where table_nom = 'documents'),
  'le journal garde la trace des fichiers sans en copier le contenu');

\echo 'Tous les tests des fichiers sont passés.'
