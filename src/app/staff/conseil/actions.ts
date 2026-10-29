"use server";

import { revalidatePath } from "next/cache";
import { utilisateurCourant } from "@/lib/auth/session";
import { estAdmin } from "@/lib/auth/roles";
import { finMandat, libelleFonction } from "@/lib/conseil/libelles";
import { MAQUETTE, messageErreur, type Etat } from "@/lib/etat-action";
import { jourLocal, dansJours } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaMandat } from "@/lib/validation/organisation";

/** Nomination au Conseil pour 4 ans (Cadre général, art. 29). */
export async function nommerAuConseil(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const moi = await utilisateurCourant();
  if (!moi || !estAdmin(moi.role)) return { erreur: "Action réservée à l'administration." };
  const d = schemaMandat.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("conseil_mandats").insert({
    membre_id: d.data.membreId, fonction: d.data.fonction, adjoint: d.data.adjoint, debut: d.data.debut, fin: finMandat(d.data.debut),
  });
  if (error) return { erreur: messageErreur(error) };
  revalidatePath("/staff/conseil");
  return { succes: `${libelleFonction(d.data.fonction, d.data.adjoint)} : nomination enregistrée pour 4 ans.` };
}

/** Fin d'un mandat aujourd'hui (démission, remplacement). Un mandat qui n'a pas encore commencé est retiré. */
export async function terminerMandat(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const id = String(form.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return { erreur: "Demande invalide." };
  const supabase = await creerClientServeur();
  const { data: m } = await supabase.from("conseil_mandats").select("debut").eq("id", id).maybeSingle();
  if (!m) return { erreur: "Mandat introuvable." };
  const aujourdhui = jourLocal(dansJours(0));
  const { data, error } = m.debut >= aujourdhui
    ? await supabase.from("conseil_mandats").delete().eq("id", id).select("id")
    : await supabase.from("conseil_mandats").update({ fin: aujourdhui }).eq("id", id).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, "Seule l'administration peut terminer un mandat.") };
  revalidatePath("/staff/conseil");
  return { succes: "Mandat terminé." };
}
