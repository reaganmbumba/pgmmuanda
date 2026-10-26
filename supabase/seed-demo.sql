-- =====================================================================
-- JEU DE DÉMONSTRATION — personnes et paroisses FICTIVES.
-- Toutes les lignes portent est_demo = true. À ne pas charger en production.
-- Pour tout effacer : voir la fin de ce fichier.
-- =====================================================================

insert into public.paroisses (nom, est_demo) values
  ('Muanda-Centre (démo)', true), ('Nsiamfumu (démo)', true), ('Banana (démo)', true),
  ('Kimuabi (démo)', true), ('Tonde (démo)', true)
on conflict (nom) do nothing;

insert into public.chorales (nom, paroisse_id, est_demo)
select c.nom, p.id, true
  from (values ('Chorale Centrale', 'Muanda-Centre (démo)'), ('Voix de Nsiamfumu', 'Nsiamfumu (démo)'),
               ('Écho de Banana', 'Banana (démo)'), ('Louange Kimuabi', 'Kimuabi (démo)'),
               ('Harmonie de Tonde', 'Tonde (démo)')) as c(nom, paroisse)
  join public.paroisses p on p.nom = c.paroisse
on conflict do nothing;

insert into public.commissions (nom, description, est_demo) values
  ('Commission artistique (démo)', 'Répertoire, répétitions et direction musicale', true),
  ('Commission formation (démo)', 'Solfège, technique vocale et évaluations', true),
  ('Commission événements (démo)', 'Concerts et manifestations', true)
on conflict (nom) do nothing;

insert into public.membres (nom, postnom, prenom, sexe, telephone, email, paroisse_id, chorale_id, voix, fonction, statut, est_demo)
select m.nom, m.postnom, m.prenom, m.sexe, m.tel, m.email, p.id, c.id, m.voix::public.voix, m.fonction, m.statut::public.statut_membre, true
  from (values
    ('Nkanga', 'Mavungu', 'Daniel', 'M', '+243 81 000 0001', 'daniel.demo@example.org', 'Muanda-Centre (démo)', 'tenor', 'Chef de chœur', 'actif'),
    ('Lusala', 'Mbuku', 'Esther', 'F', '+243 82 000 0002', 'esther.demo@example.org', 'Muanda-Centre (démo)', 'soprano', 'Choriste', 'actif'),
    ('Makiadi', 'Nzuzi', 'Ruth', 'F', '+243 89 000 0003', 'ruth.demo@example.org', 'Nsiamfumu (démo)', 'alto', 'Secrétaire de chorale', 'actif'),
    ('Phanzu', 'Kiese', 'Samuel', 'M', '+243 85 000 0004', 'samuel.demo@example.org', 'Banana (démo)', 'basse', 'Choriste', 'suspendu'),
    ('Ndombasi', 'Luzolo', 'Grâce', 'F', '+243 81 000 0005', 'grace.demo@example.org', 'Kimuabi (démo)', 'soprano', 'Responsable des sopranos', 'actif'),
    ('Kiala', 'Mampuya', 'Joël', 'M', '+243 84 000 0006', 'joel.demo@example.org', 'Tonde (démo)', 'tenor', 'Choriste', 'en_attente')
  ) as m(nom, postnom, prenom, sexe, tel, email, paroisse, voix, fonction, statut)
  join public.paroisses p on p.nom = m.paroisse
  left join public.chorales c on c.paroisse_id = p.id;

insert into public.cartes (membre_id)
select id from public.membres where est_demo
   and not exists (select 1 from public.cartes c where c.membre_id = membres.id);

-- Pour effacer toutes les données de démonstration :
-- delete from public.membres where est_demo;
-- delete from public.chorales where est_demo;
-- delete from public.commissions where est_demo;
-- delete from public.paroisses where est_demo;
