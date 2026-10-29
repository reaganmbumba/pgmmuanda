-- Commissions de la PGM Antenne de Muanda (liste donnée par l'administration, 29/10/2026).
-- 1. Ajoute les 7 commissions (sans doublon si elles existent déjà).
-- 2. Efface les autres commissions, seulement si personne ni rien n'y est rattaché
--    (aucun membre, responsable, projet, formation, activité ni opération d'argent).
-- 3. Affiche la liste finale.

insert into public.commissions (nom) values
  ('Coordination des commissions'),
  ('Commission Finances & Budget'),
  ('Commission Uniforme et Tenue'),
  ('Commission Logistique & Infrastructure'),
  ('Commission Presse, Communication et Promotion'),
  ('Commission Censure, Musique & Répertoire'),
  ('Commission Santé & Assistance')
on conflict (nom) do nothing;

delete from public.commissions c
 where c.nom not in (
         'Coordination des commissions', 'Commission Finances & Budget', 'Commission Uniforme et Tenue',
         'Commission Logistique & Infrastructure', 'Commission Presse, Communication et Promotion',
         'Commission Censure, Musique & Répertoire', 'Commission Santé & Assistance')
   and not exists (select 1 from public.commission_membres x where x.commission_id = c.id)
   and not exists (select 1 from public.profils x where x.commission_id = c.id)
   and not exists (select 1 from public.projets x where x.commission_id = c.id)
   and not exists (select 1 from public.formations x where x.commission_id = c.id)
   and not exists (select 1 from public.activites x where x.commission_id = c.id)
   and not exists (select 1 from public.operations_financieres x where x.commission_id = c.id);

select nom as "Commissions", case when nom in (
         'Coordination des commissions', 'Commission Finances & Budget', 'Commission Uniforme et Tenue',
         'Commission Logistique & Infrastructure', 'Commission Presse, Communication et Promotion',
         'Commission Censure, Musique & Répertoire', 'Commission Santé & Assistance')
       then 'OK' else 'Gardée : quelqu''un ou quelque chose y est encore rattaché' end as "Remarque"
  from public.commissions order by nom;
