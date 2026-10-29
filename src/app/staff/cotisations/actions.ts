"use server";

import { revalidatePath } from "next/cache";
import { utilisateurCourant } from "@/lib/auth/session";
import { peutSuivreFinances } from "@/lib/auth/roles";
import { MAQUETTE, messageErreur, type Etat } from "@/lib/etat-action";
import { formatMontant } from "@/lib/organisation/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaCotisation } from "@/lib/validation/organisation";

export async function enregistrerCotisation(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const moi = await utilisateurCourant();
  if (!moi || !peutSuivreFinances(moi.role, moi.accesFinances)) return { erreur: "Action réservée aux personnes choisies pour les finances." };
  const d = schemaCotisation.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("cotisations").insert({
    membre_id: d.data.membreId, mois: d.data.mois, montant: d.data.montant, devise: d.data.devise,
  });
  if (error?.code === "23505") return { erreur: "Ce membre a déjà payé ce mois-là." };
  if (error) return { erreur: messageErreur(error, "Ce membre est hors de votre paroisse.") };
  revalidatePath("/staff/cotisations");
  revalidatePath("/staff/finances");
  return { succes: `Payé : ${formatMontant(d.data.montant, d.data.devise)}.` };
}

export async function annulerCotisation(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("cotisations").delete().eq("id", String(form.get("id"))).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, "Seule l'administration peut annuler un paiement.") };
  revalidatePath("/staff/cotisations");
  revalidatePath("/staff/finances");
  return { succes: "Paiement annulé." };
}

/** Rappelle le règlement au membre (notification dans l'application s'il a un compte). */
export async function rappelerCotisation(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const membre = String(form.get("membreId") ?? "");
  const mois = String(form.get("mois") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(membre) || !/^\d{4}-\d{2}-01$/.test(mois)) return { erreur: "Demande invalide." };
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("rappeler_cotisation", { p_membre: membre, p_mois: mois });
  if (error) return { erreur: messageErreur(error) };
  revalidatePath("/staff/cotisations");
  return { succes: data === "notifie" ? "Rappel envoyé dans l'application." : "Rappel noté. Ce membre n'a pas de compte : envoyez-le sur WhatsApp." };
}
