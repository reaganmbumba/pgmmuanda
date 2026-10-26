-- =====================================================================
-- PGM MUANDA DIGITAL — Étape 8 : fichiers (partitions, reçus, documents)
-- À exécuter après 20261031000100_securite.sql
--
-- Les fichiers (PDF, photos, MP3 de 4 Mo au plus) sont rangés dans la base
-- elle-même : les règles d'accès s'appliquent aussi aux fichiers, et une
-- sauvegarde de la base contient tout. Trois sortes de fichiers :
--  * partition d'un chant  : lisible par tous les connectés ;
--  * reçu d'une opération  : même accès que l'opération (finances) ;
--  * document pour choristes : ciblé comme une annonce.
-- =====================================================================

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  titre text not null check (length(trim(titre)) between 1 and 150),
  nom_fichier text not null check (nom_fichier ~ '^[^/\\<>:"|?*]{1,120}$'),
  type_mime text not null check (type_mime in ('application/pdf', 'image/jpeg', 'image/png', 'audio/mpeg')),
  taille int not null check (taille between 1 and 4194304),
  contenu text not null,  -- base64
  chant_id uuid references public.chants(id) on delete cascade,
  operation_id uuid references public.operations_financieres(id) on delete cascade,
  -- Ciblage (documents pour choristes seulement)
  portee_paroisse uuid references public.paroisses(id) on delete restrict,
  pour_tous boolean not null default true,
  cible_paroisses uuid[] not null default '{}',
  cible_chorales uuid[] not null default '{}',
  cible_voix public.voix[] not null default '{}',
  cree_par uuid default auth.uid() references public.profils(id) on delete set null,
  cree_le timestamptz not null default now(),
  constraint un_seul_rattachement check (num_nonnulls(chant_id, operation_id) <= 1),
  constraint contenu_base64 check (contenu ~ '^[A-Za-z0-9+/]+=*$' and length(contenu) <= 5592408),
  constraint ciblage_non_vide check (
    pour_tous or cardinality(cible_paroisses) + cardinality(cible_chorales) + cardinality(cible_voix) > 0)
);
create index on public.documents (chant_id);
create index on public.documents (operation_id);
create index on public.documents (cree_le desc);

create trigger documents_ciblage before insert or update on public.documents
  for each row execute function public.controler_ciblage();

create or replace function public.controler_document()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (new.contenu <> old.contenu or new.chant_id is distinct from old.chant_id
     or new.operation_id is distinct from old.operation_id) then
    raise exception 'Un fichier ne se modifie pas : supprimez-le et déposez-en un nouveau.';
  end if;
  if tg_op = 'INSERT' then
    new.cree_par := auth.uid();
    new.cree_le := now();
  end if;
  return new;
end $$;
create trigger documents_controle before insert or update on public.documents
  for each row execute function public.controler_document();

-- Qui peut gérer ce fichier ?
create or replace function public.peut_gerer_document(p_chant uuid, p_operation uuid, p_portee uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when p_chant is not null then public.est_admin() or public.mon_role() = 'responsable_commission'
    when p_operation is not null then exists (
      select 1 from public.operations_financieres o where o.id = p_operation
         and (public.est_admin() or (o.projet_id is not null and public.peut_gerer_projet(o.projet_id))))
    else public.peut_gerer_annonce(p_portee) end;
$$;

alter table public.documents enable row level security;
create policy "lecture" on public.documents for select to authenticated using (
  case
    when chant_id is not null then exists (select 1 from public.chants c where c.id = chant_id)  -- règle des chants
    when operation_id is not null then exists (select 1 from public.operations_financieres o where o.id = operation_id)
    else public.est_staff() or public.me_concerne(portee_paroisse, pour_tous, cible_paroisses, cible_chorales, cible_voix)
  end
);
create policy "dépôt" on public.documents for insert to authenticated
  with check (public.peut_gerer_document(chant_id, operation_id, portee_paroisse));
create policy "modification" on public.documents for update to authenticated
  using (public.peut_gerer_document(chant_id, operation_id, portee_paroisse))
  with check (public.peut_gerer_document(chant_id, operation_id, portee_paroisse));
-- Un reçu ne se supprime que par l'administration (traçabilité des finances).
create policy "suppression" on public.documents for delete to authenticated using (
  case when operation_id is not null then public.est_admin()
       else public.peut_gerer_document(chant_id, operation_id, portee_paroisse) end
);

-- Nouveau document pour choristes → les membres concernés sont prévenus
create or replace function public.notifier_document()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.chant_id is null and new.operation_id is null then
    perform public.notifier_concernes(new.portee_paroisse, new.pour_tous, new.cible_paroisses, new.cible_chorales,
      new.cible_voix, 'Nouveau document : ' || new.titre, '/choriste/documents');
  end if;
  return null;
end $$;
create trigger documents_notification after insert on public.documents
  for each row execute function public.notifier_document();

-- Journal : sans le contenu du fichier
create or replace function public.journaliser_document()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_ligne jsonb := (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) - 'contenu';
begin
  insert into public.journal_operations (action, table_nom, enregistrement_id, details)
  values (lower(tg_op), tg_table_name, v_ligne ->> 'id', v_ligne);
  return null;
end $$;
create trigger journal_documents after insert or update or delete on public.documents
  for each row execute function public.journaliser_document();

grant execute on function public.peut_gerer_document(uuid, uuid, uuid) to authenticated;
