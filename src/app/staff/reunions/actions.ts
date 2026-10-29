"use server";

import { revalidatePath } from "next/cache";
import { utilisateurCourant } from "@/lib/auth/session";
import { estAdmin } from "@/lib/auth/roles";
import { estAssemblee, TYPES_REUNION } from "@/lib/conseil/libelles";
import { MAQUETTE, messageErreur, type Etat } from "@/lib/etat-action";
import { STATUTS_PRESENCE } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaCompteRendu, schemaReunion } from "@/lib/validation/organisation";

/** Convocation : la base prévient le Conseil (et tout le staff pour une Assemblée). */
export async function convoquerReunion(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const moi = await utilisateurCourant();
  if (!moi || !estAdmin(moi.role)) return { erreur: "Action réservée à l'administration." };
  const d = schemaReunion.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("reunions").insert({
    type: d.data.type, titre: d.data.titre, debut: d.data.debut, lieu: d.data.lieu, ordre_du_jour: d.data.ordreDuJour,
  });
  if (error) return { erreur: messageErreur(error) };
  revalidatePath("/staff/reunions");
  return {
    succes: `${TYPES_REUNION[d.data.type]} convoquée. ${estAssemblee(d.data.type)
      ? "Le Conseil et tout le staff sont prévenus dans l'application."
      : "Les membres du Conseil qui ont un compte sont prévenus dans l'application."} Partagez aussi la convocation sur WhatsApp.`,
  };
}

/** Compte rendu et statut (art. 23). */
export async function enregistrerCompteRendu(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const d = schemaCompteRendu.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const supabase = await creerClientServeur();
  const { data: r } = await supabase.from("reunions").select("debut").eq("id", d.data.id).maybeSingle();
  if (!r) return { erreur: "Réunion introuvable." };
  if (d.data.statut === "tenue" && new Date(r.debut) > new Date()) return { erreur: "La réunion n'a pas encore eu lieu." };
  const { data, error } = await supabase.from("reunions")
    .update({ statut: d.data.statut, compte_rendu: d.data.compteRendu }).eq("id", d.data.id).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, "Seule l'administration tient le compte rendu.") };
  revalidatePath(`/staff/reunions/${d.data.id}`);
  revalidatePath("/staff/reunions");
  return { succes: "Enregistré." };
}

/** Feuille de présence du Conseil : un choix par membre (champs « p_<membre> »). */
export async function enregistrerPresencesReunion(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const id = String(form.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return { erreur: "Demande invalide." };
  const lignes = [...form.entries()]
    .filter(([k, v]) => k.startsWith("p_") && /^[0-9a-f-]{36}$/.test(k.slice(2)) && String(v) in STATUTS_PRESENCE)
    .map(([k, v]) => ({ reunion_id: id, membre_id: k.slice(2), statut: String(v), saisi_le: new Date().toISOString() }));
  if (lignes.length === 0) return { erreur: "Choisissez au moins une présence." };
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("reunion_presences").upsert(lignes, { onConflict: "reunion_id,membre_id" });
  if (error) return { erreur: messageErreur(error, "Seule l'administration tient la feuille de présence.") };
  revalidatePath(`/staff/reunions/${id}`);
  revalidatePath("/staff/conseil");
  return { succes: `Feuille de présence enregistrée (${lignes.length}).` };
}
