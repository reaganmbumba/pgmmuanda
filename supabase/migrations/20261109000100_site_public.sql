-- =====================================================================
-- PGM MUANDA DIGITAL — Contenu du site public, géré par l'administration
-- À exécuter après 20261108000100_registre_chorales.sql
--
-- * site_elements : actualités, chorales, commissions, programme de la
--   semaine, questions fréquentes et audios de répétition, affichés sur le
--   site public. Tout le monde (même sans compte) lit ce qui est publié ;
--   seule l'administration ajoute, modifie et supprime.
--   Aussi : soirées musicales, cas sociaux et pionniers.
-- * site_reglages : textes et réglages uniques (accueil, téléphone, YouTube).
-- * causerie_messages : la causerie du site, où chacun écrit avec un simple
--   prénom ou surnom, sans compte ni numéro. Les messages passent par une
--   fonction qui limite le débit ; l'administration masque ou supprime.
-- * Les fichiers audio vont dans l'espace de stockage public « site »
--   (50 Mo au plus par fichier), déposés par l'administration.
-- =====================================================================

create table public.site_elements (
  id uuid primary key default gen_random_uuid(),
  rubrique text not null check (rubrique in ('actualite', 'chorale', 'commission', 'programme', 'question', 'audio', 'soiree', 'social', 'pionnier')),
  titre text not null check (length(trim(titre)) between 1 and 200),
  sous_titre text check (length(sous_titre) <= 200),
  texte text check (length(texte) <= 20000),
  date_element date,
  fichier text check (fichier ~ '^audios/[A-Za-z0-9._-]{1,150}$'),
  ordre int not null default 0,
  publie boolean not null default true,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint audio_avec_fichier check ((rubrique = 'audio') = (fichier is not null))
);
create index on public.site_elements (rubrique, ordre, date_element desc);

create or replace function public.dater_site_element()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.modifie_le := now();
  return new;
end $$;
create trigger site_elements_date before update on public.site_elements
  for each row execute function public.dater_site_element();

create table public.site_reglages (
  cle text primary key check (cle in ('accueil_titre', 'accueil_texte', 'telephone', 'whatsapp_message', 'youtube_chaine', 'youtube_id', 'causerie_ouverte')),
  valeur text not null check (length(valeur) <= 2000)
);

alter table public.site_elements enable row level security;
alter table public.site_reglages enable row level security;
-- Les visiteurs sans compte n'ont pas accès aux fonctions de droits : une règle à part pour eux.
create policy "lecture visiteurs" on public.site_elements for select to anon using (publie);
create policy "lecture connectés" on public.site_elements for select to authenticated
  using (publie or public.est_admin() or public.est_president_antenne());
create policy "gestion administration" on public.site_elements for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
create policy "lecture publique" on public.site_reglages for select to anon, authenticated using (true);
create policy "gestion administration" on public.site_reglages for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
grant select on public.site_elements, public.site_reglages to anon;

create trigger journal_site_elements after insert or update or delete on public.site_elements
  for each row execute function public.journaliser();
create trigger journal_site_reglages after insert or update or delete on public.site_reglages
  for each row execute function public.journaliser();

-- Contenu de départ : ce que le site affiche aujourd'hui
insert into public.site_reglages (cle, valeur) values
  ('accueil_titre', 'Servir Dieu par le chant, à Muanda'),
  ('accueil_texte', 'La Présidence générale de la musique rassemble les chorales de l''EBNM KCC. L''Antenne de Muanda en est la représentation locale.'),
  ('telephone', '+243 825 717 444'),
  ('whatsapp_message', 'Paix ! Je vous écris depuis le site de la PGM Antenne de Muanda.'),
  ('youtube_chaine', 'pgmmuanda'),
  ('causerie_ouverte', 'oui')
on conflict (cle) do nothing;

insert into public.site_elements (rubrique, titre, sous_titre, texte, date_element, ordre) values
  ('actualite', 'La PGM Antenne de Muanda passe au numérique', 'Avec PGM MUANDA DIGITAL, chaque choriste et chaque responsable a son espace personnel pour suivre la vie de la PGM depuis son téléphone.',
   'La Présidence générale de la musique, Antenne de Muanda (EBNM KCC), a le plaisir d''annoncer la numérisation de son système d''organisation. Les fiches des membres, les cartes, le programme des activités, les présences, les annonces et les chants sont maintenant réunis dans une seule application : PGM MUANDA DIGITAL.

Jusqu''ici, beaucoup d''informations circulaient sur papier ou dans plusieurs groupes de messages. L''application met tout cela au même endroit, de manière claire et simple.

Chaque choriste dispose d''une carte de membre numérique avec un code QR. Les responsables tiennent la liste des membres, le registre de présence, le programme, les annonces, les chants, les réunions et les cotisations. Chacun ne voit que ce qui concerne sa fonction, et les données sont sauvegardées chaque nuit.

Cette numérisation ne remplace ni la prière, ni les répétitions, ni la fraternité entre choristes. Elle doit nous aider à mieux nous organiser et à consacrer davantage de temps à l''essentiel : servir Dieu par le chant.

Que Dieu bénisse la PGM Antenne de Muanda et tous ses choristes.', '2026-10-30', 0),
  ('chorale', 'Vision', 'Paroisse Atlantique', null, null, 1),
  ('chorale', 'Echo', 'Paroisse Pika Pende', null, null, 2),
  ('chorale', 'Alliance', 'Paroisse Itonde', null, null, 3),
  ('chorale', 'CHOPDI', 'Paroisse Kitsiaku', null, null, 4),
  ('chorale', 'Oracle', 'Chorale urbaine, dans toutes les paroisses', null, null, 5),
  ('commission', 'Coordination des commissions', null, 'Relie le travail de toutes les commissions.', null, 1),
  ('commission', 'Finances & Budget', null, 'Cotisations, caisse et budget des activités.', null, 2),
  ('commission', 'Uniforme et Tenue', null, 'Les uniformes et la tenue lors des productions.', null, 3),
  ('commission', 'Logistique & Infrastructure', null, 'Matériel, salles, transport et hébergement.', null, 4),
  ('commission', 'Presse, Communication et Promotion', null, 'Annonces, photos, réseaux et ce site.', null, 5),
  ('commission', 'Censure, Musique & Répertoire', null, 'Choix et vérification des chants.', null, 6),
  ('commission', 'Santé & Assistance', null, 'Soutien aux choristes malades ou dans le besoin.', null, 7),
  ('programme', 'Lundi', '15h30 – 17h30', 'Répétition des femmes', null, 1),
  ('programme', 'Lundi', '17h30 – 19h30', 'Répétition des hommes', null, 2),
  ('programme', 'Jeudi', '15h30 – 17h30', 'Répétition des femmes', null, 3),
  ('programme', 'Jeudi', '17h30 – 19h30', 'Répétition des hommes', null, 4),
  ('programme', 'Dimanche', 'Culte', 'Louange dans chaque paroisse', null, 5),
  ('question', 'Qui peut devenir choriste ?', null, 'Tout KCCiste de bonne moralité et disponible, qui fait une demande écrite au Comité directeur de la chorale de sa paroisse, réussit le test et signe l''acte d''engagement. Les enfants vont dans la chorale junior.', null, 1),
  ('question', 'Quand ont lieu les répétitions ?', null, 'Le lundi et le jeudi : de 15h30 à 17h30 pour les femmes, de 17h30 à 19h30 pour les hommes. Les horaires exacts de chaque chorale sont dans l''espace membres.', null, 2),
  ('question', 'Faut-il payer une cotisation ?', null, 'Oui. Chaque membre paie régulièrement sa cotisation, comme le prévoit le Règlement intérieur. Le montant est donné par votre chorale.', null, 3),
  ('question', 'Comment obtenir mon compte dans l''application ?', null, 'Votre responsable de chorale crée votre compte et vous envoie, par WhatsApp, votre identifiant et un mot de passe provisoire. Aucune adresse e-mail n''est nécessaire.', null, 4),
  ('question', 'J''ai oublié mon mot de passe. Que faire ?', null, 'Sur la page « Se connecter », touchez « Mot de passe oublié ? », ou demandez à votre responsable de chorale de vous en donner un nouveau.', null, 5),
  ('question', 'Comment vérifier une carte de membre ?', null, 'Scannez le code QR de la carte avec l''appareil photo d''un téléphone : une page indique tout de suite si la carte est valable.', null, 6),
  ('question', 'Où trouver le Règlement intérieur ?', null, 'Dans la rubrique « Règlement » de ce site : un résumé simple et le texte complet à télécharger.', null, 7);

-- Causerie : discussion instantanée ouverte à tous, sans compte ni numéro
create table public.causerie_messages (
  id bigint generated always as identity primary key,
  pseudo text not null check (length(trim(pseudo)) between 2 and 30),
  texte text not null check (length(trim(texte)) between 1 and 500),
  -- clé tirée au hasard par le navigateur : sert seulement à limiter le débit
  appareil text not null check (appareil ~ '^[A-Za-z0-9_-]{16,64}$'),
  masque boolean not null default false,
  cree_le timestamptz not null default now()
);
create index on public.causerie_messages (cree_le desc);
alter table public.causerie_messages enable row level security;
create policy "lecture visiteurs" on public.causerie_messages for select to anon using (not masque);
create policy "lecture connectés" on public.causerie_messages for select to authenticated
  using (not masque or public.est_admin() or public.est_president_antenne());
create policy "modération" on public.causerie_messages for update to authenticated
  using (public.est_admin()) with check (public.est_admin());
create policy "suppression" on public.causerie_messages for delete to authenticated using (public.est_admin());
-- La clé d'appareil reste privée : le public ne lit que ces colonnes
revoke select on public.causerie_messages from anon, authenticated;
grant select (id, pseudo, texte, masque, cree_le) on public.causerie_messages to anon, authenticated;

/* Seule façon d'écrire dans la causerie. Refuse quand la causerie est fermée, quand un
   appareil écrit trop vite (un message toutes les 5 secondes, 30 par heure) ou quand
   tout le site dépasse 120 messages par minute. Les numéros de téléphone sont refusés
   pour protéger chacun. */
create or replace function public.causerie_envoyer(p_pseudo text, p_texte text, p_appareil text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_id bigint;
begin
  if coalesce((select valeur from public.site_reglages where cle = 'causerie_ouverte'), 'oui') <> 'oui' then
    raise exception 'La causerie est fermée pour le moment.';
  end if;
  p_pseudo := trim(regexp_replace(coalesce(p_pseudo, ''), '\s+', ' ', 'g'));
  p_texte := trim(coalesce(p_texte, ''));
  if length(p_pseudo) < 2 or length(p_pseudo) > 30 then raise exception 'Votre nom doit avoir de 2 à 30 caractères.'; end if;
  if length(p_texte) < 1 then raise exception 'Le message est vide.'; end if;
  if length(p_texte) > 500 then raise exception 'Le message est trop long (500 caractères au plus).'; end if;
  if coalesce(p_appareil, '') !~ '^[A-Za-z0-9_-]{16,64}$' then raise exception 'Rechargez la page et réessayez.'; end if;
  if regexp_replace(p_texte, '[\s.()/-]', '', 'g') ~ '\+?\d{9,}' then
    raise exception 'Pour votre sécurité, n''écrivez pas de numéro de téléphone dans la causerie.';
  end if;
  if exists (select 1 from public.causerie_messages where appareil = p_appareil and cree_le > now() - interval '5 seconds')
     or (select count(*) from public.causerie_messages where appareil = p_appareil and cree_le > now() - interval '1 hour') >= 30
     or (select count(*) from public.causerie_messages where cree_le > now() - interval '1 minute') >= 120 then
    raise exception 'Doucement : attendez un peu avant d''envoyer un autre message.';
  end if;
  insert into public.causerie_messages (pseudo, texte, appareil) values (p_pseudo, p_texte, p_appareil)
    returning id into v_id;
  return v_id;
end $$;
revoke all on function public.causerie_envoyer(text, text, text) from public;
grant execute on function public.causerie_envoyer(text, text, text) to anon, authenticated;

-- Espace de stockage public des audios (absent des bases de test sans Supabase Storage)
do $$
begin
  if to_regclass('storage.buckets') is null then return; end if;
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('site', 'site', true, 52428800,
          array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm'])
  on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
  execute $p$create policy "site : dépôt par l'administration" on storage.objects for insert to authenticated
    with check (bucket_id = 'site' and public.est_admin())$p$;
  execute $p$create policy "site : remplacement par l'administration" on storage.objects for update to authenticated
    using (bucket_id = 'site' and public.est_admin()) with check (bucket_id = 'site' and public.est_admin())$p$;
  execute $p$create policy "site : suppression par l'administration" on storage.objects for delete to authenticated
    using (bucket_id = 'site' and public.est_admin())$p$;
end $$;
