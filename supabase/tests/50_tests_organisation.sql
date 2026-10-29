-- Tests de l'Étape 7 : commissions, formations, projets, finances, hébergement, chants.
-- Comptes : ...a admin, ...b responsable paroisse A, ...c choriste A (membre ...a, ténor, M),
-- ...d contrôleur, ...e choriste B (membre ...b, basse), ...f responsable de la commission X (nouveau).
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

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000f', 'resp.commission@test.cd');
insert into public.commissions (id, nom) values
  ('70000000-0000-0000-0000-00000000000a', 'Commission X'),
  ('70000000-0000-0000-0000-00000000000b', 'Commission Y');
update public.profils set role = 'responsable_commission', commission_id = '70000000-0000-0000-0000-00000000000a'
 where id = '00000000-0000-0000-0000-00000000000f';
update public.membres set sexe = 'M' where id in ('30000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000b');
delete from public.notifications;

-- ---------------------------------------------------------------------
-- Commissions
-- ---------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';  -- responsable commission X
insert into public.commission_membres (commission_id, membre_id, fonction)
values ('70000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', 'Secrétaire');
select pg_temp.affirmer(true, 'le responsable ajoute un membre à sa commission');
select pg_temp.refuse($$insert into public.commission_membres (commission_id, membre_id)
  values ('70000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-00000000000b')$$,
  'row-level security', 'mais pas à une autre commission');
update public.commissions set description = 'Nouvelle description' where id = '70000000-0000-0000-0000-00000000000a';
select pg_temp.affirmer((select description = 'Nouvelle description' from public.commissions where id = '70000000-0000-0000-0000-00000000000a'),
  'le responsable modifie la description de sa commission');
select pg_temp.refuse($$update public.commissions set nom = 'Renommée' where id = '70000000-0000-0000-0000-00000000000a'$$,
  'Seule l''administration', 'mais ne peut pas la renommer');
update public.commissions set description = 'Pirate' where id = '70000000-0000-0000-0000-00000000000b';
select pg_temp.affirmer((select description is null from public.commissions where id = '70000000-0000-0000-0000-00000000000b'),
  'ni modifier une autre commission');
commit;

select pg_temp.affirmer((select count(*) = 1 from public.notifications
  where profil_id = '00000000-0000-0000-0000-00000000000c' and titre = 'Vous faites partie de la commission Commission X (Secrétaire)'),
  'le choriste est prévenu de son entrée dans la commission');

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.affirmer((select count(*) = 1 from public.commission_membres), 'le choriste voit sa commission');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';
select pg_temp.affirmer((select count(*) = 0 from public.commission_membres), 'un autre choriste ne la voit pas');
select pg_temp.refuse($$insert into public.commission_membres (commission_id, membre_id)
  values ('70000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000b')$$,
  'row-level security', 'un choriste ne peut pas s''ajouter à une commission');
commit;

-- ---------------------------------------------------------------------
-- Formations
-- ---------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';
insert into public.formations (id, titre, debut, commission_id, places)
values ('80000000-0000-0000-0000-00000000000a', 'Solfège niveau 1', now() + interval '5 days',
        '70000000-0000-0000-0000-00000000000a', 1);
select pg_temp.affirmer(true, 'le responsable crée une formation pour sa commission');
select pg_temp.refuse($$insert into public.formations (titre, debut, commission_id) values ('Autre', now(), '70000000-0000-0000-0000-00000000000b')$$,
  'row-level security', 'mais pas pour une autre commission');
select pg_temp.refuse($$insert into public.formations (titre, debut) values ('Sans commission', now())$$,
  'row-level security', 'ni une formation générale (réservée à l''administration)');
insert into public.formation_inscriptions (formation_id, membre_id, evalue_par, evalue_le)
values ('80000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a',
        '00000000-0000-0000-0000-00000000000a', now() - interval '1 year');
select pg_temp.affirmer((select evalue_par is null and evalue_le is null from public.formation_inscriptions),
  'une inscription ne peut pas être antidatée ni signée par quelqu''un d''autre');
select pg_temp.refuse($$insert into public.formation_inscriptions (formation_id, membre_id)
  values ('80000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000b')$$,
  'Formation complète', 'le nombre de places est respecté');
select pg_temp.refuse($$update public.formation_inscriptions set note = 25$$, 'note', 'la note est sur 20');
update public.formation_inscriptions set note = 15.5, appreciation = 'Bonne lecture', statut = 'valide';
select pg_temp.affirmer((select evalue_par = '00000000-0000-0000-0000-00000000000f' and evalue_le is not null
  from public.formation_inscriptions), 'l''évaluation est signée par celui qui la saisit');
commit;

select pg_temp.affirmer((select array_agg(titre order by cree_le) = array['Inscription à la formation : Solfège niveau 1',
  'Évaluation disponible : Solfège niveau 1'] from public.notifications
  where profil_id = '00000000-0000-0000-0000-00000000000c' and lien = '/choriste/formations'),
  'le choriste est prévenu de son inscription puis de son évaluation');

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.affirmer((select count(*) = 1 from public.formations), 'le choriste voit la formation où il est inscrit');
select pg_temp.affirmer((select note = 15.5 from public.formation_inscriptions), 'et sa note');
update public.formation_inscriptions set note = 20;
select pg_temp.affirmer((select note = 15.5 from public.formation_inscriptions), 'mais ne peut pas changer sa note');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';
select pg_temp.affirmer((select count(*) = 0 from public.formations), 'un choriste non inscrit ne voit pas la formation');
select pg_temp.affirmer((select count(*) = 0 from public.formation_inscriptions), 'ni les notes des autres');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.affirmer((select count(*) = 1 from public.formation_inscriptions), 'le responsable de paroisse voit les résultats de ses membres');
commit;

update public.formations set statut = 'annulee' where id = '80000000-0000-0000-0000-00000000000a';
select pg_temp.affirmer((select count(*) = 1 from public.notifications
  where profil_id = '00000000-0000-0000-0000-00000000000c' and titre = 'Formation annulée : Solfège niveau 1'),
  'les inscrits sont prévenus de l''annulation');
update public.formations set places = null where id = '80000000-0000-0000-0000-00000000000a';
select pg_temp.refuse($$insert into public.formation_inscriptions (formation_id, membre_id)
  values ('80000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000b')$$,
  'annulée', 'aucune inscription à une formation annulée');

-- ---------------------------------------------------------------------
-- Projets et finances
-- ---------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';
insert into public.projets (id, titre, commission_id, budget_cdf, budget_usd)
values ('90000000-0000-0000-0000-00000000000a', 'Achat de pupitres', '70000000-0000-0000-0000-00000000000a', 500000, 200);
insert into public.projet_taches (projet_id, titre) values ('90000000-0000-0000-0000-00000000000a', 'Demander trois devis');
insert into public.projet_rapports (projet_id, avancement, contenu, auteur_id, cree_le)
values ('90000000-0000-0000-0000-00000000000a', 40, 'Devis reçus.', '00000000-0000-0000-0000-00000000000a', '2000-01-01');
select pg_temp.affirmer((select auteur_id = '00000000-0000-0000-0000-00000000000f' and cree_le > '2020-01-01' from public.projet_rapports),
  'un rapport est signé et daté par la base');
select pg_temp.affirmer((select avancement = 40 and statut = 'en_cours' from public.projets),
  'le rapport met à jour l''avancement du projet');
update public.projet_rapports set contenu = 'Réécrit';
select pg_temp.affirmer((select contenu = 'Devis reçus.' from public.projet_rapports), 'un rapport n''est pas modifiable');
insert into public.operations_financieres (sens, libelle, montant, devise, projet_id, commission_id)
values ('depense', 'Acompte menuisier', 150000, 'CDF', '90000000-0000-0000-0000-00000000000a', '70000000-0000-0000-0000-00000000000b');
select pg_temp.affirmer((select commission_id = '70000000-0000-0000-0000-00000000000a' from public.operations_financieres),
  'une dépense de projet est rattachée à la commission du projet');
select pg_temp.refuse($$insert into public.operations_financieres (sens, libelle, montant, projet_id)
  values ('depense', 'Autre', 1000, '90000000-0000-0000-0000-00000000000c')$$,
  'row-level security', 'le responsable n''impute rien aux projets d''une autre commission');
select pg_temp.affirmer((select saisi_par_nom <> '' from public.operations_financieres where libelle = 'Acompte menuisier'),
  'le nom de la personne qui enregistre est gardé avec l''opération');
select pg_temp.refuse($$insert into public.operations_financieres (sens, libelle, montant, projet_id)
  values ('depense', 'Négatif', -5, '90000000-0000-0000-0000-00000000000a')$$, 'montant', 'un montant est toujours positif');
update public.operations_financieres set montant = 1;
select pg_temp.affirmer((select montant = 150000 from public.operations_financieres), 'seule l''administration corrige une opération');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.operations_financieres (sens, libelle, montant, devise, date_operation)
values ('recette', 'Cotisations', 300, 'USD', current_date);
select pg_temp.refuse($$insert into public.operations_financieres (sens, libelle, montant, date_operation)
  values ('recette', 'Futur', 10, current_date + 30)$$, 'futur', 'une opération ne peut pas être datée dans le futur');
select pg_temp.affirmer((select count(*) = 2 from public.operations_financieres), 'l''administration voit toutes les opérations');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';
select pg_temp.affirmer((select count(*) = 1 and bool_and(libelle = 'Acompte menuisier') from public.operations_financieres),
  'sans « Accès aux finances », le responsable de commission ne voit que l''argent de ses projets');
select pg_temp.refuse($$insert into public.operations_financieres (sens, libelle, montant) values ('recette', 'Hors projet', 10)$$,
  'row-level security', 'et n''enregistre rien en dehors de ses projets');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.affirmer((select count(*) = 0 from public.operations_financieres),
  'un responsable de paroisse non choisi ne voit pas les finances');
select pg_temp.refuse($$insert into public.operations_financieres (sens, libelle, montant) values ('recette', 'Quête', 10)$$,
  'row-level security', 'ni n''en enregistre');
update public.profils set acces_finances = true where id = auth.uid();
commit;
select pg_temp.affirmer((select not acces_finances from public.profils where id = '00000000-0000-0000-0000-00000000000b'),
  'il ne peut pas se donner lui-même l''accès aux finances');

-- L'administration choisit qui suit les finances
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update public.profils set acces_finances = true
 where id in ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-00000000000d');
select pg_temp.affirmer((select count(*) = 3 from public.profils where acces_finances), 'l''administration coche « Accès aux finances »');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';
select pg_temp.affirmer((select count(*) = 2 from public.operations_financieres), 'choisi, le responsable de commission voit toutes les finances');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.affirmer((select count(*) = 2 from public.operations_financieres) and (select count(*) = 0 from public.projets),
  'choisi, le responsable de paroisse suit aussi les finances (mais pas les projets des commissions)');
insert into public.operations_financieres (sens, libelle, montant, devise) values ('recette', 'Quête paroisse A', 50000, 'CDF');
select pg_temp.affirmer((select saisi_par_nom = (select nom_affiche from public.profils where id = '00000000-0000-0000-0000-00000000000b')
  from public.operations_financieres where libelle = 'Quête paroisse A'), 'il enregistre une entrée d''argent, signée de son nom');
update public.operations_financieres set montant = 1 where libelle = 'Quête paroisse A';
delete from public.operations_financieres where libelle = 'Quête paroisse A';
select pg_temp.affirmer((select montant = 50000 from public.operations_financieres where libelle = 'Quête paroisse A'),
  'il ne peut ni corriger ni supprimer une opération');
select pg_temp.refuse($$insert into public.operations_financieres (sens, libelle, montant, projet_id)
  values ('depense', 'Pupitres', 1000, '90000000-0000-0000-0000-00000000000a')$$,
  'row-level security', 'il n''impute rien au projet d''une commission');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select pg_temp.affirmer((select count(*) = 0 from public.operations_financieres), 'le contrôleur ne voit rien, même coché');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.affirmer((select count(*) = 0 from public.operations_financieres) and (select count(*) = 0 from public.projet_taches),
  'un choriste ne voit rien des finances ni des projets');
commit;

-- ---------------------------------------------------------------------
-- Hébergement
-- ---------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.refuse($$insert into public.chambres (nom, capacite) values ('Pirate', 2)$$,
  'row-level security', 'un responsable de paroisse ne gère pas l''hébergement');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.chambres (id, nom, site, capacite, sexe) values
  ('a0000000-0000-0000-0000-00000000000a', 'Chambre 1', 'Internat', 1, 'M'),
  ('a0000000-0000-0000-0000-00000000000b', 'Chambre 2', 'Internat', 3, 'F');
insert into public.affectations_chambre (chambre_id, membre_id, du, au)
values ('a0000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', '2026-12-20', '2026-12-24');
select pg_temp.refuse($$insert into public.affectations_chambre (chambre_id, membre_id, du, au)
  values ('a0000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000b', '2026-12-24', '2026-12-26')$$,
  'Chambre complète', 'la capacité de la chambre est respectée');
insert into public.affectations_chambre (chambre_id, membre_id, du, au)
values ('a0000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000b', '2026-12-25', '2026-12-26');
select pg_temp.affirmer(true, 'la chambre peut accueillir quelqu''un d''autre après le départ');
select pg_temp.refuse($$insert into public.affectations_chambre (chambre_id, membre_id, du, au)
  values ('a0000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-00000000000a', '2027-01-02', '2027-01-03')$$,
  'réservée aux femmes', 'une chambre pour femmes n''accueille pas un homme');
update public.chambres set sexe = null where id = 'a0000000-0000-0000-0000-00000000000b';
select pg_temp.refuse($$insert into public.affectations_chambre (chambre_id, membre_id, du, au)
  values ('a0000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-00000000000a', '2026-12-22', '2026-12-23')$$,
  'déjà une chambre', 'un membre n''a qu''une chambre à la fois');
commit;

select pg_temp.affirmer((select count(*) = 1 from public.notifications
  where profil_id = '00000000-0000-0000-0000-00000000000c' and titre = 'Hébergement : chambre Chambre 1 (Internat) du 20/12 au 24/12/2026'),
  'le choriste est prévenu de sa chambre');

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.affirmer((select count(*) = 1 from public.affectations_chambre), 'le choriste voit son hébergement');
select pg_temp.affirmer((select array_agg(nom) = array['Chambre 1'] from public.chambres), 'et seulement sa chambre');
select pg_temp.affirmer((select count(*) = 0 from public.affectations_chambre where membre_id <> '30000000-0000-0000-0000-00000000000a'),
  'il ne voit pas qui d''autre loge dans la chambre');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.affirmer((select count(*) = 0 from public.affectations_chambre) and (select count(*) = 0 from public.chambres),
  'le responsable de paroisse ne voit pas l''hébergement');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';
select pg_temp.affirmer((select count(*) = 0 from public.affectations_chambre), 'ni le responsable de commission');
commit;

-- ---------------------------------------------------------------------
-- Chants
-- ---------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';
insert into public.chants (titre, langue, voix, lien_partition) values ('Yesu azali', 'Lingala', '{tenor}', 'https://exemple.org/p.pdf');
select pg_temp.refuse($$insert into public.chants (titre, lien_audio) values ('Lien dangereux', 'javascript:alert(1)')$$,
  'lien_audio', 'seuls les liens https sont acceptés');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.affirmer((select count(*) = 1 from public.chants), 'les choristes lisent le répertoire');
select pg_temp.refuse($$insert into public.chants (titre) values ('Pirate')$$, 'row-level security', 'mais ne le modifient pas');
commit;

select pg_temp.affirmer((select count(*) >= 8 from public.journal_operations
  where table_nom in ('commission_membres', 'formations', 'formation_inscriptions', 'projets', 'operations_financieres',
                      'chambres', 'affectations_chambre', 'chants')),
  'les opérations de l''étape 7 sont tracées dans le journal');
select pg_temp.affirmer(not has_function_privilege('authenticated', 'public.notifier_membre(uuid, text, text)', 'execute'),
  'personne ne peut écrire une notification directement');

\echo 'Tous les tests des commissions, formations, projets, finances et hébergement sont passés.'
