import "server-only";
import type { Devise } from "@/lib/organisation/libelles";
import { creerClientServeur } from "@/lib/supabase/server";

// La base applique les règles d'accès : un responsable de paroisse ne voit que les membres de sa paroisse.

export type Paiement = { id: string; montant: number; devise: Devise; payeLe: string; saisiPar: string };
export type LigneCotisation = {
  membreId: string; nom: string; prenom: string; matricule: string; paroisse: string; telephone: string | null;
  paiement: Paiement | null;
  /** Dernier rappel du règlement pour ce mois. */
  rappel: { le: string; par: string } | null;
};

type LignePaiement = { id: string; membre_id: string; mois: string; montant: number; devise: Devise; paye_le: string; saisi_par_nom: string };
const versPaiement = (p: LignePaiement): Paiement => ({
  id: p.id, montant: Number(p.montant), devise: p.devise, payeLe: p.paye_le, saisiPar: p.saisi_par_nom,
});

/** Membres actifs et leur paiement du mois (null s'ils n'ont pas encore payé). */
export async function cotisationsDuMois(mois: string): Promise<LigneCotisation[]> {
  const supabase = await creerClientServeur();
  const [{ data: membres, error }, { data: paiements }, { data: rappels }] = await Promise.all([
    supabase.from("membres").select("id, prenom, nom, postnom, matricule, telephone, paroisses(nom)")
      .eq("statut", "actif").eq("archive", false).order("nom").order("prenom"),
    supabase.from("cotisations").select("id, membre_id, mois, montant, devise, paye_le, saisi_par_nom").eq("mois", mois),
    supabase.from("cotisations_rappels").select("membre_id, rappele_le, rappele_par_nom").eq("mois", mois),
  ]);
  if (error) throw new Error("Lecture des membres impossible.");
  const parMembre = new Map(((paiements ?? []) as LignePaiement[]).map((p) => [p.membre_id, versPaiement(p)]));
  const rappelPar = new Map(((rappels ?? []) as { membre_id: string; rappele_le: string; rappele_par_nom: string }[])
    .map((r) => [r.membre_id, { le: r.rappele_le, par: r.rappele_par_nom }]));
  type M = { id: string; prenom: string; nom: string; postnom: string; matricule: string; telephone: string | null; paroisses: { nom: string } | null };
  return ((membres ?? []) as unknown as M[]).map((m) => ({
    membreId: m.id,
    nom: `${m.prenom} ${m.nom} ${m.postnom}`.trim(),
    prenom: m.prenom,
    matricule: m.matricule,
    paroisse: m.paroisses?.nom ?? "",
    telephone: m.telephone,
    paiement: parMembre.get(m.id) ?? null,
    rappel: rappelPar.get(m.id) ?? null,
  }));
}

/** Montant le plus souvent payé ce mois-là, pour préremplir la saisie. */
export function montantHabituel(lignes: LigneCotisation[]): { montant: number; devise: Devise } | null {
  const compte = new Map<string, number>();
  for (const l of lignes) if (l.paiement) {
    const cle = `${l.paiement.montant}|${l.paiement.devise}`;
    compte.set(cle, (compte.get(cle) ?? 0) + 1);
  }
  const [cle] = [...compte.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!cle) return null;
  const [montant, devise] = cle.split("|");
  return { montant: Number(montant), devise: devise as Devise };
}

/** Cotisations d'un membre, par mois (les plus récentes d'abord). */
export async function cotisationsMembre(membreId: string): Promise<(Paiement & { mois: string })[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("cotisations").select("id, membre_id, mois, montant, devise, paye_le, saisi_par_nom")
    .eq("membre_id", membreId).order("mois", { ascending: false });
  return ((data ?? []) as LignePaiement[]).map((p) => ({ mois: p.mois, ...versPaiement(p) }));
}
