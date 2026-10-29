-- Finances ouvertes à tout le staff (demande de la PGM, 2026-10-29) :
-- présidence, responsables de paroisse et de commission voient toutes les
-- entrées et sorties d'argent, en enregistrent et y joignent les reçus.
-- Le contrôleur (scanner seulement) et les choristes n'y ont pas accès.
-- Correction et suppression restent réservées à l'administration, et chaque
-- opération garde le nom de la personne qui l'a enregistrée.

create or replace function public.peut_suivre_finances()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.mon_role() not in ('choriste', 'controleur'), false);
$$;
grant execute on function public.peut_suivre_finances() to authenticated;

-- Qui a enregistré l'opération, lisible par tous ceux qui suivent les finances
alter table public.operations_financieres add column saisi_par_nom text not null default '';
update public.operations_financieres o
   set saisi_par_nom = coalesce((select p.nom_affiche from public.profils p where p.id = o.saisi_par), '');

create or replace function public.controler_operation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.projet_id is not null then
    new.commission_id := (select commission_id from public.projets where id = new.projet_id);
  end if;
  if new.date_operation > current_date + 1 then
    raise exception 'La date de l''opération ne peut pas être dans le futur.';
  end if;
  if tg_op = 'INSERT' then
    new.saisi_par := auth.uid();
    new.saisi_le := now();
    new.saisi_par_nom := coalesce((select nom_affiche from public.profils where id = auth.uid()), '');
  else
    new.saisi_par := old.saisi_par;
    new.saisi_le := old.saisi_le;
    new.saisi_par_nom := old.saisi_par_nom;
  end if;
  return new;
end $$;

drop policy "lecture" on public.operations_financieres;
create policy "lecture" on public.operations_financieres for select to authenticated
  using (public.peut_suivre_finances());

-- Un projet reste celui de sa commission : on n'y impute une dépense que si on gère le projet.
drop policy "saisie" on public.operations_financieres;
create policy "saisie" on public.operations_financieres for insert to authenticated with check (
  public.peut_suivre_finances()
  and (projet_id is null or public.est_admin() or public.peut_gerer_projet(projet_id))
);

-- Reçus : tout le staff qui suit les finances peut joindre la photo d'un reçu.
create or replace function public.peut_gerer_document(p_chant uuid, p_operation uuid, p_portee uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when p_chant is not null then public.est_admin() or public.mon_role() = 'responsable_commission'
    when p_operation is not null then public.peut_suivre_finances()
      and exists (select 1 from public.operations_financieres o where o.id = p_operation)
    else public.peut_gerer_annonce(p_portee) end;
$$;
