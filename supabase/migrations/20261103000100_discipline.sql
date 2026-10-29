-- Discipline (Règlement intérieur, art. 16 à 27) :
-- 1. les sanctions — avertissement, blâme, suspension, exclusion — notées sur la fiche du
--    membre par l'administration, seulement après que le membre a été invité à présenter
--    sa défense (art. 25) ; elles ne sont visibles que par l'administration ;
-- 2. le rappel du règlement aux membres souvent absents sans motif (art. 16, 17 et 27).

create type public.type_sanction as enum ('avertissement', 'blame', 'suspension', 'exclusion');

create table public.sanctions (
  id uuid primary key default gen_random_uuid(),
  membre_id uuid not null references public.membres(id) on delete cascade,
  type public.type_sanction not null,
  manquement text not null check (length(trim(manquement)) between 2 and 200),
  details text not null default '' check (length(details) <= 2000),
  date_faits date not null,
  decide_le date not null default current_date,
  -- Art. 25 : aucune sanction sans que le membre ait été invité à présenter sa défense.
  defense_entendue boolean not null check (defense_entendue),
  fin_suspension date,
  decide_par uuid default auth.uid() references public.profils(id) on delete set null,
  decide_par_nom text not null default '',
  cree_le timestamptz not null default now(),
  constraint fin_si_suspension check (type = 'suspension' or fin_suspension is null),
  constraint fin_apres_decision check (fin_suspension is null or fin_suspension >= decide_le),
  constraint faits_avant_decision check (date_faits <= decide_le)
);
create index on public.sanctions (membre_id);

create or replace function public.controler_sanction()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.decide_le > current_date + 1 then
    raise exception 'La date de la décision ne peut pas être dans le futur.';
  end if;
  new.decide_par := auth.uid();
  new.decide_par_nom := coalesce((select nom_affiche from public.profils where id = auth.uid()), '');
  new.cree_le := now();
  return new;
end $$;
create trigger sanctions_controle before insert on public.sanctions
  for each row execute function public.controler_sanction();
create trigger journal_sanctions after insert or update or delete on public.sanctions
  for each row execute function public.journaliser();

alter table public.sanctions enable row level security;
create policy "administration" on public.sanctions for select to authenticated using (public.est_admin());
create policy "décision" on public.sanctions for insert to authenticated with check (public.est_admin());
-- Pas de modification ; une erreur de saisie se corrige en supprimant puis en réenregistrant.
create policy "suppression" on public.sanctions for delete to authenticated using (public.est_admin());

-- ---------------------------------------------------------------------
-- Rappel du règlement pour les absences non justifiées
-- ---------------------------------------------------------------------
create table public.absences_rappels (
  membre_id uuid primary key references public.membres(id) on delete cascade,
  rappele_le timestamptz not null default now(),
  rappele_par_nom text not null default '',
  nb_absences int not null
);
alter table public.absences_rappels enable row level security;
create policy "lecture" on public.absences_rappels for select to authenticated using (
  exists (select 1 from public.membres m where m.id = membre_id and public.peut_gerer_paroisse(m.paroisse_id))
);
revoke insert, update, delete on public.absences_rappels from authenticated;

create or replace function public.rappeler_absences(p_membre uuid, p_nombre int)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_membre public.membres;
begin
  select * into v_membre from public.membres where id = p_membre;
  if v_membre.id is null or not public.peut_gerer_paroisse(v_membre.paroisse_id) then
    raise exception 'Ce membre est hors de votre paroisse.';
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
grant execute on function public.rappeler_absences(uuid, int) to authenticated;
