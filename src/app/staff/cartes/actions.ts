"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { utilisateurCourant } from "@/lib/auth/session";
import { MOTIFS_CARTE as MOTIFS } from "@/lib/cartes/motifs";
import { peutGererMembres } from "@/lib/auth/roles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";

export type Etat = { erreur?: string; succes?: string } | undefined;


function messageErreur(e: PostgrestError | null): string {
  if (e?.code === "P0001") return e.message; // contrôles de la base, en français
  if (e?.code === "23505") return "Ce membre a déjà une carte active.";
  if (e?.code === "42501") return "Vous n'avez pas le droit de gérer les cartes de cette paroisse.";
  return "L'opération a échoué. Réessayez.";
}

async function autoriser(): Promise<Etat | null> {
  if (!supabaseActif) return { erreur: "Mode maquette : les cartes ne peuvent pas être émises sans Supabase." };
  const moi = await utilisateurCourant();
  if (!moi || !peutGererMembres(moi.role)) return { erreur: "Action réservée à l'administration et aux responsables de paroisse." };
  return null;
}

function rafraichir(membreId?: string) {
  revalidatePath("/staff/cartes");
  if (membreId) revalidatePath(`/staff/membres/${membreId}`);
}

export async function emettreCarte(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const membreId = String(form.get("membreId"));
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc("emettre_carte", { p_membre: membreId });
  if (error) return { erreur: messageErreur(error) };
  rafraichir(membreId);
  return { succes: "Carte émise." };
}

/** Émet en une fois les cartes des membres actifs qui n'en ont pas. */
export async function emettreCartesManquantes(): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const supabase = await creerClientServeur();
  const { data: membres, error } = await supabase
    .from("membres").select("id, cartes(statut)").eq("statut", "actif").eq("archive", false);
  if (error) return { erreur: "Lecture des membres impossible." };
  const sans = (membres ?? []).filter((m) => !(m.cartes as { statut: string }[]).some((c) => c.statut === "active"));
  let emises = 0;
  for (const m of sans) {
    const { error: e } = await supabase.rpc("emettre_carte", { p_membre: m.id });
    if (!e) emises++;
  }
  rafraichir();
  if (sans.length === 0) return { succes: "Tous les membres actifs ont déjà une carte." };
  return emises === sans.length
    ? { succes: `${emises} carte${emises > 1 ? "s" : ""} émise${emises > 1 ? "s" : ""}.` }
    : { erreur: `${emises} carte(s) émise(s) sur ${sans.length}. Réessayez pour les autres.` };
}

export async function reediterCarte(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const membreId = String(form.get("membreId"));
  const motif = MOTIFS.includes(String(form.get("motif"))) ? String(form.get("motif")) : "Autre";
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc("reediter_carte", { p_membre: membreId, p_motif: motif });
  if (error) return { erreur: messageErreur(error) };
  rafraichir(membreId);
  return { succes: "Nouvelle carte émise : l'ancienne n'est plus valable." };
}

export async function revoquerCarte(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const motif = MOTIFS.includes(String(form.get("motif"))) ? String(form.get("motif")) : "Autre";
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc("revoquer_carte", { p_carte: String(form.get("carteId")), p_motif: motif });
  if (error) return { erreur: messageErreur(error) };
  rafraichir(String(form.get("membreId") ?? "") || undefined);
  return { succes: "Carte révoquée." };
}

/** Photo déjà réduite dans le navigateur (JPEG, quelques dizaines de Ko). */
export async function enregistrerPhoto(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const membreId = String(form.get("membreId"));
  const photo = String(form.get("photo") ?? "");
  if (photo && (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(photo) || photo.length > 400000)) {
    return { erreur: "Image invalide ou trop lourde." };
  }
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("membres").update({ photo_url: photo || null }).eq("id", membreId).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error) };
  rafraichir(membreId);
  return { succes: photo ? "Photo enregistrée." : "Photo retirée." };
}
