-- =====================================================================
-- PGM MUANDA DIGITAL — Étape 5 : notifications automatiques
-- À exécuter après 20261027000100_cartes.sql
-- Les notifications sont créées par la base elle-même : un utilisateur
-- ne peut pas en écrire pour quelqu'un d'autre.
-- =====================================================================

create or replace function public.notifier(p_profil uuid, p_titre text, p_lien text)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (profil_id, titre, lien)
  select p_profil, left(p_titre, 200), p_lien
   where p_profil is not null
     and exists (select 1 from public.profils where id = p_profil and actif);
$$;
revoke execute on function public.notifier(uuid, text, text) from public, anon, authenticated;

-- Nouvelle demande de correction → administration et responsable de la paroisse
create or replace function public.notifier_demande()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_membre public.membres;
  v_profil uuid;
begin
  select * into v_membre from public.membres where id = new.membre_id;
  if tg_op = 'INSERT' then
    for v_profil in
      select p.id from public.profils p
       where p.actif and (p.role in ('super_admin', 'presidence')
          or (p.role = 'responsable_paroisse' and p.paroisse_id = v_membre.paroisse_id))
    loop
      perform public.notifier(v_profil,
        'Demande de correction de ' || v_membre.prenom || ' ' || v_membre.nom || ' (' || v_membre.matricule || ')',
        '/staff/membres/' || v_membre.id || '#demandes');
    end loop;
  elsif new.statut is distinct from old.statut and new.statut in ('acceptee', 'refusee') then
    perform public.notifier(v_membre.profil_id,
      'Votre demande de correction a été ' || case new.statut when 'acceptee' then 'acceptée' else 'refusée' end,
      '/choriste/profil');
  end if;
  return null;
end $$;
create trigger demandes_notification after insert or update on public.demandes_correction
  for each row execute function public.notifier_demande();

-- Carte émise, rééditée ou révoquée → le choriste concerné
create or replace function public.notifier_carte()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_profil uuid;
begin
  select profil_id into v_profil from public.membres where id = new.membre_id;
  if tg_op = 'INSERT' then
    perform public.notifier(v_profil, 'Votre carte de choriste est disponible', '/choriste/carte');
  elsif new.statut = 'revoquee' and old.statut = 'active' then
    perform public.notifier(v_profil, 'Votre carte de choriste a été révoquée', '/choriste/carte');
  end if;
  return null;
end $$;
create trigger cartes_notification after insert or update on public.cartes
  for each row execute function public.notifier_carte();

-- Changement de statut du membre → le choriste concerné
create or replace function public.notifier_statut()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.statut is distinct from old.statut then
    perform public.notifier(new.profil_id,
      'Votre statut de membre est maintenant : ' || case new.statut
        when 'actif' then 'actif' when 'inactif' then 'inactif'
        when 'suspendu' then 'suspendu' else 'en attente' end,
      '/choriste/profil');
  end if;
  return null;
end $$;
create trigger membres_notification after update on public.membres
  for each row execute function public.notifier_statut();

-- Le destinataire peut seulement marquer comme lue (pas changer le texte ni le lien)
create or replace function public.controler_notification()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.titre <> old.titre or new.lien is distinct from old.lien or new.profil_id <> old.profil_id then
    raise exception 'Seul l''état « lue » d''une notification peut changer.';
  end if;
  return new;
end $$;
create trigger notifications_controle before update on public.notifications
  for each row execute function public.controler_notification();

create policy "supprimer les miennes" on public.notifications for delete to authenticated
  using (profil_id = auth.uid());
