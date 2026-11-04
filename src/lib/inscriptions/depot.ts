import "server-only";
import { creerClientServeur } from "@/lib/supabase/server";
import { VOIX, type CodeVoix } from "@/lib/membres/libelles";

export type Inscription = {
  id: string;
  nom: string;
  postnom: string;
  prenom: string;
  sexe: "M" | "F" | null;
  telephone: string;
  email: string;
  paroisse: string;
  chorale: string;
  voix: string;
  photo: string | null;
  statut: "en_attente" | "acceptee" | "refusee";
  membreId: string | null;
  creeLe: string;
};

type Ligne = {
  id: string; nom: string; postnom: string; prenom: string; sexe: "M" | "F" | null; telephone: string;
  email: string | null; voix: CodeVoix | null; photo_url: string | null; statut: Inscription["statut"];
  membre_id: string | null; cree_le: string; paroisses: { nom: string } | null; chorales: { nom: string } | null;
};

/** Le lien à partager (null si le fichier SQL n'a pas encore été exécuté). */
export async function lireLien(): Promise<{ code: string; ouvert: boolean } | null> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("inscription_lien").select("code, ouvert").maybeSingle();
  return data;
}

/** Inscriptions en attente, puis les 20 dernières traitées. */
export async function listerInscriptions(): Promise<{ enAttente: Inscription[]; traitees: Inscription[] }> {
  const supabase = await creerClientServeur();
  const colonnes = "id, nom, postnom, prenom, sexe, telephone, email, voix, photo_url, statut, membre_id, cree_le, paroisses(nom), chorales(nom)";
  const [attente, traitees] = await Promise.all([
    supabase.from("inscriptions").select(colonnes).eq("statut", "en_attente").order("cree_le"),
    supabase.from("inscriptions").select(colonnes.replace("photo_url, ", "")).neq("statut", "en_attente")
      .order("traitee_le", { ascending: false }).limit(20),
  ]);
  const versInscription = (l: Ligne): Inscription => ({
    id: l.id, nom: l.nom, postnom: l.postnom, prenom: l.prenom, sexe: l.sexe, telephone: l.telephone,
    email: l.email ?? "", paroisse: l.paroisses?.nom ?? "", chorale: l.chorales?.nom ?? "",
    voix: l.voix ? VOIX[l.voix] : "", photo: l.photo_url ?? null, statut: l.statut, membreId: l.membre_id, creeLe: l.cree_le,
  });
  return {
    enAttente: ((attente.data ?? []) as unknown as Ligne[]).map(versInscription),
    traitees: ((traitees.data ?? []) as unknown as Ligne[]).map(versInscription),
  };
}

/** Nombre d'inscriptions qui attendent (pour le bandeau de la page Membres). */
export async function compterEnAttente(): Promise<number> {
  const supabase = await creerClientServeur();
  const { count } = await supabase.from("inscriptions").select("id", { count: "exact", head: true }).eq("statut", "en_attente");
  return count ?? 0;
}
