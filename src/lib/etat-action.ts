import type { PostgrestError } from "@supabase/supabase-js";

export type Etat = { erreur?: string; succes?: string } | undefined;

export const MAQUETTE: Etat = { erreur: "Mode maquette : l'enregistrement est désactivé tant que Supabase n'est pas configuré." };

/** Message compréhensible par tous à partir d'une erreur de la base. */
export function messageErreur(e: PostgrestError | null, refus = "Vous n'avez pas le droit de faire cette modification."): string {
  if (!e) return refus;
  if (e.code === "P0001") return e.message;
  if (e.code === "42501") return refus;
  if (e.code === "23505") return "Cet élément existe déjà.";
  if (e.code === "23503") return "Impossible : cet élément est encore utilisé ailleurs.";
  if (e.code === "23514") return "Une des informations saisies est invalide.";
  return "L'enregistrement a échoué. Réessayez.";
}
