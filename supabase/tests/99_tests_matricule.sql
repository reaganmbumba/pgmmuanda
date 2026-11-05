-- Matricule modifiable à la main par l'administration seulement.
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

\set m '30000000-0000-0000-0000-00000000000a'

-- Le responsable de paroisse ne change pas le matricule de son membre
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.refuse($$update public.membres set matricule = 'PGM-MUA-0500' where id = '30000000-0000-0000-0000-00000000000a'$$,
  'ne peut pas être modifié', 'un responsable de paroisse ne modifie pas le matricule');
commit;

-- L'administration le change
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select pg_temp.refuse($$update public.membres set matricule = 'PGM-MUA-0002' where id = '30000000-0000-0000-0000-00000000000a'$$,
  'déjà utilisé', 'deux membres ne peuvent pas avoir le même matricule');
select pg_temp.refuse($$update public.membres set matricule = 'AB CD' where id = '30000000-0000-0000-0000-00000000000a'$$,
  'membres_matricule_format', 'un matricule avec des espaces est refusé');
update public.membres set matricule = ' pgm-mua-0003 ' where id = :'m';
select pg_temp.affirmer((select matricule = 'PGM-MUA-0003' from public.membres where id = :'m'),
  'l''administration modifie le matricule (mis en majuscules, sans espaces)');
select pg_temp.affirmer(exists (select 1 from public.membre_historique where membre_id = :'m'
  and avant->>'matricule' = 'PGM-MUA-0001' and apres->>'matricule' = 'PGM-MUA-0003'),
  'le changement de matricule est inscrit dans l''historique');
select pg_temp.affirmer((select matricule = 'PGM-MUA-0003' from public.verifier_carte(
  (select reference_qr from public.cartes where id = '40000000-0000-0000-0000-00000000000a'))),
  'la carte (même QR code) affiche le nouveau matricule');
commit;

-- Le numéro automatique saute un matricule déjà donné à la main
select setval('public.matricule_seq', 2);
insert into public.membres (id, nom, prenom, paroisse_id) values
  ('30000000-0000-0000-0000-0000000000a9', 'Lukau', 'Marie', '10000000-0000-0000-0000-00000000000a');
select pg_temp.affirmer((select matricule = 'PGM-MUA-0004' from public.membres where id = '30000000-0000-0000-0000-0000000000a9'),
  'le prochain matricule automatique saute celui déjà pris (PGM-MUA-0003)');
delete from public.membres where id = '30000000-0000-0000-0000-0000000000a9';

-- Remise en état pour les tests suivants
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update public.membres set matricule = 'PGM-MUA-0001' where id = :'m';
commit;
