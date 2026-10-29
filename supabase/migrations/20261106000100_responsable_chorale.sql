-- Compte « Responsable de chorale » : il gère les membres, les présences et les cartes
-- de SA chorale seulement (comme un responsable de paroisse, limité à sa chorale).
-- La nouvelle valeur du rôle est comparée en texte, pour que ce fichier s'exécute en une fois.

alter type public.role_utilisateur add value if not exists 'responsable_chorale';

alter table public.profils add column if not exists chorale_id uuid references public.chorales(id) on delete restrict;
alter table public.profils add constraint perimetre_chorale
  check (role::text <> 'responsable_chorale' or chorale_id is not null);

-- La paroisse du responsable de chorale suit toujours celle de sa chorale.
create or replace function public.profil_paroisse_de_chorale()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role::text = 'responsable_chorale' then
    new.paroisse_id := (select c.paroisse_id from public.chorales c where c.id = new.chorale_id);
  else
    new.chorale_id := null;
  end if;
  return new;
end $$;
create trigger profils_chorale before insert or update of role, chorale_id on public.profils
  for each row execute function public.profil_paroisse_de_chorale();

create or replace function public.ma_chorale()
returns uuid language sql stable security definer set search_path = '' as $$
  select chorale_id from public.profils where id = auth.uid() and actif and role::text = 'responsable_chorale';
$$;

-- Gérer un membre : administration, responsable de sa paroisse, ou responsable de sa chorale.
create or replace function public.peut_gerer_membre_de(p_paroisse uuid, p_chorale uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.peut_gerer_paroisse(p_paroisse)
      or (p_chorale is not null and p_chorale = public.ma_chorale());
$$;
grant execute on function public.ma_chorale(), public.peut_gerer_membre_de(uuid, uuid) to authenticated;

-- Membres
drop policy "lecture selon périmètre" on public.membres;
create policy "lecture selon périmètre" on public.membres for select to authenticated using (
  public.peut_gerer_membre_de(paroisse_id, chorale_id) or public.mon_role() = 'responsable_commission' or profil_id = auth.uid()
);
drop policy "création selon périmètre" on public.membres;
create policy "création selon périmètre" on public.membres for insert to authenticated
  with check (public.peut_gerer_membre_de(paroisse_id, chorale_id));
drop policy "modification selon périmètre" on public.membres;
create policy "modification selon périmètre" on public.membres for update to authenticated
  using (public.peut_gerer_membre_de(paroisse_id, chorale_id)) with check (public.peut_gerer_membre_de(paroisse_id, chorale_id));

-- Cartes
drop policy "lecture" on public.cartes;
create policy "lecture" on public.cartes for select to authenticated using (
  exists (select 1 from public.membres m where m.id = membre_id
           and (m.profil_id = auth.uid() or public.peut_gerer_membre_de(m.paroisse_id, m.chorale_id)))
);
drop policy "émission" on public.cartes;
create policy "émission" on public.cartes for insert to authenticated with check (
  exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_membre_de(m.paroisse_id, m.chorale_id))
);
drop policy "révocation" on public.cartes;
create policy "révocation" on public.cartes for update to authenticated
  using (exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_membre_de(m.paroisse_id, m.chorale_id)))
  with check (exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_membre_de(m.paroisse_id, m.chorale_id)));

-- Demandes de correction
drop policy "lecture" on public.demandes_correction;
create policy "lecture" on public.demandes_correction for select to authenticated using (
  exists (select 1 from public.membres m where m.id = membre_id
           and (m.profil_id = auth.uid() or public.peut_gerer_membre_de(m.paroisse_id, m.chorale_id)))
);
drop policy "traitement par le staff" on public.demandes_correction;
create policy "traitement par le staff" on public.demandes_correction for update to authenticated
  using (exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_membre_de(m.paroisse_id, m.chorale_id)))
  with check (exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_membre_de(m.paroisse_id, m.chorale_id)));

-- Commissions, formations et rappels d'absences : lecture pour les membres qu'il gère
drop policy "lecture" on public.commission_membres;
create policy "lecture" on public.commission_membres for select to authenticated using (
  public.peut_gerer_commission(commission_id) or membre_id = public.mon_membre()
  or exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_membre_de(m.paroisse_id, m.chorale_id))
);
drop policy "lecture" on public.formation_inscriptions;
create policy "lecture" on public.formation_inscriptions for select to authenticated using (
  public.peut_gerer_formation(formation_id) or membre_id = public.mon_membre()
  or exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_membre_de(m.paroisse_id, m.chorale_id))
);
drop policy "lecture" on public.absences_rappels;
create policy "lecture" on public.absences_rappels for select to authenticated using (
  exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_membre_de(m.paroisse_id, m.chorale_id))
);

-- Historique des vérifications de cartes
drop policy "lecture personnel habilité" on public.verifications;
create policy "lecture personnel habilité" on public.verifications for select to authenticated using (
  public.est_admin() or public.mon_role()::text in ('controleur', 'responsable_paroisse', 'responsable_chorale')
);

-- Présences : le responsable de chorale pointe les membres de sa chorale
create or replace function public.peut_saisir_presence(p_activite uuid, p_membre uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.activites a where a.id = p_activite
                  and public.peut_gerer_activite(a.portee_paroisse, a.commission_id))
      or exists (select 1 from public.membres m where m.id = p_membre
                  and public.peut_gerer_membre_de(m.paroisse_id, m.chorale_id));
$$;

-- Rappel du règlement aux membres souvent absents
create or replace function public.rappeler_absences(p_membre uuid, p_nombre int)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_membre public.membres;
begin
  select * into v_membre from public.membres where id = p_membre;
  if v_membre.id is null or not public.peut_gerer_membre_de(v_membre.paroisse_id, v_membre.chorale_id) then
    raise exception 'Ce membre est hors de votre paroisse ou de votre chorale.';
  end if;
  if p_nombre < 1 then
    raise exception 'Aucune absence à rappeler.';
  end if;
  if exists (select 1 from public.absences_rappels where membre_id = p_membre and rappele_le > now() - interval '3 days') then
    raise exception 'Un rappel a déjà été envoyé il y a moins de 3 jours.';
  end if;
  insert into public.absences_rappels (membre_id, rappele_par_nom, nb_absences)
  values (p_membre, coalesce((select nom_affiche from public.profils where id = auth.uid()), ''), p_nombre)
  on conflict (membre_id) do update
    set rappele_le = now(), rappele_par_nom = excluded.rappele_par_nom, nb_absences = excluded.nb_absences;
  perform public.notifier_membre(p_membre,
    'Rappel : ' || p_nombre || ' absence' || case when p_nombre > 1 then 's' else '' end
      || ' sans motif. Toute absence non justifiée est un manquement (Règlement intérieur, art. 16, 17 et 27).',
    '/choriste/presences');
  return case when v_membre.profil_id is null then 'sans_compte' else 'notifie' end;
end $$;

-- Demandes de correction : le responsable de la chorale est prévenu aussi
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
          or (p.role = 'responsable_paroisse' and p.paroisse_id = v_membre.paroisse_id)
          or (p.role::text = 'responsable_chorale' and p.chorale_id = v_membre.chorale_id))
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
