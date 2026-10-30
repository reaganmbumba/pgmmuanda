-- =====================================================================
-- PGM MUANDA DIGITAL — Une image pour chaque publication du site public
-- À exécuter après 20261109000100_site_public.sql
--
-- L'image (photo d'une actualité, affiche d'une soirée, portrait d'un
-- pionnier…) s'affiche sur le site et accompagne la publication quand on
-- la partage sur WhatsApp ou Facebook. Elle va dans l'espace « site ».
-- =====================================================================

alter table public.site_elements
  add column image text check (image ~ '^images/[A-Za-z0-9._-]{1,150}$');

do $$
begin
  if to_regclass('storage.buckets') is null then return; end if;
  update storage.buckets
     set allowed_mime_types = array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/wav',
                                    'audio/x-wav', 'audio/webm', 'image/jpeg', 'image/png', 'image/webp']
   where id = 'site';
end $$;
