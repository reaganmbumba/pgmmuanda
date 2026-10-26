"use server";

import { revalidatePath } from "next/cache";
import { utilisateurCourant } from "@/lib/auth/session";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaDemandeCorrection } from "@/lib/validation/membres";

export type Etat = { erreur?: string; succes?: string } | undefined;

export async function demanderCorrection(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return { erreur: "Mode maquette : l'envoi est désactivé tant que Supabase n'est pas configuré." };
  const moi = await utilisateurCourant();
  if (!moi || moi.role !== "choriste") return { erreur: "Connectez-vous avec votre compte choriste." };

  const d = schemaDemandeCorrection.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };

  const supabase = await creerClientServeur();
  const { data: fiche } = await supabase.from("membres").select("id").eq("profil_id", moi.id).maybeSingle();
  if (!fiche) return { erreur: "Votre compte n'est pas encore relié à une fiche membre." };

  // La base n'accepte la demande que pour la fiche du choriste connecté.
  const { error } = await supabase.from("demandes_correction").insert({
    membre_id: fiche.id,
    champ: d.data.champ,
    valeur_proposee: d.data.valeur,
    motif: d.data.motif || null,
  });
  if (error) return { erreur: "La demande n'a pas pu être envoyée." };
  revalidatePath("/choriste/profil");
  return { succes: "Demande envoyée. Le staff la validera avant toute modification." };
}
