"use server";

import { revalidatePath } from "next/cache";
import { utilisateurCourant } from "@/lib/auth/session";
import { estStaff } from "@/lib/auth/roles";
import { lireFichier } from "@/lib/documents/fichiers";
import { MAQUETTE, messageErreur, type Etat } from "@/lib/etat-action";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { colonnesCiblage, lireCiblage } from "@/lib/validation/programmes";

const REFUS = "Vous n'avez pas le droit de déposer ce fichier ici.";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function rafraichir() {
  for (const p of ["/staff/documents", "/choriste/documents", "/staff/chants", "/choriste/chants", "/staff/finances", "/staff/projets"]) {
    revalidatePath(p, "layout");
  }
}

/** Dépôt d'un fichier : partition d'un chant, reçu d'une opération ou document pour choristes. */
export async function deposerDocument(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const moi = await utilisateurCourant();
  if (!moi || !estStaff(moi.role) || moi.role === "controleur") return { erreur: REFUS };
  const fichier = await lireFichier(form.get("fichier"));
  if (typeof fichier === "string") return { erreur: fichier };

  const chantId = String(form.get("chantId") ?? "");
  const operationId = String(form.get("operationId") ?? "");
  let rattachement: Record<string, unknown>;
  if (chantId) {
    if (!uuid.test(chantId)) return { erreur: "Chant invalide." };
    rattachement = { chant_id: chantId };
  } else if (operationId) {
    if (!uuid.test(operationId)) return { erreur: "Opération invalide." };
    rattachement = { operation_id: operationId };
  } else {
    const ciblage = lireCiblage(form);
    if (typeof ciblage === "string") return { erreur: ciblage };
    rattachement = colonnesCiblage(ciblage);
  }
  const titre = String(form.get("titre") ?? "").trim().slice(0, 150) || fichier.nom.replace(/\.[^.]+$/, "").replace(/-/g, " ");

  const supabase = await creerClientServeur();
  const { error } = await supabase.from("documents").insert({
    titre, nom_fichier: fichier.nom, type_mime: fichier.type, taille: fichier.taille, contenu: fichier.base64, ...rattachement,
  });
  if (error) return { erreur: messageErreur(error, REFUS) };
  rafraichir();
  return { succes: `« ${titre} » est déposé.${chantId || operationId ? "" : " Les membres concernés sont prévenus dans l'application."}` };
}

export async function supprimerDocument(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("documents").delete().eq("id", String(form.get("id"))).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, "Vous n'avez pas le droit de supprimer ce fichier.") };
  rafraichir();
  return { succes: "Fichier supprimé." };
}
