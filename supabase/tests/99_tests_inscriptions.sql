-- Inscription par lien : le visiteur dépose sa demande, le staff de son périmètre la valide.
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

-- Paroisses A et B, chorale A, admin (…0a) et responsable de la paroisse A (…0b) : voir 10_tests_securite.sql
select code as code from public.inscription_lien \gset

begin;
set local role anon;
select pg_temp.affirmer(public.inscription_formulaire(:'code') -> 'paroisses' @> '[{"nom": "Paroisse A"}]',
  'le bon lien donne la liste des paroisses');
select pg_temp.affirmer(public.inscription_formulaire('mauvaiscode12345') is null, 'un mauvais lien ne donne rien');
select pg_temp.refuse($$select 1 from public.paroisses$$, null, 'un visiteur ne lit pas les tables');
select pg_temp.refuse($$select public.inscription_deposer('mauvaiscode12345', 'Lusamba', '', 'Marie', 'F', '+243 81 000 1111', '', '10000000-0000-0000-0000-00000000000a', null, 'alto', '')$$,
  'plus valable', 'un mauvais lien est refusé');
select pg_temp.affirmer(public.inscription_deposer(:'code', 'Lusamba', '', 'Marie', 'F', '+243 81 000 1111', '',
  '10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', 'alto', 'data:image/jpeg;base64,AAAA') is not null,
  'un visiteur dépose son inscription avec sa photo');
select pg_temp.refuse($$select public.inscription_deposer('$$ || :'code' || $$', 'Lusamba', '', 'Marie', 'F', '081 000 1111', '', '10000000-0000-0000-0000-00000000000a', null, null, '')$$,
  'attend déjà', 'pas deux inscriptions en attente avec le même numéro');
select pg_temp.refuse($$select public.inscription_deposer('$$ || :'code' || $$', 'Kiese', '', 'Jean', 'M', '+243 82 000 2222', '', '10000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-00000000000a', null, '')$$,
  'n''appartient pas', 'la chorale doit être celle de la paroisse');
select pg_temp.affirmer(public.inscription_deposer(:'code', 'Kiese', '', 'Jean', 'M', '+243 82 000 2222', '',
  '10000000-0000-0000-0000-00000000000b', null, null, '') is not null, 'une inscription dans la paroisse B');
select pg_temp.refuse($$select 1 from public.inscriptions$$, null, 'un visiteur ne lit pas les inscriptions');
commit;

select pg_temp.affirmer((select count(*) >= 1 from public.notifications
  where profil_id = '00000000-0000-0000-0000-00000000000b' and lien = '/staff/inscriptions'),
  'le responsable de la paroisse est prévenu');

select id as kiese from public.inscriptions where nom = 'Kiese' \gset
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';  -- responsable de la paroisse A
select pg_temp.affirmer((select count(*) = 1 from public.inscriptions where statut = 'en_attente'),
  'le responsable ne voit que les inscriptions de sa paroisse');
select pg_temp.affirmer((select code = :'code' from public.inscription_lien), 'il voit le lien à partager');
with l as (update public.inscription_lien set code = 'changeparlui12345' returning 1)
select pg_temp.affirmer(count(*) = 0, 'il ne change pas le lien') from l;
select pg_temp.refuse('select public.inscription_accepter(''' || :'kiese' || ''')',
  'pas le droit', 'il ne valide pas une inscription d''une autre paroisse');
select public.inscription_accepter(id) as nouveau from public.inscriptions where nom = 'Lusamba' \gset
select pg_temp.affirmer((select statut = 'actif' and photo_url = 'data:image/jpeg;base64,AAAA' and matricule like 'PGM-MUA-%'
  and chorale_id = '20000000-0000-0000-0000-00000000000a' from public.membres where id = :'nouveau'),
  'accepter crée la fiche active avec matricule et photo');
select pg_temp.refuse($$select public.inscription_accepter(id) from public.inscriptions where nom = 'Lusamba'$$,
  'déjà été traitée', 'pas deux fois');
commit;

begin;
set local role anon;
select pg_temp.refuse($$select public.inscription_deposer('$$ || :'code' || $$', 'Lusamba', '', 'Marie', 'F', '0810001111', '', '10000000-0000-0000-0000-00000000000a', null, null, '')$$,
  'déjà inscrit', 'un numéro déjà membre est refusé');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';  -- admin
with l as (update public.inscription_lien set ouvert = false returning 1)
select pg_temp.affirmer(count(*) = 1, 'l''administration ferme le lien') from l;
commit;

begin;
set local role anon;
select pg_temp.affirmer(public.inscription_formulaire(:'code') is null, 'un lien fermé ne marche plus');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';  -- choriste
select pg_temp.refuse('select public.inscription_accepter(''' || :'kiese' || ''')',
  'pas le droit', 'un choriste ne valide aucune inscription');
commit;

-- Compte créé à l'inscription : relié à la fiche si acceptée, désactivé si refusée
update public.inscription_lien set ouvert = true;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000ab1', 'insc1@sans-email.test'), ('00000000-0000-0000-0000-000000000ab2', 'insc2@sans-email.test');
select public.inscription_deposer(:'code', 'Mbuku', '', 'Rose', 'F', '+243 89 000 3333', '', '10000000-0000-0000-0000-00000000000a', null, null, '') as i1 \gset
select public.inscription_deposer(:'code', 'Nzuzi', '', 'Marc', 'M', '+243 89 000 4444', '', '10000000-0000-0000-0000-00000000000a', null, null, '') as i2 \gset
update public.inscriptions set profil_id = '00000000-0000-0000-0000-000000000ab1' where id = :'i1';
update public.inscriptions set profil_id = '00000000-0000-0000-0000-000000000ab2' where id = :'i2';
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';  -- responsable de la paroisse A
select public.inscription_accepter(:'i1') as m1 \gset
select public.inscription_refuser(:'i2');
commit;
select pg_temp.affirmer((select profil_id = '00000000-0000-0000-0000-000000000ab1' from public.membres where id = :'m1'),
  'accepter relie le compte créé à l''inscription à la nouvelle fiche');
select pg_temp.affirmer((select count(*) = 1 from public.notifications where profil_id = '00000000-0000-0000-0000-000000000ab1'),
  'la personne est prévenue que son inscription est validée');
select pg_temp.affirmer((select not actif from public.profils where id = '00000000-0000-0000-0000-000000000ab2'),
  'refuser désactive le compte créé à l''inscription');
select pg_temp.affirmer((select statut = 'refusee' from public.inscriptions where id = :'i2'), 'l''inscription refusée est close');
delete from public.membres where id = :'m1';

-- Remise en état pour les tests suivants
update public.inscription_lien set ouvert = true;
delete from public.inscriptions;
delete from public.membres where id = :'nouveau';
