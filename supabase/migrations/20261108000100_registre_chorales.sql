-- Registre de présence de chaque chorale.
-- Jours habituels modifiables (par défaut : lundi et jeudi répétition, dimanche culte).
-- Chaque séance est une activité réservée à la chorale : les présences, « Mes présences »,
-- la discipline (absences) et le pointage par QR fonctionnent donc comme pour les autres activités.

alter table public.activites add column if not exists seance_chorale uuid references public.chorales(id) on delete cascade;
alter table public.activites add column if not exists seance_type text
  check (seance_type in ('repetition', 'culte', 'autre'));
alter table public.activites add column if not exists seance_jour date;
alter table public.activites add constraint seance_complete
  check ((seance_chorale is null) = (seance_type is null) and (seance_chorale is null) = (seance_jour is null));
create unique index if not exists activites_seance_unique
  on public.activites (seance_chorale, seance_jour, seance_type) where seance_chorale is not null and statut <> 'annulee';

-- Gérer une chorale : administration, responsable de sa paroisse, ou son responsable.
create or replace function public.peut_gerer_chorale(p_chorale uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.chorales c where c.id = p_chorale
                  and (public.peut_gerer_paroisse(c.paroisse_id) or c.id = public.ma_chorale()));
$$;

create table public.chorale_horaires (
  id uuid primary key default gen_random_uuid(),
  chorale_id uuid not null references public.chorales(id) on delete cascade,
  jour smallint not null check (jour between 1 and 7),   -- 1 = lundi … 7 = dimanche
  type text not null check (type in ('repetition', 'culte', 'autre')),
  heure time not null default '17:00',
  unique (chorale_id, jour, type)
);
alter table public.chorale_horaires enable row level security;
create policy "lecture connectée" on public.chorale_horaires for select to authenticated using (true);
create policy "gestion" on public.chorale_horaires for all to authenticated
  using (public.peut_gerer_chorale(chorale_id)) with check (public.peut_gerer_chorale(chorale_id));

create or replace function public.horaires_par_defaut()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.chorale_horaires (chorale_id, jour, type, heure) values
    (new.id, 1, 'repetition', '17:00'), (new.id, 4, 'repetition', '17:00'), (new.id, 7, 'culte', '08:00')
  on conflict do nothing;
  return null;
end $$;
create trigger chorales_horaires_defaut after insert on public.chorales
  for each row execute function public.horaires_par_defaut();
insert into public.chorale_horaires (chorale_id, jour, type, heure)
  select c.id, j.jour, j.type, j.heure::time from public.chorales c
   cross join (values (1, 'repetition', '17:00'), (4, 'repetition', '17:00'), (7, 'culte', '08:00')) as j(jour, type, heure)
  on conflict do nothing;

-- Ouvrir (ou retrouver) le registre d'une chorale pour un jour.
create or replace function public.ouvrir_seance(p_chorale uuid, p_jour date, p_type text, p_heure time default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_chorale public.chorales;
  v_id uuid;
  v_heure time;
begin
  if not public.peut_gerer_chorale(p_chorale) then
    raise exception 'Vous ne pouvez pas tenir le registre de cette chorale.';
  end if;
  if p_type not in ('repetition', 'culte', 'autre') then raise exception 'Type de séance invalide.'; end if;
  if p_jour > (now() at time zone 'Africa/Kinshasa')::date + 7 then
    raise exception 'Le registre s''ouvre au plus tôt une semaine avant.';
  end if;
  select id into v_id from public.activites
   where seance_chorale = p_chorale and seance_jour = p_jour and seance_type = p_type and statut <> 'annulee';
  if v_id is not null then return v_id; end if;
  select * into v_chorale from public.chorales where id = p_chorale;
  v_heure := coalesce(p_heure,
    (select heure from public.chorale_horaires
      where chorale_id = p_chorale and type = p_type and jour = extract(isodow from p_jour)), '17:00');
  insert into public.activites (titre, debut, portee_paroisse, pour_tous, cible_chorales, statut,
                                seance_chorale, seance_type, seance_jour)
  values (case p_type when 'repetition' then 'Répétition' when 'culte' then 'Culte' else 'Séance' end
            || ' — ' || v_chorale.nom,
          (p_jour + v_heure) at time zone 'Africa/Kinshasa', v_chorale.paroisse_id, false, array[p_chorale],
          'confirmee', p_chorale, p_type, p_jour)
  returning id into v_id;
  return v_id;
end $$;

-- Retirer un registre ouvert par erreur (ses présences partent avec lui).
create or replace function public.supprimer_seance(p_activite uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_chorale uuid;
begin
  select seance_chorale into v_chorale from public.activites where id = p_activite;
  if v_chorale is null or not public.peut_gerer_chorale(v_chorale) then
    raise exception 'Vous ne pouvez pas retirer ce registre.';
  end if;
  delete from public.activites where id = p_activite;
end $$;

grant execute on function public.peut_gerer_chorale(uuid), public.ouvrir_seance(uuid, date, text, time),
  public.supprimer_seance(uuid) to authenticated;

-- Pas de notification « Nouvelle activité » à chaque ouverture de registre.
create or replace function public.notifier_activite()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_quand text := to_char(new.debut at time zone 'Africa/Kinshasa', 'DD/MM/YYYY à HH24"h"MI');
  v_titre text;
begin
  if new.seance_chorale is not null then return null; end if;
  if tg_op = 'INSERT' then
    if new.statut <> 'annulee' then v_titre := 'Nouvelle activité : ' || new.titre || ' (' || v_quand || ')'; end if;
  elsif new.statut is distinct from old.statut and new.statut = 'annulee' then
    v_titre := 'Activité annulée : ' || new.titre;
  elsif new.statut is distinct from old.statut and new.statut = 'reportee' then
    v_titre := 'Activité reportée : ' || new.titre;
  elsif new.statut <> 'annulee' and (new.debut <> old.debut or new.lieu <> old.lieu) then
    v_titre := 'Activité modifiée : ' || new.titre || ' (' || v_quand || coalesce(', ' || nullif(new.lieu, ''), '') || ')';
  end if;
  if v_titre is not null then
    perform public.notifier_concernes(new.portee_paroisse, new.pour_tous, new.cible_paroisses, new.cible_chorales,
                                      new.cible_voix, v_titre, '/choriste/programme');
  end if;
  return null;
end $$;
