-- Chorales de la PGM Antenne de Muanda (liste donnée par l'administration, 29/10/2026).
-- À exécuter APRÈS le fichier migrations/20261107000100_chorales_urbaines.sql.
-- 1. Retrouve chaque paroisse par son nom (Atlantique, Pika Pende, Itonde, Kitsiaku).
--    Si une paroisse est introuvable, rien n'est enregistré et le message dit laquelle.
-- 2. Ajoute les 15 chorales (sans doublon si elles existent déjà).
--    Oracle n'a pas de paroisse : c'est une chorale urbaine, elle chante partout.
-- 3. N'efface aucune autre chorale. Affiche la liste finale.

do $$
declare
  groupe record;
  v_paroisse uuid;
  v_nb int;
  v_liste text;
  v_type text;
begin
  for groupe in select * from (values
      ('Vision', '%atlanti%'), ('Echo', '%pika%'), ('Alliance', '%itond%'),
      ('CHOPDI', '%k_t%a_u%'), ('Oracle', null)) as g(nom, motif)
  loop
    v_paroisse := null;
    if groupe.motif is not null then
      select count(*), min(id::text)::uuid into v_nb, v_paroisse
        from public.paroisses where lower(nom) like groupe.motif and not est_demo;
      if v_nb <> 1 then
        select string_agg(nom, ', ' order by nom) into v_liste from public.paroisses where not est_demo;
        raise exception 'Paroisse de la chorale % : % trouvée(s) au lieu d''une. Paroisses enregistrées : %',
          groupe.nom, v_nb, coalesce(v_liste, 'aucune');
      end if;
    end if;
    foreach v_type in array array['Femme', 'Homme', 'Junior (Filles et Garçons)'] loop
      if not exists (select 1 from public.chorales
                      where lower(nom) = lower(groupe.nom || ' ' || v_type)
                        and paroisse_id is not distinct from v_paroisse) then
        insert into public.chorales (nom, paroisse_id) values (groupe.nom || ' ' || v_type, v_paroisse);
      end if;
    end loop;
  end loop;
end $$;

select c.nom as "Chorale", coalesce(p.nom, 'Urbain (toutes paroisses)') as "Paroisse",
       case when c.nom ~ '^(Vision|Echo|Alliance|CHOPDI|Oracle) (Femme|Homme|Junior \(Filles et Garçons\))$'
            then 'OK' else 'Autre chorale (déjà enregistrée)' end as "Remarque"
  from public.chorales c left join public.paroisses p on p.id = c.paroisse_id
 where not c.est_demo
 order by p.nom nulls last, c.nom;
