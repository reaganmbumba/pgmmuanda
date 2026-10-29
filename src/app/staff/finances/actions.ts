"use server";

import { revalidatePath } from "next/cache";
import { utilisateurCourant } from "@/lib/auth/session";
import { peutSuivreFinances } from "@/lib/auth/roles";
import { MAQUETTE, messageErreur, type Etat } from "@/lib/etat-action";
import { formatMontant } from "@/lib/organisation/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaOperation } from "@/lib/validation/organisation";

export async function enregistrerOperation(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const moi = await utilisateurCourant();
  if (!moi || !peutSuivreFinances(moi.role)) return { erreur: "Action réservée au staff de la PGM." };
  const d = schemaOperation.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("operations_financieres").insert({
    sens: d.data.sens, libelle: d.data.libelle, categorie: d.data.categorie, montant: d.data.montant,
    devise: d.data.devise, date_operation: d.data.dateOperation, projet_id: d.data.projetId, piece: d.data.piece,
  });
  if (error) return { erreur: messageErreur(error, "Seule la commission du projet peut y imputer une dépense.") };
  revalidatePath("/staff/finances");
  if (d.data.projetId) revalidatePath(`/staff/projets/${d.data.projetId}`);
  return { succes: `${d.data.sens === "recette" ? "Entrée" : "Sortie"} de ${formatMontant(d.data.montant, d.data.devise)} enregistrée.` };
}

export async function supprimerOperation(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("operations_financieres").delete().eq("id", String(form.get("id"))).select("id, projet_id");
  if (error || !data?.length) return { erreur: messageErreur(error, "Seule l'administration peut supprimer une opération.") };
  revalidatePath("/staff/finances");
  if (data[0].projet_id) revalidatePath(`/staff/projets/${data[0].projet_id}`);
  return { succes: "Opération supprimée." };
}
