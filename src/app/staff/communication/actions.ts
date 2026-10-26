"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { utilisateurCourant } from "@/lib/auth/session";
import { peutPublier } from "@/lib/auth/roles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { colonnesCiblage, lireCiblage, schemaAnnonce } from "@/lib/validation/programmes";

export type Etat = { erreur?: string; succes?: string } | undefined;

function messageErreur(e: PostgrestError | null): string {
  if (!e) return "Vous n'avez pas le droit de modifier cette annonce.";
  if (e.code === "P0001") return e.message;
  if (e.code === "42501") return "Vous ne pouvez publier que pour votre paroisse.";
  if (e.code === "23514") return "Une des informations saisies est invalide.";
  return "La publication a échoué. Réessayez.";
}

async function autoriser(): Promise<Etat | null> {
  if (!supabaseActif) return { erreur: "Mode maquette : la publication est désactivée tant que Supabase n'est pas configuré." };
  const moi = await utilisateurCourant();
  if (!moi || !peutPublier(moi.role)) return { erreur: "Action réservée à l'administration et aux responsables de paroisse." };
  return null;
}

export async function publierAnnonce(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const d = schemaAnnonce.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const ciblage = lireCiblage(form);
  if (typeof ciblage === "string") return { erreur: ciblage };
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("annonces").insert({ ...d.data, ...colonnesCiblage(ciblage) });
  if (error) return { erreur: messageErreur(error) };
  revalidatePath("/staff/communication");
  revalidatePath("/staff");
  redirect("/staff/communication?publiee=1");
}

export async function archiverAnnonce(_: Etat, form: FormData): Promise<Etat> {
  const refus = await autoriser();
  if (refus) return refus;
  const archivee = form.get("archivee") === "oui";
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("annonces").update({ archivee }).eq("id", String(form.get("id"))).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error) };
  revalidatePath("/staff/communication");
  revalidatePath("/staff");
  return { succes: archivee ? "Annonce archivée." : "Annonce restaurée." };
}
