-- =====================================================================
-- PGM MUANDA DIGITAL — Étape 2 : règles de sécurité (Row Level Security)
-- Chaque règle est appliquée par la base, quel que soit le client.
-- =====================================================================

alter table public.paroisses enable row level security;
alter table public.chorales enable row level security;
alter table public.commissions enable row level security;
alter table public.profils enable row level security;
alter table public.membres enable row level security;
alter table public.membre_historique enable row level security;
alter table public.demandes_correction enable row level security;
alter table public.cartes enable row level security;
alter table public.verifications enable row level security;
alter table public.notifications enable row level security;
alter table public.journal_operations enable row level security;

-- Le public (non connecté) n'a accès à aucune table : seulement aux fonctions prévues.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;

-- ---------------------------------------------------------------------
-- Organisation : lisible par tout utilisateur connecté, modifiable par l'administration
-- ---------------------------------------------------------------------
create policy "lecture connectée" on public.paroisses for select to authenticated using (true);
create policy "gestion admin" on public.paroisses for all to authenticated
  using (public.est_admin()) with check (public.est_admin());

create policy "lecture connectée" on public.chorales for select to authenticated using (true);
create policy "gestion admin ou paroisse" on public.chorales for all to authenticated
  using (public.peut_gerer_paroisse(paroisse_id)) with check (public.peut_gerer_paroisse(paroisse_id));

create policy "lecture connectée" on public.commissions for select to authenticated using (true);
create policy "gestion admin" on public.commissions for all to authenticated
  using (public.est_admin()) with check (public.est_admin());

-- ---------------------------------------------------------------------
-- Profils : chacun voit le sien ; l'administration voit et modifie tout.
-- Aucun utilisateur ne peut changer son propre rôle.
-- ---------------------------------------------------------------------
create policy "mon profil" on public.profils for select to authenticated using (id = auth.uid());
create policy "admin lit tout" on public.profils for select to authenticated using (public.est_admin());
create policy "super admin modifie" on public.profils for update to authenticated
  using (public.mon_role() = 'super_admin') with check (public.mon_role() = 'super_admin');
create policy "presidence modifie hors super admin" on public.profils for update to authenticated
  using (public.mon_role() = 'presidence' and role <> 'super_admin')
  with check (public.mon_role() = 'presidence' and role <> 'super_admin');

-- ---------------------------------------------------------------------
-- Membres
-- ---------------------------------------------------------------------
create policy "lecture selon périmètre" on public.membres for select to authenticated using (
  public.peut_gerer_paroisse(paroisse_id)
  or public.mon_role() = 'responsable_commission'
  or profil_id = auth.uid()
);
create policy "création selon périmètre" on public.membres for insert to authenticated
  with check (public.peut_gerer_paroisse(paroisse_id));
create policy "modification selon périmètre" on public.membres for update to authenticated
  using (public.peut_gerer_paroisse(paroisse_id)) with check (public.peut_gerer_paroisse(paroisse_id));
-- Pas de suppression : on archive. Seul le super administrateur peut supprimer.
create policy "suppression super admin" on public.membres for delete to authenticated
  using (public.mon_role() = 'super_admin');

create policy "historique selon périmètre" on public.membre_historique for select to authenticated using (
  exists (select 1 from public.membres m where m.id = membre_id)  -- hérite de la règle de lecture des membres
);

-- ---------------------------------------------------------------------
-- Demandes de correction
-- ---------------------------------------------------------------------
create policy "le choriste demande pour lui" on public.demandes_correction for insert to authenticated with check (
  statut = 'en_attente' and traitee_par is null
  and exists (select 1 from public.membres m where m.id = membre_id and m.profil_id = auth.uid())
);
create policy "lecture" on public.demandes_correction for select to authenticated using (
  exists (select 1 from public.membres m where m.id = membre_id
          and (m.profil_id = auth.uid() or public.peut_gerer_paroisse(m.paroisse_id)))
);
create policy "traitement par le staff" on public.demandes_correction for update to authenticated using (
  exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_paroisse(m.paroisse_id))
) with check (
  exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_paroisse(m.paroisse_id))
);

-- ---------------------------------------------------------------------
-- Cartes
-- ---------------------------------------------------------------------
create policy "lecture" on public.cartes for select to authenticated using (
  exists (select 1 from public.membres m where m.id = membre_id
          and (m.profil_id = auth.uid() or public.peut_gerer_paroisse(m.paroisse_id)))
);
create policy "émission" on public.cartes for insert to authenticated with check (
  exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_paroisse(m.paroisse_id))
);
create policy "révocation" on public.cartes for update to authenticated using (
  exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_paroisse(m.paroisse_id))
) with check (
  exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_paroisse(m.paroisse_id))
);

-- Historique des vérifications : personnel habilité seulement. Écriture via la fonction verifier_carte.
create policy "lecture personnel habilité" on public.verifications for select to authenticated using (
  public.est_admin() or public.mon_role() in ('controleur', 'responsable_paroisse')
);

-- ---------------------------------------------------------------------
-- Notifications et journal
-- ---------------------------------------------------------------------
create policy "mes notifications" on public.notifications for select to authenticated using (profil_id = auth.uid());
create policy "marquer comme lue" on public.notifications for update to authenticated
  using (profil_id = auth.uid()) with check (profil_id = auth.uid());

create policy "lecture administration" on public.journal_operations for select to authenticated using (public.est_admin());

-- ---------------------------------------------------------------------
-- Vérification d'une carte : seule porte ouverte au public.
-- Renvoie uniquement photo, nom, matricule, paroisse et validité.
-- ---------------------------------------------------------------------
create or replace function public.verifier_carte(p_reference text)
returns table (
  resultat public.resultat_verification,
  prenom text, nom text, postnom text, matricule text, paroisse text, photo_url text
)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_carte public.cartes;
  v_membre public.membres;
  v_resultat public.resultat_verification;
begin
  if p_reference is null or length(p_reference) > 64 then
    p_reference := coalesce(left(p_reference, 64), '');
  end if;
  select * into v_carte from public.cartes c where c.reference_qr = p_reference;
  if not found then
    v_resultat := 'inconnue';
  else
    select * into v_membre from public.membres m where m.id = v_carte.membre_id;
    v_resultat := case
      when v_carte.statut = 'active' and v_membre.statut = 'actif' and not v_membre.archive then 'valide'
      else 'revoquee' end;
  end if;

  insert into public.verifications (carte_id, reference_saisie, resultat)
  values (v_carte.id, p_reference, v_resultat);

  if v_resultat = 'inconnue' then
    return query select v_resultat, null::text, null::text, null::text, null::text, null::text, null::text;
  else
    return query
      select v_resultat, v_membre.prenom, v_membre.nom, v_membre.postnom, v_membre.matricule, p.nom, v_membre.photo_url
        from public.paroisses p where p.id = v_membre.paroisse_id;
  end if;
end $$;

-- Recherche manuelle par matricule (scanner) : personnel connecté uniquement.
create or replace function public.verifier_matricule(p_matricule text)
returns table (
  resultat public.resultat_verification,
  prenom text, nom text, postnom text, matricule text, paroisse text, photo_url text
)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_reference text;
begin
  if not public.est_staff() then
    raise exception 'Accès réservé au personnel habilité.' using errcode = '42501';
  end if;
  select c.reference_qr into v_reference
    from public.cartes c join public.membres m on m.id = c.membre_id
   where m.matricule = upper(trim(p_matricule))
   order by (c.statut = 'active') desc, c.date_emission desc
   limit 1;
  return query select * from public.verifier_carte(coalesce(v_reference, upper(trim(p_matricule))));
end $$;

-- Connexion par identifiant : retrouve l'adresse e-mail du compte actif.
create or replace function public.email_pour_identifiant(p_identifiant text)
returns text language sql stable security definer set search_path = '' as $$
  select u.email
    from public.profils p join auth.users u on u.id = p.id
   where p.identifiant = lower(trim(p_identifiant)) and p.actif
   limit 1;
$$;

-- Droits d'exécution : tout est fermé par défaut, puis ouvert au cas par cas.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.verifier_carte(text) to anon, authenticated;
-- Uniquement côté serveur (clé service_role) : évite qu'un visiteur découvre les e-mails.
grant execute on function public.email_pour_identifiant(text) to service_role;
grant execute on function public.verifier_matricule(text) to authenticated;
grant execute on function
  public.mon_role(), public.ma_paroisse(), public.est_admin(), public.est_staff(),
  public.peut_gerer_paroisse(uuid), public.nouvelle_reference_qr()
  to authenticated;

-- Les fonctions créées plus tard ne seront pas exécutables par défaut.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
