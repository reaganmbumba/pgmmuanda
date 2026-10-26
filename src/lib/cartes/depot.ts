import "server-only";
import { creerClientServeur } from "@/lib/supabase/server";

export const STATUTS_CARTE = { active: "Active", revoquee: "Révoquée", remplacee: "Remplacée" } as const;
type CodeCarte = keyof typeof STATUTS_CARTE;

export type CarteAffichee = {
  id: string;
  reference: string;
  statutCode: CodeCarte;
  statut: (typeof STATUTS_CARTE)[CodeCarte];
  dateEmission: string;
  revoqueeLe: string | null;
  motif: string | null;
};

type LigneCarte = {
  id: string; reference_qr: string; statut: CodeCarte; date_emission: string;
  revoquee_le: string | null; motif_revocation: string | null;
};

const versCarte = (c: LigneCarte): CarteAffichee => ({
  id: c.id,
  reference: c.reference_qr,
  statutCode: c.statut,
  statut: STATUTS_CARTE[c.statut],
  dateEmission: c.date_emission,
  revoqueeLe: c.revoquee_le,
  motif: c.motif_revocation,
});

const COLONNES_CARTE = "id, reference_qr, statut, date_emission, revoquee_le, motif_revocation";

export async function cartesDuMembre(membreId: string): Promise<CarteAffichee[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("cartes").select(COLONNES_CARTE)
    .eq("membre_id", membreId).order("date_emission", { ascending: false });
  return ((data ?? []) as LigneCarte[]).map(versCarte);
}

/** Ce qui est imprimé sur une carte. */
export type CarteImprimable = {
  reference: string;
  dateEmission: string;
  prenom: string;
  nom: string;
  postnom: string;
  matricule: string;
  fonction: string;
  paroisse: string;
  photo: string | null;
};

const COLONNES_IMPRESSION =
  "reference_qr, date_emission, statut, membres!inner(prenom, nom, postnom, matricule, fonction, photo_url, paroisse_id, archive, paroisses(nom))";

type LigneImpression = {
  reference_qr: string; date_emission: string; statut: CodeCarte;
  membres: { prenom: string; nom: string; postnom: string; matricule: string; fonction: string; photo_url: string | null; paroisses: { nom: string } | null };
};

const versImprimable = (l: LigneImpression): CarteImprimable => ({
  reference: l.reference_qr,
  dateEmission: l.date_emission,
  prenom: l.membres.prenom,
  nom: l.membres.nom,
  postnom: l.membres.postnom,
  matricule: l.membres.matricule,
  fonction: l.membres.fonction,
  paroisse: l.membres.paroisses?.nom ?? "",
  photo: l.membres.photo_url,
});

/** Une carte active à imprimer (la base vérifie que l'utilisateur y a droit). */
export async function carteImprimable(carteId: string): Promise<CarteImprimable | null> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("cartes").select(COLONNES_IMPRESSION)
    .eq("id", carteId).eq("statut", "active").maybeSingle();
  return data ? versImprimable(data as unknown as LigneImpression) : null;
}

/** Toutes les cartes actives visibles, éventuellement d'une seule paroisse, par matricule. */
export async function cartesActivesImprimables(paroisseId?: string): Promise<CarteImprimable[]> {
  const supabase = await creerClientServeur();
  let q = supabase.from("cartes").select(COLONNES_IMPRESSION).eq("statut", "active").eq("membres.archive", false);
  if (paroisseId) q = q.eq("membres.paroisse_id", paroisseId);
  const { data } = await q;
  return ((data ?? []) as unknown as LigneImpression[]).map(versImprimable)
    .sort((a, b) => a.matricule.localeCompare(b.matricule));
}

/** Situation des cartes de chaque membre non archivé, pour la page « Cartes et QR codes ». */
export type EtatCarteMembre = {
  membreId: string;
  matricule: string;
  prenom: string;
  nom: string;
  postnom: string;
  statutMembre: string;
  paroisseId: string;
  paroisse: string;
  carte: CarteAffichee | null;
};

export async function etatDesCartes(): Promise<EtatCarteMembre[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("membres")
    .select(`id, matricule, prenom, nom, postnom, statut, paroisse_id, paroisses(nom), cartes(${COLONNES_CARTE})`)
    .eq("archive", false)
    .order("matricule");
  if (error) throw new Error("Lecture des cartes impossible.");
  type L = { id: string; matricule: string; prenom: string; nom: string; postnom: string; statut: string; paroisse_id: string; paroisses: { nom: string } | null; cartes: LigneCarte[] };
  return ((data ?? []) as unknown as L[]).map((m) => {
    const active = m.cartes.find((c) => c.statut === "active");
    return {
      membreId: m.id,
      matricule: m.matricule,
      prenom: m.prenom,
      nom: m.nom,
      postnom: m.postnom,
      statutMembre: m.statut,
      paroisseId: m.paroisse_id,
      paroisse: m.paroisses?.nom ?? "",
      carte: active ? versCarte(active) : null,
    };
  });
}

export type Verification = { id: number; resultat: string; reference: string; matricule: string | null; date: string };

/** Derniers contrôles (personnel habilité seulement, selon les règles de la base). */
export async function dernieresVerifications(): Promise<Verification[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("verifications")
    .select("id, resultat, reference_saisie, cree_le, cartes(membres(matricule))")
    .order("cree_le", { ascending: false })
    .limit(15);
  type L = { id: number; resultat: string; reference_saisie: string; cree_le: string; cartes: { membres: { matricule: string } | null } | null };
  return ((data ?? []) as unknown as L[]).map((v) => ({
    id: v.id,
    resultat: v.resultat,
    reference: v.reference_saisie,
    matricule: v.cartes?.membres?.matricule ?? null,
    date: v.cree_le,
  }));
}
