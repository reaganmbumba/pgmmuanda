"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { utilisateurCourant } from "@/lib/auth/session";
import { peutGererCommission } from "@/lib/auth/roles";
import { MAQUETTE, messageErreur, type Etat } from "@/lib/etat-action";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaChant, voixChant } from "@/lib/validation/organisation";

const REFUS = "Le répertoire est géré par l'administration et les responsables de commission.";

async function client() {
  if (!supabaseActif) return null;
  const moi = await utilisateurCourant();
  if (!moi || !peutGererCommission(moi.role)) return null;
  return creerClientServeur();
}

export async function enregistrerChant(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const d = schemaChant.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const ligne = {
    titre: d.data.titre, auteur: d.data.auteur, langue: d.data.langue, categorie: d.data.categorie, paroles: d.data.paroles,
    lien_partition: d.data.lienPartition, lien_audio: d.data.lienAudio, voix: voixChant(form),
  };
  const id = String(form.get("id") ?? "");
  const { data, error } = id
    ? await supabase.from("chants").update(ligne).eq("id", id).select("id")
    : await supabase.from("chants").insert(ligne).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  revalidatePath("/staff/chants");
  revalidatePath("/choriste/chants");
  if (!id) redirect(`/staff/chants/${data[0].id}`);
  revalidatePath(`/staff/chants/${id}`);
  return { succes: "Chant enregistré." };
}

export async function archiverChant(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const archive = form.get("archive") === "oui";
  const id = String(form.get("id"));
  const { data, error } = await supabase.from("chants").update({ archive }).eq("id", id).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  revalidatePath("/staff/chants");
  revalidatePath("/choriste/chants");
  revalidatePath(`/staff/chants/${id}`);
  return { succes: archive ? "Chant retiré du répertoire des choristes." : "Chant remis dans le répertoire." };
}
