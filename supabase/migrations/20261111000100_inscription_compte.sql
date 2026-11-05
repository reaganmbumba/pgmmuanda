-- =====================================================================
-- PGM MUANDA DIGITAL — Inscription par lien : compte créé tout de suite
-- À la fin de l'inscription, la personne reçoit son compte (rôle choriste),
-- avec un mot de passe proposé ou choisi par elle. Sa fiche de membre
-- (matricule, carte) n'existe qu'après la validation du staff, qui relie
-- alors le compte à la fiche. Refuser l'inscription désactive le compte.
-- À exécuter après 20261110000100_inscriptions.sql
-- =====================================================================

alter table public.inscriptions add column if not exists profil_id uuid references public.profils(id) on delete set null;

create or replace function public.inscription_accepter(p_inscription uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_i public.inscriptions;
  v_membre uuid;
  v_profil uuid;
begin
  select * into v_i from public.inscriptions where id = p_inscription for update;
  if v_i.id is null or not public.peut_gerer_membre_de(v_i.paroisse_id, v_i.chorale_id) then
    raise exception 'Vous n''avez pas le droit de valider cette inscription.';
  end if;
  if v_i.statut <> 'en_attente' then raise exception 'Cette inscription a déjà été traitée.'; end if;
  -- Le compte créé à l'inscription, s'il est encore libre (pas déjà relié à une autre fiche)
  select p.id into v_profil from public.profils p
   where p.id = v_i.profil_id and p.role::text = 'choriste'
     and not exists (select 1 from public.membres m where m.profil_id = p.id);
  insert into public.membres (nom, postnom, prenom, sexe, telephone, email, paroisse_id, chorale_id, voix, photo_url, statut, profil_id)
  values (v_i.nom, v_i.postnom, v_i.prenom, v_i.sexe, v_i.telephone, v_i.email, v_i.paroisse_id, v_i.chorale_id,
          v_i.voix, v_i.photo_url, 'actif', v_profil)
  returning id into v_membre;
  update public.profils set actif = true, paroisse_id = v_i.paroisse_id where id = v_profil;
  update public.inscriptions
     set statut = 'acceptee', membre_id = v_membre, traitee_par = auth.uid(), traitee_le = now(), photo_url = null
   where id = p_inscription;
  if v_profil is not null then
    perform public.notifier(v_profil, 'Votre inscription est validée : bienvenue à la PGM !', '/choriste');
  end if;
  return v_membre;
end $$;

/* Refuser : l'inscription est close et le compte créé avec elle est désactivé. */
create or replace function public.inscription_refuser(p_inscription uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_i public.inscriptions;
begin
  select * into v_i from public.inscriptions where id = p_inscription for update;
  if v_i.id is null or not public.peut_gerer_membre_de(v_i.paroisse_id, v_i.chorale_id) then
    raise exception 'Vous n''avez pas le droit de traiter cette inscription.';
  end if;
  if v_i.statut <> 'en_attente' then raise exception 'Cette inscription a déjà été traitée.'; end if;
  update public.inscriptions
     set statut = 'refusee', traitee_par = auth.uid(), traitee_le = now(), photo_url = null
   where id = p_inscription;
  update public.profils p set actif = false
   where p.id = v_i.profil_id and p.role::text = 'choriste'
     and not exists (select 1 from public.membres m where m.profil_id = p.id);
end $$;

revoke all on function public.inscription_accepter(uuid) from public;
revoke all on function public.inscription_refuser(uuid) from public;
grant execute on function public.inscription_accepter(uuid) to authenticated;
grant execute on function public.inscription_refuser(uuid) to authenticated;
