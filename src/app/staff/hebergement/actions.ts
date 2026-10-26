"use server";

import { revalidatePath } from "next/cache";
import { utilisateurCourant } from "@/lib/auth/session";
import { estAdmin } from "@/lib/auth/roles";
import { MAQUETTE, messageErreur, type Etat } from "@/lib/etat-action";
import { formatPeriode } from "@/lib/organisation/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaAffectation, schemaChambre } from "@/lib/validation/organisation";

const REFUS = "L'hébergement est géré par l'administration (super administrateur et présidence).";

async function client() {
  if (!supabaseActif) return null;
  const moi = await utilisateurCourant();
  if (!moi || !estAdmin(moi.role)) return null;
  return creerClientServeur();
}

export async function creerChambre(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const d = schemaChambre.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const { error } = await supabase.from("chambres").insert(d.data);
  if (error) return { erreur: error.code === "23505" ? "Une chambre porte déjà ce nom à cet endroit." : messageErreur(error, REFUS) };
  revalidatePath("/staff/hebergement");
  return { succes: `Chambre « ${d.data.nom} » ajoutée (${d.data.capacite} place${d.data.capacite > 1 ? "s" : ""}).` };
}

export async function basculerChambre(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const active = form.get("active") === "oui";
  const { data, error } = await supabase.from("chambres").update({ active }).eq("id", String(form.get("id"))).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  revalidatePath("/staff/hebergement");
  return { succes: active ? "Chambre de nouveau disponible." : "Chambre retirée des choix." };
}

export async function affecter(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const d = schemaAffectation.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const { error } = await supabase.from("affectations_chambre")
    .insert({ chambre_id: d.data.chambreId, membre_id: d.data.membreId, du: d.data.du, au: d.data.au, notes: d.data.notes });
  if (error) return { erreur: error.code === "23514" ? "Un séjour dure au plus 90 jours." : messageErreur(error, REFUS) };
  revalidatePath("/staff/hebergement");
  return { succes: `Chambre attribuée ${formatPeriode(d.data.du, d.data.au)}. Le choriste est prévenu dans l'application.` };
}

export async function annulerAffectation(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const { data, error } = await supabase.from("affectations_chambre").delete().eq("id", String(form.get("id"))).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  revalidatePath("/staff/hebergement");
  return { succes: "Hébergement annulé. Le choriste est prévenu." };
}
