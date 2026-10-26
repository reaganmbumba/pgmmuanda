"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { utilisateurCourant } from "@/lib/auth/session";
import { estAdmin, peutGererMembres } from "@/lib/auth/roles";
import { CHAMPS_APPLICABLES } from "@/lib/membres/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaMembre, versLigne } from "@/lib/validation/membres";

export type Etat = { erreur?: string; succes?: string } | undefined;

const MAQUETTE: Etat = { erreur: "Mode maquette : l'enregistrement est désactivé tant que Supabase n'est pas configuré." };

function messageErreur(e: PostgrestError | null): string {
  if (!e) return "Vous n'avez pas le droit de modifier ce membre.";
  if (e.code === "P0001") return e.message; // message des contrôles de la base, déjà en français
  if (e.code === "42501") return "Vous n'avez pas le droit d'agir sur les membres de cette paroisse.";
  if (e.code === "23514") return "Une des informations saisies est invalide.";
  if (e.code === "23505") return "Ce compte est déjà relié à un autre membre.";
  return "L'enregistrement a échoué. Réessayez.";
}

async function autoriser() {
  if (!supabaseActif) return { erreur: MAQUETTE };
  const moi = await utilisateurCourant();
  if (!moi || !peutGererMembres(moi.role)) return { erreur: { erreur: "Action réservée à l'administration et aux responsables de paroisse." } };
  return { moi };
}

export async function enregistrerMembre(_: Etat, form: FormData): Promise<Etat> {
  const acces = await autoriser();
  if (acces.erreur) return acces.erreur;

  const d = schemaMembre.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };

  const supabase = await creerClientServeur();
  const ligne = versLigne(d.data);
  const { data, error } = d.data.id
    ? await supabase.from("membres").update(ligne).eq("id", d.data.id).select("id")
    : await supabase.from("membres").insert(ligne).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error) };

  revalidatePath("/staff/membres");
  redirect(`/staff/membres/${data[0].id}?enregistre=1`);
}

async function modifier(id: string, champs: Record<string, unknown>): Promise<Etat> {
  const acces = await autoriser();
  if (acces.erreur) return acces.erreur;
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("membres").update(champs).eq("id", id).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error) };
  revalidatePath("/staff/membres");
  revalidatePath(`/staff/membres/${id}`);
  return { succes: "Modification enregistrée." };
}

export async function changerStatut(_: Etat, form: FormData): Promise<Etat> {
  const statut = String(form.get("statut"));
  if (!["en_attente", "actif", "inactif", "suspendu"].includes(statut)) return { erreur: "Statut invalide." };
  return modifier(String(form.get("id")), { statut });
}

export async function archiverMembre(_: Etat, form: FormData): Promise<Etat> {
  const archive = form.get("archive") === "oui";
  const etat = await modifier(String(form.get("id")), { archive });
  return etat?.erreur ? etat : { succes: archive ? "Membre archivé." : "Membre restauré." };
}

/** Relie (ou détache) le compte de connexion d'un choriste à sa fiche. Réservé à l'administration. */
export async function relierCompte(_: Etat, form: FormData): Promise<Etat> {
  const moi = supabaseActif ? await utilisateurCourant() : null;
  if (!supabaseActif) return MAQUETTE;
  if (!moi || !estAdmin(moi.role)) return { erreur: "Action réservée à l'administration." };
  const profil = String(form.get("profilId") ?? "") || null;
  return modifier(String(form.get("id")), { profil_id: profil });
}

/** Accepte ou refuse une demande de correction ; une correction acceptée est appliquée à la fiche quand c'est possible. */
export async function traiterDemande(_: Etat, form: FormData): Promise<Etat> {
  const acces = await autoriser();
  if (acces.erreur) return acces.erreur;
  const decision = form.get("decision") === "acceptee" ? "acceptee" : "refusee";
  const supabase = await creerClientServeur();

  const { data: demande } = await supabase
    .from("demandes_correction").select("id, membre_id, champ, valeur_proposee, statut")
    .eq("id", String(form.get("id"))).maybeSingle();
  if (!demande) return { erreur: "Demande introuvable." };
  if (demande.statut !== "en_attente") return { erreur: "Cette demande a déjà été traitée." };

  let note = "";
  if (decision === "acceptee") {
    if ((CHAMPS_APPLICABLES as readonly string[]).includes(demande.champ)) {
      const { data, error } = await supabase
        .from("membres").update({ [demande.champ]: demande.valeur_proposee }).eq("id", demande.membre_id).select("id");
      if (error || !data?.length) return { erreur: messageErreur(error) };
      note = " La fiche a été mise à jour.";
    } else {
      note = " Pensez à modifier la fiche vous-même.";
    }
  }

  const { data, error } = await supabase
    .from("demandes_correction")
    .update({ statut: decision, traitee_par: acces.moi!.id, traitee_le: new Date().toISOString() })
    .eq("id", demande.id).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error) };

  revalidatePath(`/staff/membres/${demande.membre_id}`);
  revalidatePath("/staff/membres");
  return { succes: (decision === "acceptee" ? "Demande acceptée." : "Demande refusée.") + note };
}
