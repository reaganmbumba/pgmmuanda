-- =====================================================================
-- PGM MUANDA DIGITAL — Inscription par lien
-- Le staff envoie un lien (par WhatsApp…) : la personne remplit elle-même
-- ses coordonnées et met sa photo. Sa demande attend la validation du staff ;
-- une fois acceptée, elle devient une fiche membre (avec matricule) comme les autres.
-- À exécuter après 20261109000200_site_images.sql
-- =====================================================================

-- Le lien : un seul pour toute l'antenne, avec un code secret que l'administration peut changer.
create table public.inscription_lien (
  id boolean primary key default true check (id),
  code text not null check (code ~ '^[a-z0-9]{12,40}$'),
  ouvert boolean not null default true,
  modifie_le timestamptz not null default now()
);
insert into public.inscription_lien (code) values (substr(replace(gen_random_uuid()::text, '-', ''), 1, 20));
alter table public.inscription_lien enable row level security;
create policy "lecture staff" on public.inscription_lien for select to authenticated
  using (public.est_admin() or public.est_president_antenne()
      or public.mon_role()::text in ('responsable_paroisse', 'responsable_chorale'));
create policy "gestion admin" on public.inscription_lien for update to authenticated
  using (public.est_admin()) with check (public.est_admin());
grant select, update on public.inscription_lien to authenticated;

-- Les demandes d'inscription
create table public.inscriptions (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (length(trim(nom)) between 1 and 80),
  postnom text not null default '' check (length(postnom) <= 80),
  prenom text not null check (length(trim(prenom)) between 1 and 80),
  sexe char(1) check (sexe in ('M', 'F')),
  telephone text not null check (telephone ~ '^\+?[0-9 ]{6,20}$'),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  paroisse_id uuid not null references public.paroisses(id) on delete cascade,
  chorale_id uuid references public.chorales(id) on delete set null,
  voix public.voix,
  photo_url text check (
    photo_url is null
    or (photo_url ~ '^data:image/jpeg;base64,[A-Za-z0-9+/]+=*$' and length(photo_url) <= 400000)
  ),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'acceptee', 'refusee')),
  membre_id uuid references public.membres(id) on delete set null,
  traitee_par uuid references public.profils(id) on delete set null,
  traitee_le timestamptz,
  cree_le timestamptz not null default now()
);
create index on public.inscriptions (statut, cree_le desc);
alter table public.inscriptions enable row level security;
create policy "lecture selon périmètre" on public.inscriptions for select to authenticated
  using (public.peut_gerer_membre_de(paroisse_id, chorale_id) or public.est_president_antenne());
create policy "traitement selon périmètre" on public.inscriptions for update to authenticated
  using (public.peut_gerer_membre_de(paroisse_id, chorale_id))
  with check (public.peut_gerer_membre_de(paroisse_id, chorale_id));
create policy "suppression admin" on public.inscriptions for delete to authenticated using (public.est_admin());
grant select, update, delete on public.inscriptions to authenticated;

/* Ce que le formulaire public a besoin de connaître : les paroisses et leurs chorales.
   Ne répond que si le code du lien est bon et que le lien est ouvert. */
create or replace function public.inscription_formulaire(p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'paroisses', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nom', p.nom) order by p.nom)
                             from public.paroisses p), '[]'::jsonb),
    'chorales', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'nom', c.nom, 'paroisseId', c.paroisse_id) order by c.nom)
                            from public.chorales c), '[]'::jsonb))
   where exists (select 1 from public.inscription_lien l where l.ouvert and l.code = p_code);
$$;

/* Seule façon de déposer une inscription. Refuse un mauvais lien, un numéro déjà inscrit
   ou déjà en attente, et limite le débit (60 demandes par heure pour tout le site). */
create or replace function public.inscription_deposer(
  p_code text, p_nom text, p_postnom text, p_prenom text, p_sexe text, p_telephone text,
  p_email text, p_paroisse uuid, p_chorale uuid, p_voix text, p_photo text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_tel text := trim(regexp_replace(coalesce(p_telephone, ''), '\s+', ' ', 'g'));
  v_chiffres text := right(regexp_replace(coalesce(p_telephone, ''), '\D', '', 'g'), 9);
  v_profil uuid;
begin
  if not exists (select 1 from public.inscription_lien l where l.ouvert and l.code = p_code) then
    raise exception 'Ce lien d''inscription n''est plus valable. Demandez un nouveau lien au responsable.';
  end if;
  if length(trim(coalesce(p_nom, ''))) = 0 then raise exception 'Indiquez votre nom.'; end if;
  if length(trim(coalesce(p_prenom, ''))) = 0 then raise exception 'Indiquez votre prénom.'; end if;
  if v_tel !~ '^\+?[0-9 ]{6,20}$' then raise exception 'Numéro de téléphone invalide (ex. +243 81 234 5678).'; end if;
  if not exists (select 1 from public.paroisses where id = p_paroisse) then raise exception 'Choisissez votre paroisse.'; end if;
  if p_chorale is not null and not exists (
    select 1 from public.chorales c where c.id = p_chorale and (c.paroisse_id is null or c.paroisse_id = p_paroisse)
  ) then
    raise exception 'La chorale choisie n''appartient pas à cette paroisse.';
  end if;
  if exists (select 1 from public.membres m where not m.archive
              and right(regexp_replace(coalesce(m.telephone, ''), '\D', '', 'g'), 9) = v_chiffres) then
    raise exception 'Ce numéro de téléphone est déjà inscrit. Contactez votre responsable.';
  end if;
  if exists (select 1 from public.inscriptions i where i.statut = 'en_attente'
              and right(regexp_replace(i.telephone, '\D', '', 'g'), 9) = v_chiffres) then
    raise exception 'Une inscription avec ce numéro attend déjà la validation du responsable.';
  end if;
  if (select count(*) from public.inscriptions where cree_le > now() - interval '1 hour') >= 60 then
    raise exception 'Trop d''inscriptions en ce moment. Réessayez dans une heure.';
  end if;

  insert into public.inscriptions (nom, postnom, prenom, sexe, telephone, email, paroisse_id, chorale_id, voix, photo_url)
  values (trim(p_nom), trim(coalesce(p_postnom, '')), trim(p_prenom), nullif(p_sexe, ''), v_tel,
          nullif(lower(trim(coalesce(p_email, ''))), ''), p_paroisse, p_chorale,
          nullif(p_voix, '')::public.voix, nullif(p_photo, ''))
  returning id into v_id;

  -- Prévenir l'administration et les responsables concernés
  for v_profil in
    select p.id from public.profils p
     where p.actif and (p.role::text in ('super_admin', 'presidence')
        or (p.role::text = 'responsable_paroisse' and p.paroisse_id = p_paroisse)
        or (p.role::text = 'responsable_chorale' and p_chorale is not null and p.chorale_id = p_chorale))
  loop
    perform public.notifier(v_profil,
      'Nouvelle inscription à valider : ' || trim(p_prenom) || ' ' || trim(p_nom), '/staff/inscriptions');
  end loop;
  return v_id;
end $$;

/* Accepter : crée la fiche membre (active) avec la photo. Seulement pour l'administration
   et le responsable de la paroisse ou de la chorale choisie (même règle que pour inscrire un membre). */
create or replace function public.inscription_accepter(p_inscription uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_i public.inscriptions;
  v_membre uuid;
begin
  select * into v_i from public.inscriptions where id = p_inscription for update;
  if v_i.id is null or not public.peut_gerer_membre_de(v_i.paroisse_id, v_i.chorale_id) then
    raise exception 'Vous n''avez pas le droit de valider cette inscription.';
  end if;
  if v_i.statut <> 'en_attente' then raise exception 'Cette inscription a déjà été traitée.'; end if;
  insert into public.membres (nom, postnom, prenom, sexe, telephone, email, paroisse_id, chorale_id, voix, photo_url, statut)
  values (v_i.nom, v_i.postnom, v_i.prenom, v_i.sexe, v_i.telephone, v_i.email, v_i.paroisse_id, v_i.chorale_id,
          v_i.voix, v_i.photo_url, 'actif')
  returning id into v_membre;
  update public.inscriptions
     set statut = 'acceptee', membre_id = v_membre, traitee_par = auth.uid(), traitee_le = now(), photo_url = null
   where id = p_inscription;
  return v_membre;
end $$;

revoke all on function public.inscription_formulaire(text) from public;
revoke all on function public.inscription_deposer(text, text, text, text, text, text, text, uuid, uuid, text, text) from public;
revoke all on function public.inscription_accepter(uuid) from public;
grant execute on function public.inscription_formulaire(text) to anon, authenticated;
grant execute on function public.inscription_deposer(text, text, text, text, text, text, text, uuid, uuid, text, text) to anon, authenticated;
grant execute on function public.inscription_accepter(uuid) to authenticated;
