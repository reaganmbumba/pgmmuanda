"use server";

import { revalidatePath } from "next/cache";
import { utilisateurCourant } from "@/lib/auth/session";
import { estAdmin, peutGererMembres } from "@/lib/auth/roles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaChorale, schemaParoisse } from "@/lib/validation/membres";

export type Etat = { erreur?: string; succes?: string } | undefined;

const MAQUETTE: Etat = { erreur: "Mode maquette : l'enregistrement est désactivé tant que Supabase n'est pas configuré." };

function rafraichir() {
  revalidatePath("/staff/paroisses");
  revalidatePath("/staff/chorales");
}

export async function ajouterParoisse(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const moi = await utilisateurCourant();
  if (!moi || !estAdmin(moi.role)) return { erreur: "Action réservée à l'administration." };
  const d = schemaParoisse.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("paroisses").insert({ nom: d.data.nom, ville: d.data.ville });
  if (error) return { erreur: error.code === "23505" ? "Cette paroisse existe déjà." : "Enregistrement refusé." };
  rafraichir();
  return { succes: `Paroisse « ${d.data.nom} » ajoutée.` };
}

export async function ajouterChorale(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const moi = await utilisateurCourant();
  if (!moi || !peutGererMembres(moi.role)) return { erreur: "Action réservée à l'administration et aux responsables de paroisse." };
  const d = schemaChorale.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("chorales").insert({ nom: d.data.nom, paroisse_id: d.data.paroisseId });
  if (error) {
    if (error.code === "23505") return { erreur: "Cette chorale existe déjà dans cette paroisse." };
    if (error.code === "42501") return { erreur: "Vous ne pouvez ajouter une chorale que dans votre paroisse." };
    return { erreur: "Enregistrement refusé." };
  }
  rafraichir();
  return { succes: `Chorale « ${d.data.nom} » ajoutée.` };
}

export async function supprimerOrganisation(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const moi = await utilisateurCourant();
  if (!moi || !peutGererMembres(moi.role)) return { erreur: "Action non autorisée." };
  const table = form.get("type") === "paroisse" ? "paroisses" : "chorales";
  if (table === "paroisses" && !estAdmin(moi.role)) return { erreur: "Action réservée à l'administration." };
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from(table).delete().eq("id", String(form.get("id"))).select("id");
  if (error?.code === "23503") {
    return { erreur: table === "paroisses" ? "Impossible : des membres ou des chorales sont rattachés à cette paroisse." : "Suppression refusée." };
  }
  if (error || !data?.length) return { erreur: "Suppression refusée." };
  rafraichir();
  return { succes: "Supprimé." };
}
