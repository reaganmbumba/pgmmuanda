"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { utilisateurCourant } from "@/lib/auth/session";
import { peutGererCommission } from "@/lib/auth/roles";
import { MAQUETTE, messageErreur, type Etat } from "@/lib/etat-action";
import { STATUTS_PROJET } from "@/lib/organisation/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaProjet, schemaRapport, schemaTache, statutTache, versLigneProjet } from "@/lib/validation/organisation";

const REFUS = "Seuls l'administration et le responsable de la commission du projet peuvent le modifier.";

async function client() {
  if (!supabaseActif) return null;
  const moi = await utilisateurCourant();
  if (!moi || !peutGererCommission(moi.role)) return null;
  return creerClientServeur();
}

function rafraichir(id?: string) {
  revalidatePath("/staff/projets");
  revalidatePath("/staff/finances");
  if (id) revalidatePath(`/staff/projets/${id}`);
}

export async function enregistrerProjet(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const d = schemaProjet.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const id = String(form.get("id") ?? "");
  const ligne = versLigneProjet(d.data);
  const { data, error } = id
    ? await supabase.from("projets").update(ligne).eq("id", id).select("id")
    : await supabase.from("projets").insert(ligne).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  rafraichir(data[0].id);
  if (!id) redirect(`/staff/projets/${data[0].id}`);
  return { succes: "Projet enregistré." };
}

export async function changerStatutProjet(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const statut = String(form.get("statut"));
  if (!(statut in STATUTS_PROJET)) return { erreur: "Statut invalide." };
  const id = String(form.get("id"));
  const { data, error } = await supabase.from("projets").update({ statut }).eq("id", id).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  rafraichir(id);
  return { succes: "Statut du projet modifié." };
}

export async function ajouterTache(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const d = schemaTache.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const projet = String(form.get("projetId"));
  const { error } = await supabase.from("projet_taches").insert({ projet_id: projet, ...d.data });
  if (error) return { erreur: messageErreur(error, REFUS) };
  rafraichir(projet);
  return { succes: "Tâche ajoutée." };
}

export async function changerStatutTache(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const statut = statutTache.safeParse(form.get("statut"));
  if (!statut.success) return { erreur: "Statut invalide." };
  const projet = String(form.get("projetId"));
  const { data, error } = await supabase.from("projet_taches").update({ statut: statut.data })
    .eq("id", String(form.get("id"))).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  rafraichir(projet);
  return { succes: "Tâche mise à jour." };
}

export async function supprimerTache(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const projet = String(form.get("projetId"));
  const { data, error } = await supabase.from("projet_taches").delete().eq("id", String(form.get("id"))).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  rafraichir(projet);
  return { succes: "Tâche supprimée." };
}

export async function ajouterRapport(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const d = schemaRapport.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const projet = String(form.get("projetId"));
  const { error } = await supabase.from("projet_rapports").insert({ projet_id: projet, ...d.data });
  if (error) return { erreur: messageErreur(error, REFUS) };
  rafraichir(projet);
  return { succes: `Rapport enregistré : le projet est à ${d.data.avancement} %.` };
}
