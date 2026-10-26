-- =====================================================================
-- PGM MUANDA DIGITAL — Étape 4 : cartes, QR codes et photos
-- À exécuter après 20261026000200_securite_rls.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Photo du membre : petite image JPEG ou PNG (≈ 30 Ko) stockée dans la fiche.
-- Elle est réduite dans le navigateur avant l'envoi.
-- ---------------------------------------------------------------------
alter table public.membres add constraint membres_photo_format check (
  photo_url is null
  or (photo_url ~ '^data:image/(jpeg|png);base64,[A-Za-z0-9+/]+=*$' and length(photo_url) <= 400000)
);

-- L'historique et le journal ne recopient pas les photos (elles alourdiraient la base).
create or replace function public.historiser_membre()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_type text;
  v_avant jsonb;
  v_apres jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.membre_historique (membre_id, type, apres)
    values (new.id, 'creation', to_jsonb(new) - 'photo_url');
    return new;
  end if;
  -- Ne garder que les champs réellement modifiés
  -- La photo elle-même n'est pas recopiée : seulement sa présence.
  select jsonb_object_agg(a.key, case when a.key = 'photo_url' then to_jsonb(a.value <> 'null'::jsonb) else a.value end),
         jsonb_object_agg(a.key, case when a.key = 'photo_url' then to_jsonb(n.value <> 'null'::jsonb) else n.value end)
    into v_avant, v_apres
    from jsonb_each(to_jsonb(old)) a
    join jsonb_each(to_jsonb(new)) n using (key)
   where a.value is distinct from n.value and a.key <> 'modifie_le';
  if v_avant is null then
    return new;
  end if;
  v_type := case
    when new.archive is distinct from old.archive then 'archivage'
    when new.statut is distinct from old.statut then 'statut'
    when new.fonction is distinct from old.fonction then 'nomination'
    else 'modification' end;
  insert into public.membre_historique (membre_id, type, avant, apres)
  values (new.id, v_type, v_avant, v_apres);
  return new;
end $$;


create or replace function public.journaliser()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_ancien jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) - 'photo_url' end;
  v_nouveau jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) - 'photo_url' end;
begin
  insert into public.journal_operations (action, table_nom, enregistrement_id, details)
  values (lower(tg_op), tg_table_name, coalesce(v_nouveau, v_ancien) ->> 'id',
          case when tg_op = 'UPDATE' then jsonb_build_object('avant', v_ancien, 'apres', v_nouveau)
               else coalesce(v_nouveau, v_ancien) end);
  return null;
end $$;

-- ---------------------------------------------------------------------
-- Une carte ne change jamais de titulaire ni de référence,
-- et une carte révoquée ou remplacée ne redevient pas active.
-- ---------------------------------------------------------------------
create or replace function public.controler_carte()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.reference_qr <> old.reference_qr or new.membre_id <> old.membre_id then
    raise exception 'La référence et le titulaire d''une carte ne peuvent pas être modifiés.';
  end if;
  if old.statut <> 'active' and new.statut <> old.statut then
    raise exception 'Une carte révoquée ou remplacée ne peut pas être réactivée.';
  end if;
  if new.statut <> 'active' and old.statut = 'active' then
    new.revoquee_le := coalesce(new.revoquee_le, now());
  end if;
  return new;
end $$;
create trigger cartes_controle before update on public.cartes
  for each row execute function public.controler_carte();

-- ---------------------------------------------------------------------
-- Les opérations sur les cartes apparaissent dans l'historique du membre.
-- ---------------------------------------------------------------------
alter table public.membre_historique drop constraint membre_historique_type_check;
alter table public.membre_historique add constraint membre_historique_type_check
  check (type in ('creation', 'modification', 'nomination', 'statut', 'archivage', 'carte'));

create or replace function public.historiser_carte()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.membre_historique (membre_id, type, apres)
    values (new.membre_id, 'carte', jsonb_build_object('carte', case when new.remplace_carte_id is null then 'émise' else 'rééditée' end));
  elsif new.statut is distinct from old.statut then
    insert into public.membre_historique (membre_id, type, avant, apres)
    values (new.membre_id, 'carte', jsonb_build_object('carte', 'active'),
            jsonb_build_object('carte', case new.statut when 'remplacee' then 'remplacée' else 'révoquée' end,
                               'motif', new.motif_revocation));
  end if;
  return null;
end $$;
create trigger cartes_historique after insert or update on public.cartes
  for each row execute function public.historiser_carte();

-- ---------------------------------------------------------------------
-- Opérations sur les cartes. Elles s'exécutent avec les droits de
-- l'utilisateur (security invoker) : les règles d'accès s'appliquent.
-- ---------------------------------------------------------------------
create or replace function public.emettre_carte(p_membre uuid)
returns public.cartes language plpgsql security invoker set search_path = '' as $$
declare
  v_membre public.membres;
  v_carte public.cartes;
begin
  select * into v_membre from public.membres where id = p_membre;
  if not found then
    raise exception 'Membre introuvable.' using errcode = 'P0002';
  end if;
  if v_membre.archive or v_membre.statut <> 'actif' then
    raise exception 'Seul un membre actif peut recevoir une carte.';
  end if;
  if exists (select 1 from public.cartes where membre_id = p_membre and statut = 'active') then
    raise exception 'Ce membre a déjà une carte active.';
  end if;
  insert into public.cartes (membre_id) values (p_membre) returning * into v_carte;
  return v_carte;
end $$;

create or replace function public.reediter_carte(p_membre uuid, p_motif text)
returns public.cartes language plpgsql security invoker set search_path = '' as $$
declare
  v_ancienne public.cartes;
  v_carte public.cartes;
begin
  select * into v_ancienne from public.cartes where membre_id = p_membre and statut = 'active';
  if not found then
    raise exception 'Ce membre n''a pas de carte active à rééditer.';
  end if;
  update public.cartes set statut = 'remplacee', motif_revocation = left(coalesce(p_motif, 'Réédition'), 200)
   where id = v_ancienne.id;
  if not found then
    raise exception 'Réédition refusée.' using errcode = '42501';
  end if;
  insert into public.cartes (membre_id, remplace_carte_id) values (p_membre, v_ancienne.id) returning * into v_carte;
  return v_carte;
end $$;

create or replace function public.revoquer_carte(p_carte uuid, p_motif text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.cartes set statut = 'revoquee', motif_revocation = left(coalesce(p_motif, 'Révoquée'), 200)
   where id = p_carte and statut = 'active';
  if not found then
    raise exception 'Carte introuvable ou déjà révoquée.';
  end if;
end $$;

grant execute on function public.emettre_carte(uuid), public.reediter_carte(uuid, text),
  public.revoquer_carte(uuid, text) to authenticated;
