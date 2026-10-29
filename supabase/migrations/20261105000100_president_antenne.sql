-- Compte « Président de l'antenne PGM Muanda » : il voit tout ce que voit
-- l'administration, mais ne peut rien modifier.
--
-- Lecture : une règle « lecture président d'antenne » est ajoutée à chaque table
-- protégée (sauf les notifications, qui restent personnelles).
-- Écriture : aucune règle ne lui est donnée. Les fonctions de contrôle
-- (est_admin, peut_gerer_paroisse, peut_suivre_finances…) ne le reconnaissent pas,
-- donc toute modification est refusée par la base.

alter type public.role_utilisateur add value if not exists 'president_antenne';

-- Comparaison en texte : la nouvelle valeur peut être utilisée dans la même exécution.
create or replace function public.est_president_antenne()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.role::text = 'president_antenne' from public.profils p where p.id = auth.uid() and p.actif), false);
$$;
grant execute on function public.est_president_antenne() to authenticated;

do $$
declare
  t record;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
       and c.relname not in ('notifications')
  loop
    execute format('drop policy if exists %I on public.%I', 'lecture président d''antenne', t.relname);
    execute format('create policy %I on public.%I for select to authenticated using (public.est_president_antenne())',
                   'lecture président d''antenne', t.relname);
  end loop;
end $$;

-- Les réunions et le Conseil : déjà lisibles par tout le staff.
-- La vérification d'une carte (scanner) reste ouverte au staff, comme avant.
