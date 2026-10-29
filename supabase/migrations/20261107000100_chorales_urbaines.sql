-- Chorales urbaines : une chorale peut n'appartenir à aucune paroisse
-- (ex. Oracle, qui chante dans toute l'antenne). Ses membres gardent leur propre paroisse.
-- Seule l'administration peut créer ou gérer une chorale urbaine
-- (peut_gerer_paroisse(null) n'est vrai que pour l'administration).

alter table public.chorales alter column paroisse_id drop not null;
create unique index if not exists chorales_urbaines_nom_unique
  on public.chorales (lower(nom)) where paroisse_id is null;

-- La chorale d'un membre est celle de sa paroisse, ou une chorale urbaine.
create or replace function public.controler_membre()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.matricule <> old.matricule then
    raise exception 'Le matricule ne peut pas être modifié.';
  end if;
  if new.chorale_id is not null and not exists (
    select 1 from public.chorales c
     where c.id = new.chorale_id and (c.paroisse_id is null or c.paroisse_id = new.paroisse_id)
  ) then
    raise exception 'La chorale n''appartient pas à la paroisse du membre.';
  end if;
  return new;
end $$;
