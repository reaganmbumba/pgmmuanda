"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { utilisateurCourant } from "@/lib/auth/session";
import { estStaff, peutGererProgramme } from "@/lib/auth/roles";
import { extraireReference } from "@/lib/cartes/lien";
import { STATUTS_ACTIVITE, STATUTS_PRESENCE } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { colonnesCiblage, lireCiblage, schemaActivite, versLigneActivite } from "@/lib/validation/programmes";

export type Etat = { erreur?: string; succes?: string } | undefined;

const MAQUETTE: Etat = { erreur: "Mode maquette : l'enregistrement est désactivé tant que Supabase n'est pas configuré." };

function messageErreur(e: PostgrestError | null): string {
  if (!e) return "Vous n'avez pas le droit de modifier cette activité.";
  if (e.code === "P0001") return e.message;
  if (e.code === "42501") return "Vous n'avez pas le droit d'agir sur cette activité (paroisse ou commission différente).";
  if (e.code === "23514") return "Une des informations saisies est invalide.";
  return "L'enregistrement a échoué. Réessayez.";
}

async function autoriser(): Promise<Etat | null> {
  if (!supabaseActif) return MAQUETTE;
  const moi = await utilisateurCourant();
  if (!moi || !peutGererProgramme(moi.role)) return { erreur: "Action réservée à l'administration et aux responsables." };
  return null;
}

function rafraichir(id?: string) {
  revalidatePath("/staff/programmes");
  revalidatePath("/staff");
  if (id) revalidatePath(`/staff/programmes/${id}`);
}

export async function enregistrerActivite(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const d = schemaActivite.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const ciblage = lireCiblage(form);
  if (typeof ciblage === "string") return { erreur: ciblage };

  const id = String(form.get("id") ?? "");
  const ligne = { ...versLigneActivite(d.data), ...colonnesCiblage(ciblage) };
  const supabase = await creerClientServeur();
  const { data, error } = id
    ? await supabase.from("activites").update(ligne).eq("id", id).select("id")
    : await supabase.from("activites").insert(ligne).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error) };
  rafraichir(data[0].id);
  redirect(`/staff/programmes/${data[0].id}?enregistre=1`);
}

export async function changerStatutActivite(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const statut = String(form.get("statut"));
  if (!(statut in STATUTS_ACTIVITE)) return { erreur: "Statut invalide." };
  const id = String(form.get("id"));
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("activites").update({ statut }).eq("id", id).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error) };
  rafraichir(id);
  return { succes: `Activité ${STATUTS_ACTIVITE[statut as keyof typeof STATUTS_ACTIVITE].toLowerCase()}.` };
}

/** Enregistre la feuille de présence : un statut par membre (« » = non saisi, efface la saisie). */
export async function enregistrerPresences(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const moi = await utilisateurCourant();
  if (!moi || !estStaff(moi.role) || moi.role === "controleur") return { erreur: "Action réservée au personnel habilité." };
  const activite = String(form.get("activite"));
  const saisies = [...form.entries()]
    .filter(([k]) => k.startsWith("p_"))
    .map(([k, v]) => ({ membre: k.slice(2), statut: String(v) }))
    // Seules les lignes modifiées sont envoyées : un pointage par QR n'est pas réécrit en saisie manuelle.
    .filter((s) => s.statut !== String(form.get(`o_${s.membre}`) ?? ""));
  if (saisies.some((s) => s.statut && !(s.statut in STATUTS_PRESENCE))) return { erreur: "Statut de présence invalide." };

  const supabase = await creerClientServeur();
  const aEnregistrer = saisies.filter((s) => s.statut)
    .map((s) => ({ activite_id: activite, membre_id: s.membre, statut: s.statut, methode: "manuel" }));
  const aEffacer = saisies.filter((s) => !s.statut).map((s) => s.membre);
  if (aEnregistrer.length) {
    const { error } = await supabase.from("presences").upsert(aEnregistrer, { onConflict: "activite_id,membre_id" });
    if (error) return { erreur: messageErreur(error) };
  }
  if (aEffacer.length) {
    const { error } = await supabase.from("presences").delete().eq("activite_id", activite).in("membre_id", aEffacer);
    if (error) return { erreur: messageErreur(error) };
  }
  rafraichir(activite);
  const n = saisies.length;
  return { succes: n ? `Feuille de présence enregistrée (${n} modification${n > 1 ? "s" : ""}).` : "Aucune modification à enregistrer." };
}

export type ResultatPointage = {
  resultat?: "enregistre" | "deja_present" | "inconnue" | "carte_invalide" | "activite_annulee" | "non_concerne" | "non_autorise";
  prenom?: string; nom?: string; matricule?: string; paroisse?: string; photo?: string | null;
  erreur?: string; date: number;
};

/** Pointage par QR code ou matricule : la base vérifie la carte, le ciblage et les droits. */
export async function pointer(activite: string, contenu: string, mode: "qr" | "matricule"): Promise<ResultatPointage> {
  const date = Date.now();
  if (!supabaseActif) return { erreur: "Mode maquette : le pointage est désactivé.", date };
  const moi = await utilisateurCourant();
  if (!moi || !estStaff(moi.role)) return { erreur: "Session expirée : reconnectez-vous.", date };
  let reference: string | null;
  if (mode === "matricule") {
    reference = contenu.trim().toUpperCase();
    if (!/^PGM-MUA-\d{4,}$/.test(reference)) return { erreur: "Matricule invalide. Format attendu : PGM-MUA-0001.", date };
  } else {
    reference = extraireReference(contenu);
    if (!reference) return { erreur: "Ce QR code n'est pas une carte de la PGM Muanda.", date };
  }
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("pointer_presence", { p_activite: activite, p_reference: reference });
  if (error || !data?.length) return { erreur: error?.code === "P0001" ? error.message : "Le pointage a échoué. Réessayez.", date };
  const r = data[0];
  revalidatePath(`/staff/programmes/${activite}`);
  return { resultat: r.resultat, prenom: r.prenom, nom: r.nom, matricule: r.matricule, paroisse: r.paroisse, photo: r.photo_url, date };
}
