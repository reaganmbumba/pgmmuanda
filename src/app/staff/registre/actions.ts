"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { utilisateurCourant } from "@/lib/auth/session";
import { peutGererMembres } from "@/lib/auth/roles";
import { MAQUETTE, messageErreur, type Etat } from "@/lib/etat-action";
import { estTypeSeance } from "@/lib/registre/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HEURE = /^\d{2}:\d{2}$/;

async function autoriser(): Promise<Etat | null> {
  if (!supabaseActif) return MAQUETTE;
  const moi = await utilisateurCourant();
  if (!moi || !peutGererMembres(moi.role)) return { erreur: "Action réservée aux responsables." };
  return null;
}

/** Ouvre (ou retrouve) le registre du jour, puis affiche la liste des membres à cocher. */
export async function ouvrirRegistre(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const chorale = String(form.get("chorale") ?? "");
  const jour = String(form.get("jour") ?? "");
  const type = form.get("type");
  if (!DATE.test(jour)) return { erreur: "Choisissez la date." };
  if (!estTypeSeance(type)) return { erreur: "Choisissez le type de séance." };
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("ouvrir_seance", { p_chorale: chorale, p_jour: jour, p_type: type });
  if (error || !data) return { erreur: messageErreur(error) };
  revalidatePath("/staff/registre");
  redirect(`/staff/registre/${data}`);
}

/** Ajoute un jour habituel, ou change son heure s'il existe déjà. */
export async function enregistrerHoraire(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const jour = Number(form.get("jour"));
  const type = form.get("type");
  const heure = String(form.get("heure") ?? "");
  if (!(jour >= 1 && jour <= 7)) return { erreur: "Choisissez le jour." };
  if (!estTypeSeance(type)) return { erreur: "Choisissez le type de séance." };
  if (!HEURE.test(heure)) return { erreur: "Indiquez l'heure." };
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("chorale_horaires")
    .upsert({ chorale_id: String(form.get("chorale")), jour, type, heure }, { onConflict: "chorale_id,jour,type" }).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error) };
  revalidatePath("/staff/registre");
  return { succes: "Jour habituel enregistré." };
}

export async function retirerHoraire(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("chorale_horaires").delete().eq("id", String(form.get("id"))).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error) };
  revalidatePath("/staff/registre");
  return { succes: "Jour retiré." };
}

/** Retire un registre ouvert par erreur, avec ses présences. */
export async function supprimerRegistre(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc("supprimer_seance", { p_activite: String(form.get("id")) });
  if (error) return { erreur: messageErreur(error) };
  revalidatePath("/staff/registre");
  redirect(`/staff/registre?chorale=${encodeURIComponent(String(form.get("chorale") ?? ""))}`);
}
