-- Site public : un direct YouTube choisi par l'administration (lien collé dans
-- « Accueil et contact »), affiché sur l'accueil et sur la page Direct.

alter table public.site_reglages drop constraint if exists site_reglages_cle_check;
alter table public.site_reglages add constraint site_reglages_cle_check
  check (cle in ('accueil_titre', 'accueil_texte', 'telephone', 'whatsapp_message', 'youtube_chaine', 'youtube_id', 'causerie_ouverte', 'youtube_direct'));

insert into public.site_reglages (cle, valeur) values ('youtube_direct', 'VS1umwf42II')
  on conflict (cle) do nothing;
