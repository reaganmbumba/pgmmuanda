"use server";

import { revalidatePath } from "next/cache";
import { utilisateurCourant } from "@/lib/auth/session";
import { estAdmin } from "@/lib/auth/roles";
import { MAQUETTE, messageErreur, type Etat } from "@/lib/etat-action";
import { TYPES_SANCTION } from "@/lib/discipline/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaSanction } from "@/lib/validation/organisation";

export async function enregistrerSanction(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const moi = await utilisateurCourant();
  if (!moi || !estAdmin(moi.role)) return { erreur: "Action réservée à l'administration." };
  const d = schemaSanction.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("sanctions").insert({
    membre_id: d.data.membreId, type: d.data.type, manquement: d.data.manquement, details: d.data.details,
    date_faits: d.data.dateFaits, fin_suspension: d.data.finSuspension, defense_entendue: true,
  });
  if (error?.code === "23514") return { erreur: "Vérifiez les dates : les faits doivent être avant la décision, et la fin de suspension après." };
  if (error) return { erreur: messageErreur(error) };
  revalidatePath(`/staff/membres/${d.data.membreId}`);
  revalidatePath("/staff/discipline");
  return { succes: `${TYPES_SANCTION[d.data.type]} enregistré${d.data.type === "suspension" || d.data.type === "exclusion" ? "e" : ""}.` };
}

export async function annulerSanction(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("sanctions").delete().eq("id", String(form.get("id"))).select("membre_id");
  if (error || !data?.length) return { erreur: messageErreur(error, "Seule l'administration peut annuler une sanction.") };
  revalidatePath(`/staff/membres/${data[0].membre_id}`);
  revalidatePath("/staff/discipline");
  return { succes: "Sanction annulée." };
}

/** Rappelle le règlement au membre souvent absent (notification dans l'application). */
export async function rappelerAbsences(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const membre = String(form.get("membreId") ?? "");
  const nombre = Number(form.get("nombre"));
  if (!/^[0-9a-f-]{36}$/.test(membre) || !Number.isInteger(nombre) || nombre < 1) return { erreur: "Demande invalide." };
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("rappeler_absences", { p_membre: membre, p_nombre: nombre });
  if (error) return { erreur: messageErreur(error) };
  revalidatePath("/staff/discipline");
  return { succes: data === "notifie" ? "Rappel envoyé dans l'application." : "Rappel noté. Ce membre n'a pas de compte : envoyez-le sur WhatsApp." };
}
