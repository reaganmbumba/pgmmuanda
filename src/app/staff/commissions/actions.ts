"use server";

import { revalidatePath } from "next/cache";
import { utilisateurCourant } from "@/lib/auth/session";
import { estStaff } from "@/lib/auth/roles";
import { MAQUETTE, messageErreur, type Etat } from "@/lib/etat-action";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaCommission, schemaMembreCommission } from "@/lib/validation/organisation";

const REFUS = "Seuls l'administration et le responsable de cette commission peuvent la modifier.";

async function client() {
  if (!supabaseActif) return null;
  const moi = await utilisateurCourant();
  if (!moi || !estStaff(moi.role)) return null;
  return creerClientServeur();
}

function rafraichir(id?: string) {
  revalidatePath("/staff/commissions");
  if (id) revalidatePath(`/staff/commissions/${id}`);
}

export async function creerCommission(_: Etat, form: FormData): Promise<Etat> {
  const supabase = await client();
  if (!supabase) return MAQUETTE;
  const d = schemaCommission.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const { data, error } = await supabase.from("commissions").insert({ nom: d.data.nom, description: d.data.description || null }).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, "Seule l'administration peut créer une commission.") };
  rafraichir();
  return { succes: `Commission « ${d.data.nom} » créée.` };
}

export async function modifierCommission(_: Etat, form: FormData): Promise<Etat> {
  const supabase = await client();
  if (!supabase) return MAQUETTE;
  const id = String(form.get("id"));
  const d = schemaCommission.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const { data, error } = await supabase.from("commissions").update({ nom: d.data.nom, description: d.data.description || null }).eq("id", id).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  rafraichir(id);
  return { succes: "Commission enregistrée." };
}

export async function ajouterMembreCommission(_: Etat, form: FormData): Promise<Etat> {
  const supabase = await client();
  if (!supabase) return MAQUETTE;
  const d = schemaMembreCommission.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const { error } = await supabase.from("commission_membres")
    .insert({ commission_id: d.data.commissionId, membre_id: d.data.membreId, fonction: d.data.fonction });
  if (error) return { erreur: error.code === "23505" ? "Ce membre fait déjà partie de la commission." : messageErreur(error, REFUS) };
  rafraichir(d.data.commissionId);
  return { succes: "Membre ajouté. Il est prévenu dans l'application." };
}

export async function changerFonction(_: Etat, form: FormData): Promise<Etat> {
  const supabase = await client();
  if (!supabase) return MAQUETTE;
  const d = schemaMembreCommission.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const { data, error } = await supabase.from("commission_membres").update({ fonction: d.data.fonction })
    .eq("commission_id", d.data.commissionId).eq("membre_id", d.data.membreId).select("membre_id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  rafraichir(d.data.commissionId);
  return { succes: "Fonction modifiée." };
}

export async function retirerMembreCommission(_: Etat, form: FormData): Promise<Etat> {
  const supabase = await client();
  if (!supabase) return MAQUETTE;
  const commission = String(form.get("commissionId"));
  const { data, error } = await supabase.from("commission_membres").delete()
    .eq("commission_id", commission).eq("membre_id", String(form.get("membreId"))).select("membre_id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  rafraichir(commission);
  return { succes: "Membre retiré de la commission." };
}
