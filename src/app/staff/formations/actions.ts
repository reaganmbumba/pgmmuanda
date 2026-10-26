"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { utilisateurCourant } from "@/lib/auth/session";
import { peutGererCommission } from "@/lib/auth/roles";
import { MAQUETTE, messageErreur, type Etat } from "@/lib/etat-action";
import { STATUTS_FORMATION } from "@/lib/organisation/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaEvaluation, schemaFormation, versLigneFormation } from "@/lib/validation/organisation";

const REFUS = "Seuls l'administration et le responsable de la commission organisatrice peuvent gérer cette formation.";

async function client() {
  if (!supabaseActif) return null;
  const moi = await utilisateurCourant();
  if (!moi || !peutGererCommission(moi.role)) return null;
  return creerClientServeur();
}
const nonAutorise: Etat = { erreur: REFUS };

function rafraichir(id?: string) {
  revalidatePath("/staff/formations");
  if (id) revalidatePath(`/staff/formations/${id}`);
}

export async function enregistrerFormation(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return nonAutorise;
  const d = schemaFormation.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const id = String(form.get("id") ?? "");
  const ligne = versLigneFormation(d.data);
  const { data, error } = id
    ? await supabase.from("formations").update(ligne).eq("id", id).select("id")
    : await supabase.from("formations").insert(ligne).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  rafraichir(data[0].id);
  if (!id) redirect(`/staff/formations/${data[0].id}`);
  return { succes: "Formation enregistrée. Les inscrits sont prévenus si la date ou le lieu change." };
}

export async function changerStatutFormation(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return nonAutorise;
  const statut = String(form.get("statut"));
  if (!(statut in STATUTS_FORMATION)) return { erreur: "Statut invalide." };
  const id = String(form.get("id"));
  const { data, error } = await supabase.from("formations").update({ statut }).eq("id", id).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  rafraichir(id);
  return { succes: `Formation : ${STATUTS_FORMATION[statut as keyof typeof STATUTS_FORMATION].toLowerCase()}.` };
}

export async function inscrireMembres(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return nonAutorise;
  const formation = String(form.get("formationId"));
  const membres = form.getAll("membreId").map(String).filter(Boolean);
  if (membres.length === 0) return { erreur: "Cochez au moins un membre." };
  // Une par une : la base contrôle les places restantes à chaque inscription.
  let n = 0;
  for (const m of membres) {
    const { error } = await supabase.from("formation_inscriptions").insert({ formation_id: formation, membre_id: m });
    if (error && error.code !== "23505") {
      rafraichir(formation);
      return { erreur: `${n ? `${n} inscrit${n > 1 ? "s" : ""}, puis : ` : ""}${messageErreur(error, REFUS)}` };
    }
    if (!error) n++;
  }
  rafraichir(formation);
  return { succes: `${n} membre${n > 1 ? "s" : ""} inscrit${n > 1 ? "s" : ""}. Ils sont prévenus dans l'application.` };
}

export async function evaluer(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return nonAutorise;
  const d = schemaEvaluation.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const formation = String(form.get("formationId"));
  const { data, error } = await supabase.from("formation_inscriptions").update(d.data)
    .eq("formation_id", formation).eq("membre_id", String(form.get("membreId"))).select("membre_id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  rafraichir(formation);
  return { succes: "Évaluation enregistrée." };
}

export async function desinscrire(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return nonAutorise;
  const formation = String(form.get("formationId"));
  const { data, error } = await supabase.from("formation_inscriptions").delete()
    .eq("formation_id", formation).eq("membre_id", String(form.get("membreId"))).select("membre_id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  rafraichir(formation);
  return { succes: "Inscription retirée." };
}
