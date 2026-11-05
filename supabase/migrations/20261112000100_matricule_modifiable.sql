-- Matricule modifiable à la main, par l'administration seulement
-- (super admin et présidence). Les autres comptes ne peuvent toujours pas le changer.
-- Le QR code de la carte ne contient pas le matricule : il reste valable,
-- et la carte affiche automatiquement le nouveau matricule.

-- 1. Le matricule : lettres majuscules, chiffres et tirets, de 3 à 20 caractères.
alter table public.membres drop constraint if exists membres_matricule_format;
alter table public.membres add constraint membres_matricule_format
  check (matricule ~ '^[A-Z0-9][A-Z0-9-]{2,19}$');

-- 2. Le contrôle des membres : seul l'administration change un matricule.
create or replace function public.controler_membre()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.matricule is distinct from old.matricule then
    if not public.est_admin() then
      raise exception 'Le matricule ne peut pas être modifié.';
    end if;
    new.matricule := upper(trim(new.matricule));
    if exists (select 1 from public.membres m where m.matricule = new.matricule and m.id <> new.id) then
      raise exception 'Le matricule % est déjà utilisé par un autre membre.', new.matricule;
    end if;
  end if;
  if new.chorale_id is not null and not exists (
    select 1 from public.chorales c
     where c.id = new.chorale_id and (c.paroisse_id is null or c.paroisse_id = new.paroisse_id)
  ) then
    raise exception 'La chorale n''appartient pas à la paroisse du membre.';
  end if;
  return new;
end $$;

-- 3. Nouveau matricule automatique : saute les numéros déjà pris à la main
--    (ex. si l'administration a donné PGM-MUA-0050, le 50e inscrit reçoit PGM-MUA-0051).
create or replace function public.prochain_matricule()
returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  v text;
begin
  loop
    v := 'PGM-MUA-' || lpad(nextval('public.matricule_seq')::text, 4, '0');
    exit when not exists (select 1 from public.membres where matricule = v);
  end loop;
  return v;
end $$;
revoke execute on function public.prochain_matricule() from public, anon;
grant execute on function public.prochain_matricule() to authenticated, service_role;

alter table public.membres alter column matricule set default public.prochain_matricule();
