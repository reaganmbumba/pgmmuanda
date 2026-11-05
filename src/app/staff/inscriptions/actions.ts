"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { utilisateurCourant } from "@/lib/auth/session";
import { estAdmin, peutGererMembres } from "@/lib/auth/roles";
import { MAQUETTE, messageErreur, type Etat } from "@/lib/etat-action";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";

async function autoriser(admin = false): Promise<Etat | null> {
  if (!supabaseActif) return MAQUETTE;
  const moi = await utilisateurCourant();
  if (!moi) return { erreur: "Reconnectez-vous." };
  if (admin ? !estAdmin(moi.role) : !peutGererMembres(moi.role))
    return { erreur: admin ? "Action réservée à l'administration." : "Action réservée à l'administration et aux responsables." };
  return null;
}

/** Accepter : la fiche membre est créée (active, avec la photo), puis on l'ouvre. */
export async function accepterInscription(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("inscription_accepter", { p_inscription: String(form.get("id")) });
  if (error || !data) return { erreur: messageErreur(error, "Vous n'avez pas le droit de valider cette inscription.") };
  revalidatePath("/staff/inscriptions");
  revalidatePath("/staff/membres");
  redirect(`/staff/membres/${data}?enregistre=1`);
}

/** Refuser : l'inscription est close et le compte créé avec elle est désactivé. */
export async function refuserInscription(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc("inscription_refuser", { p_inscription: String(form.get("id")) });
  if (error) return { erreur: messageErreur(error, "Vous n'avez pas le droit de traiter cette inscription.") };
  revalidatePath("/staff/inscriptions");
  return { succes: "Inscription refusée." };
}

/** Nouveau lien : l'ancien ne marche plus (si le lien a circulé trop loin). */
export async function changerLien(): Promise<Etat> {
  const refus = await autoriser(true);
  if (refus) return refus;
  const code = Array.from(crypto.getRandomValues(new Uint8Array(20)), (o) => "abcdefghijkmnpqrstuvwxyz23456789"[o % 32]).join("");
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("inscription_lien").update({ code, modifie_le: new Date().toISOString() })
    .eq("id", true).select("code");
  if (error || !data?.length) return { erreur: messageErreur(error) };
  revalidatePath("/staff/inscriptions");
  return { succes: "Nouveau lien créé. L'ancien lien ne marche plus." };
}

export async function ouvrirLien(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser(true);
  if (refus) return refus;
  const ouvert = form.get("ouvert") === "oui";
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("inscription_lien").update({ ouvert }).eq("id", true).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error) };
  revalidatePath("/staff/inscriptions");
  return { succes: ouvert ? "Le lien est ouvert : les inscriptions sont possibles." : "Le lien est fermé : personne ne peut plus s'inscrire." };
}
