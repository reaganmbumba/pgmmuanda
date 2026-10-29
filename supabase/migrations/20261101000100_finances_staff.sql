-- Finances suivies par les personnes choisies (demande de la PGM, 2026-10-29) :
-- l'administration coche « Accès aux finances » pour un responsable de paroisse ou de
-- commission. Ces personnes voient toutes les entrées et sorties d'argent, en
-- enregistrent et y joignent les reçus. Sans cette case, rien ne change : le responsable
-- de commission ne voit que l'argent des projets de sa commission.
-- Correction et suppression restent réservées à l'administration, et chaque
-- opération garde le nom de la personne qui l'a enregistrée.

alter table public.profils add column acces_finances boolean not null default false;

create or replace function public.peut_suivre_finances()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((
    select p.role in ('super_admin', 'presidence')
        or (p.acces_finances and p.role in ('responsable_paroisse', 'responsable_commission'))
      from public.profils p where p.id = auth.uid() and p.actif), false);
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
  using (public.peut_suivre_finances() or public.peut_gerer_commission(commission_id));

-- Un projet reste celui de sa commission : on n'y impute une dépense que si on gère le projet.
drop policy "saisie" on public.operations_financieres;
create policy "saisie" on public.operations_financieres for insert to authenticated with check (
  public.est_admin()
  or (projet_id is null and public.peut_suivre_finances())
  or (projet_id is not null and public.peut_gerer_projet(projet_id))
);

-- Reçus : les personnes qui suivent les finances, et la commission pour ses projets.
create or replace function public.peut_gerer_document(p_chant uuid, p_operation uuid, p_portee uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when p_chant is not null then public.est_admin() or public.mon_role() = 'responsable_commission'
    when p_operation is not null then exists (
      select 1 from public.operations_financieres o where o.id = p_operation
         and (public.peut_suivre_finances() or (o.projet_id is not null and public.peut_gerer_projet(o.projet_id))))
    else public.peut_gerer_annonce(p_portee) end;
$$;
