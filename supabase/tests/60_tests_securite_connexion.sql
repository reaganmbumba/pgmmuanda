-- Tests de l'Étape 8 : limitation des tentatives de connexion.
\set ON_ERROR_STOP on

create or replace function pg_temp.affirmer(condition boolean, message text) returns void
language plpgsql as $$ begin
  if not coalesce(condition, false) then raise exception 'ÉCHEC : %', message; end if;
  raise notice 'OK : %', message;
end $$;

select pg_temp.affirmer(not public.connexion_bloquee('grace'), 'un compte sans échec n''est pas bloqué');
select public.noter_echec_connexion('Grace') from generate_series(1, 4);
select pg_temp.affirmer(not public.connexion_bloquee('grace'), '4 mots de passe faux : encore autorisé');
select public.noter_echec_connexion(' GRACE ');
select pg_temp.affirmer(public.connexion_bloquee('grace'), '5 mots de passe faux : compte bloqué (sans tenir compte des majuscules)');
select pg_temp.affirmer(not public.connexion_bloquee('paul'), 'les autres comptes ne sont pas bloqués');
update public.tentatives_connexion set cree_le = now() - interval '16 minutes';
select pg_temp.affirmer(not public.connexion_bloquee('grace'), 'le blocage s''arrête après 15 minutes');
select public.noter_echec_connexion('paul');
select public.effacer_echecs_connexion('paul');
select pg_temp.affirmer((select count(*) = 0 from public.tentatives_connexion where cle = 'paul'), 'une connexion réussie efface les échecs');

select pg_temp.affirmer(not has_function_privilege('anon', 'public.noter_echec_connexion(text)', 'execute')
  and not has_function_privilege('authenticated', 'public.effacer_echecs_connexion(text)', 'execute')
  and not has_function_privilege('authenticated', 'public.connexion_bloquee(text)', 'execute'),
  'seul le serveur de l''application peut utiliser ces fonctions');
select pg_temp.affirmer(not has_table_privilege('authenticated', 'public.tentatives_connexion', 'select'),
  'personne ne peut lire la liste des tentatives');

\echo 'Tous les tests de protection de la connexion sont passés.'
