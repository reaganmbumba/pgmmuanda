-- Cotisations des membres (Cadre général art. 44 et Règlement intérieur art. 2-3 :
-- chaque membre « doit s'acquitter régulièrement de ses contributions »).
-- Un paiement = un membre, un mois. Les personnes qui suivent les finances les
-- enregistrent ; chaque membre voit les siennes. Le total de chaque mois entre
-- automatiquement dans la caisse (une seule ligne « Cotisations — mois » par monnaie).

create table public.cotisations (
  id uuid primary key default gen_random_uuid(),
  membre_id uuid not null references public.membres(id) on delete cascade,
  mois date not null check (extract(day from mois) = 1),
  montant numeric(14, 2) not null check (montant > 0),
  devise public.devise not null default 'CDF',
  paye_le date not null default current_date,
  saisi_par uuid default auth.uid() references public.profils(id) on delete set null,
  saisi_par_nom text not null default '',
  cree_le timestamptz not null default now(),
  unique (membre_id, mois)
);
create index on public.cotisations (mois);

create or replace function public.controler_cotisation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.mois > (date_trunc('month', current_date) + interval '12 months')::date then
    raise exception 'On ne peut pas payer plus de 12 mois à l''avance.';
  end if;
  if new.paye_le > current_date + 1 then
    raise exception 'La date de paiement ne peut pas être dans le futur.';
  end if;
  new.saisi_par := auth.uid();
  new.saisi_par_nom := coalesce((select nom_affiche from public.profils where id = auth.uid()), '');
  new.cree_le := now();
  return new;
end $$;
create trigger cotisations_controle before insert on public.cotisations
  for each row execute function public.controler_cotisation();

-- Lien avec la caisse : une opération par mois et par monnaie, recalculée à chaque paiement.
alter table public.operations_financieres add column cotisations_mois date;
create unique index operations_cotisations_mois on public.operations_financieres (cotisations_mois, devise)
  where cotisations_mois is not null;

create or replace function public.reporter_cotisations()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_ligne public.cotisations := case when tg_op = 'DELETE' then old else new end;
  v_total numeric(14, 2);
  v_mois text[] := array['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                         'août', 'septembre', 'octobre', 'novembre', 'décembre'];
begin
  select coalesce(sum(montant), 0) into v_total from public.cotisations
   where mois = v_ligne.mois and devise = v_ligne.devise;
  if v_total = 0 then
    delete from public.operations_financieres where cotisations_mois = v_ligne.mois and devise = v_ligne.devise;
  elsif exists (select 1 from public.operations_financieres where cotisations_mois = v_ligne.mois and devise = v_ligne.devise) then
    update public.operations_financieres set montant = v_total
     where cotisations_mois = v_ligne.mois and devise = v_ligne.devise;
  else
    insert into public.operations_financieres (sens, libelle, categorie, montant, devise, date_operation, cotisations_mois)
    values ('recette',
            'Cotisations — ' || v_mois[extract(month from v_ligne.mois)::int] || ' ' || extract(year from v_ligne.mois),
            'Cotisations', v_total, v_ligne.devise, least(v_ligne.mois, current_date), v_ligne.mois);
  end if;
  return null;
end $$;
create trigger cotisations_caisse after insert or delete on public.cotisations
  for each row execute function public.reporter_cotisations();
create trigger journal_cotisations after insert or update or delete on public.cotisations
  for each row execute function public.journaliser();

alter table public.cotisations enable row level security;
-- Les membres visibles (la base limite déjà le responsable de paroisse à sa paroisse),
-- et chaque membre pour ses propres cotisations.
create policy "lecture" on public.cotisations for select to authenticated using (
  (public.peut_suivre_finances() and exists (select 1 from public.membres m where m.id = membre_id))
  or exists (select 1 from public.membres m where m.id = membre_id and m.profil_id = auth.uid())
);
create policy "saisie" on public.cotisations for insert to authenticated with check (
  public.peut_suivre_finances() and exists (select 1 from public.membres m where m.id = membre_id)
);
-- Pas de modification : une erreur se corrige en supprimant puis en réenregistrant.
create policy "suppression admin" on public.cotisations for delete to authenticated using (public.est_admin());

-- ---------------------------------------------------------------------
-- Rappel du règlement à un membre qui n'a pas encore payé : notification
-- dans l'application (s'il a un compte). Un rappel au plus tous les 3 jours.
-- ---------------------------------------------------------------------
create table public.cotisations_rappels (
  membre_id uuid not null references public.membres(id) on delete cascade,
  mois date not null,
  rappele_le timestamptz not null default now(),
  rappele_par_nom text not null default '',
  primary key (membre_id, mois)
);
alter table public.cotisations_rappels enable row level security;
create policy "lecture" on public.cotisations_rappels for select to authenticated using (
  public.peut_suivre_finances() and exists (select 1 from public.membres m where m.id = membre_id)
);
-- Écriture seulement par la fonction ci-dessous.
revoke insert, update, delete on public.cotisations_rappels from authenticated;

create or replace function public.rappeler_cotisation(p_membre uuid, p_mois date)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_membre public.membres;
  v_mois text[] := array['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                         'août', 'septembre', 'octobre', 'novembre', 'décembre'];
begin
  if not public.peut_suivre_finances() then
    raise exception 'Action réservée aux personnes choisies pour les finances.';
  end if;
  select * into v_membre from public.membres where id = p_membre;
  if v_membre.id is null or not (public.est_admin() or public.peut_gerer_paroisse(v_membre.paroisse_id)
                                  or public.mon_role() = 'responsable_commission') then
    raise exception 'Ce membre est hors de votre paroisse.';
  end if;
  if exists (select 1 from public.cotisations where membre_id = p_membre and mois = p_mois) then
    raise exception 'Ce membre a déjà payé ce mois-là.';
  end if;
  if exists (select 1 from public.cotisations_rappels where membre_id = p_membre and mois = p_mois
               and rappele_le > now() - interval '3 days') then
    raise exception 'Un rappel a déjà été envoyé il y a moins de 3 jours.';
  end if;
  insert into public.cotisations_rappels (membre_id, mois, rappele_par_nom)
  values (p_membre, p_mois, coalesce((select nom_affiche from public.profils where id = auth.uid()), ''))
  on conflict (membre_id, mois) do update set rappele_le = now(), rappele_par_nom = excluded.rappele_par_nom;
  perform public.notifier_membre(p_membre,
    'Rappel : votre cotisation de ' || v_mois[extract(month from p_mois)::int] || ' ' || extract(year from p_mois)
      || ' n''est pas encore payée (Règlement intérieur, art. 2, 3 et 27).',
    '/choriste/cotisations');
  return case when v_membre.profil_id is null then 'sans_compte' else 'notifie' end;
end $$;
grant execute on function public.rappeler_cotisation(uuid, date) to authenticated;
