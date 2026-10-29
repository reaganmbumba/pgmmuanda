import "server-only";
import { VOIX, type CodeVoix } from "@/lib/membres/libelles";
import { creerClientServeur } from "@/lib/supabase/server";
import {
  STATUTS_FORMATION, STATUTS_INSCRIPTION, STATUTS_PROJET, STATUTS_TACHE,
  type CodeStatutFormation, type CodeStatutInscription, type CodeStatutProjet, type CodeStatutTache,
  type Devise, type SensOperation,
} from "./libelles";

// La base applique les règles d'accès : chaque lecture ne renvoie que ce que l'utilisateur peut voir.

type Nom = { prenom: string; nom: string; postnom: string; matricule: string; paroisses: { nom: string } | null };
const personne = (m: Nom | null) => ({
  nom: m ? `${m.prenom} ${m.nom} ${m.postnom}`.trim() : "Membre",
  matricule: m?.matricule ?? "",
  paroisse: m?.paroisses?.nom ?? "",
});
const MEMBRE = "membres(prenom, nom, postnom, matricule, paroisses(nom))";

// ---------------------------------------------------------------------
// Commissions
// ---------------------------------------------------------------------
export type Commission = { id: string; nom: string; description: string; nbMembres: number };

export async function listerCommissions(): Promise<Commission[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("commissions").select("id, nom, description, commission_membres(count)").order("nom");
  if (error) throw new Error("Lecture des commissions impossible.");
  type L = { id: string; nom: string; description: string | null; commission_membres: { count: number }[] };
  return (data as unknown as L[]).map((c) => ({
    id: c.id, nom: c.nom, description: c.description ?? "", nbMembres: c.commission_membres[0]?.count ?? 0,
  }));
}

export async function lireCommission(id: string): Promise<Commission | null> {
  return (await listerCommissions()).find((c) => c.id === id) ?? null;
}

export type MembreCommission = { membreId: string; nom: string; matricule: string; paroisse: string; fonction: string; depuis: string };

export async function membresCommission(id: string): Promise<MembreCommission[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("commission_membres")
    .select(`membre_id, fonction, depuis, ${MEMBRE}`).eq("commission_id", id);
  type L = { membre_id: string; fonction: string; depuis: string; membres: Nom | null };
  const ordre = (f: string) => ["Responsable", "Adjoint", "Secrétaire", "Trésorier"].indexOf(f) + 1 || 99;
  return ((data ?? []) as unknown as L[])
    .map((l) => ({ membreId: l.membre_id, fonction: l.fonction, depuis: l.depuis, ...personne(l.membres) }))
    .sort((a, b) => ordre(a.fonction) - ordre(b.fonction) || a.nom.localeCompare(b.nom, "fr"));
}

export async function mesCommissions(membreId: string): Promise<{ commission: string; description: string; fonction: string }[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("commission_membres")
    .select("fonction, commissions(nom, description)").eq("membre_id", membreId);
  type L = { fonction: string; commissions: { nom: string; description: string | null } | null };
  return ((data ?? []) as unknown as L[]).map((l) => ({
    commission: l.commissions?.nom ?? "", description: l.commissions?.description ?? "", fonction: l.fonction,
  }));
}

// ---------------------------------------------------------------------
// Formations
// ---------------------------------------------------------------------
export type Formation = {
  id: string; titre: string; description: string; formateur: string; lieu: string; debut: string; fin: string | null;
  places: number | null; commissionId: string | null; commission: string;
  statutCode: CodeStatutFormation; statut: string; nbInscrits: number;
};
const COLONNES_FORMATION = "id, titre, description, formateur, lieu, debut, fin, places, commission_id, statut, commissions(nom), formation_inscriptions(count)";
type LigneFormation = {
  id: string; titre: string; description: string; formateur: string; lieu: string; debut: string; fin: string | null;
  places: number | null; commission_id: string | null; statut: CodeStatutFormation;
  commissions: { nom: string } | null; formation_inscriptions?: { count: number }[];
};
const versFormation = (l: LigneFormation): Formation => ({
  id: l.id, titre: l.titre, description: l.description, formateur: l.formateur, lieu: l.lieu, debut: l.debut, fin: l.fin,
  places: l.places, commissionId: l.commission_id, commission: l.commissions?.nom ?? "",
  statutCode: l.statut, statut: STATUTS_FORMATION[l.statut], nbInscrits: l.formation_inscriptions?.[0]?.count ?? 0,
});

export async function listerFormations(f: { commissionId?: string } = {}): Promise<Formation[]> {
  const supabase = await creerClientServeur();
  let q = supabase.from("formations").select(COLONNES_FORMATION).order("debut", { ascending: false });
  if (f.commissionId) q = q.eq("commission_id", f.commissionId);
  const { data, error } = await q;
  if (error) throw new Error("Lecture des formations impossible.");
  return (data as unknown as LigneFormation[]).map(versFormation);
}

export async function lireFormation(id: string): Promise<Formation | null> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("formations").select(COLONNES_FORMATION).eq("id", id).maybeSingle();
  return data ? versFormation(data as unknown as LigneFormation) : null;
}

export type Inscription = {
  membreId: string; nom: string; matricule: string; paroisse: string;
  statutCode: CodeStatutInscription; statut: string; note: number | null; appreciation: string; evalueLe: string | null;
};

export async function inscriptionsFormation(id: string): Promise<Inscription[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("formation_inscriptions")
    .select(`membre_id, statut, note, appreciation, evalue_le, ${MEMBRE}`).eq("formation_id", id);
  type L = { membre_id: string; statut: CodeStatutInscription; note: number | null; appreciation: string; evalue_le: string | null; membres: Nom | null };
  return ((data ?? []) as unknown as L[]).map((l) => ({
    membreId: l.membre_id, ...personne(l.membres), statutCode: l.statut, statut: STATUTS_INSCRIPTION[l.statut],
    note: l.note === null ? null : Number(l.note), appreciation: l.appreciation, evalueLe: l.evalue_le,
  })).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

export type MaFormation = Formation & { resultat: string; resultatCode: CodeStatutInscription; note: number | null; appreciation: string };

export async function mesFormations(membreId: string): Promise<MaFormation[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("formation_inscriptions")
    .select("statut, note, appreciation, formations(id, titre, description, formateur, lieu, debut, fin, places, commission_id, statut, commissions(nom))")
    .eq("membre_id", membreId);
  type L = { statut: CodeStatutInscription; note: number | null; appreciation: string; formations: LigneFormation | null };
  return ((data ?? []) as unknown as L[]).filter((l) => l.formations).map((l) => ({
    ...versFormation(l.formations!), resultatCode: l.statut, resultat: STATUTS_INSCRIPTION[l.statut],
    note: l.note === null ? null : Number(l.note), appreciation: l.appreciation,
  })).sort((a, b) => b.debut.localeCompare(a.debut));
}

// ---------------------------------------------------------------------
// Projets
// ---------------------------------------------------------------------
export type Projet = {
  id: string; titre: string; description: string; commissionId: string | null; commission: string; responsable: string;
  debut: string | null; finPrevue: string | null; budgetCdf: number; budgetUsd: number;
  statutCode: CodeStatutProjet; statut: string; avancement: number;
};
const COLONNES_PROJET = "id, titre, description, commission_id, responsable, debut, fin_prevue, budget_cdf, budget_usd, statut, avancement, commissions(nom)";
type LigneProjet = {
  id: string; titre: string; description: string; commission_id: string | null; responsable: string;
  debut: string | null; fin_prevue: string | null; budget_cdf: number; budget_usd: number;
  statut: CodeStatutProjet; avancement: number; commissions: { nom: string } | null;
};
const versProjet = (l: LigneProjet): Projet => ({
  id: l.id, titre: l.titre, description: l.description, commissionId: l.commission_id, commission: l.commissions?.nom ?? "",
  responsable: l.responsable, debut: l.debut, finPrevue: l.fin_prevue,
  budgetCdf: Number(l.budget_cdf), budgetUsd: Number(l.budget_usd),
  statutCode: l.statut, statut: STATUTS_PROJET[l.statut], avancement: l.avancement,
});

export async function listerProjets(f: { commissionId?: string } = {}): Promise<Projet[]> {
  const supabase = await creerClientServeur();
  let q = supabase.from("projets").select(COLONNES_PROJET).order("cree_le", { ascending: false });
  if (f.commissionId) q = q.eq("commission_id", f.commissionId);
  const { data, error } = await q;
  if (error) throw new Error("Lecture des projets impossible.");
  return (data as unknown as LigneProjet[]).map(versProjet);
}

export async function lireProjet(id: string): Promise<Projet | null> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("projets").select(COLONNES_PROJET).eq("id", id).maybeSingle();
  return data ? versProjet(data as unknown as LigneProjet) : null;
}

export type Tache = { id: string; titre: string; responsable: string; echeance: string | null; statutCode: CodeStatutTache; statut: string };

export async function tachesProjet(id: string): Promise<Tache[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("projet_taches").select("id, titre, responsable, echeance, statut")
    .eq("projet_id", id).order("cree_le");
  return (data ?? []).map((t) => ({
    id: t.id, titre: t.titre, responsable: t.responsable, echeance: t.echeance,
    statutCode: t.statut as CodeStatutTache, statut: STATUTS_TACHE[t.statut as CodeStatutTache],
  }));
}

export type Rapport = { id: string; avancement: number; contenu: string; auteur: string; date: string };

export async function rapportsProjet(id: string): Promise<Rapport[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("projet_rapports").select("id, avancement, contenu, auteur_id, cree_le")
    .eq("projet_id", id).order("cree_le", { ascending: false });
  const lignes = data ?? [];
  const ids = [...new Set(lignes.map((l) => l.auteur_id).filter(Boolean))] as string[];
  // Noms des auteurs : lisibles par l'administration seulement
  const { data: profils } = ids.length ? await supabase.from("profils").select("id, nom_affiche").in("id", ids) : { data: [] };
  const noms = new Map((profils ?? []).map((p) => [p.id, p.nom_affiche as string]));
  return lignes.map((l) => ({
    id: l.id, avancement: l.avancement, contenu: l.contenu, date: l.cree_le,
    auteur: l.auteur_id ? (noms.get(l.auteur_id) ?? "Responsable") : "",
  }));
}

// ---------------------------------------------------------------------
// Finances
// ---------------------------------------------------------------------
export type Operation = {
  id: string; sens: SensOperation; libelle: string; categorie: string; montant: number; devise: Devise;
  date: string; projetId: string | null; projet: string; piece: string;
  /** Nom de la personne qui a enregistré l'opération. */
  saisiPar?: string;
};

export async function listerOperations(f: { projetId?: string; depuis?: string; avant?: string } = {}): Promise<Operation[]> {
  const supabase = await creerClientServeur();
  let q = supabase.from("operations_financieres")
    .select("id, sens, libelle, categorie, montant, devise, date_operation, projet_id, piece, saisi_par_nom, projets(titre)")
    .order("date_operation", { ascending: false }).order("saisi_le", { ascending: false });
  if (f.projetId) q = q.eq("projet_id", f.projetId);
  if (f.depuis) q = q.gte("date_operation", f.depuis);
  if (f.avant) q = q.lt("date_operation", f.avant);
  const { data, error } = await q;
  if (error) throw new Error("Lecture des finances impossible.");
  type L = { id: string; sens: SensOperation; libelle: string; categorie: string; montant: number; devise: Devise;
    date_operation: string; projet_id: string | null; piece: string; saisi_par_nom: string; projets: { titre: string } | null };
  return (data as unknown as L[]).map((l) => ({
    id: l.id, sens: l.sens, libelle: l.libelle, categorie: l.categorie, montant: Number(l.montant), devise: l.devise,
    date: l.date_operation, projetId: l.projet_id, projet: l.projets?.titre ?? "", piece: l.piece, saisiPar: l.saisi_par_nom,
  }));
}

// ---------------------------------------------------------------------
// Hébergement
// ---------------------------------------------------------------------
export type Chambre = { id: string; nom: string; site: string; capacite: number; sexe: "M" | "F" | null; notes: string; active: boolean };
export type Affectation = {
  id: string; chambreId: string; chambre: string; site: string; membreId: string; nom: string; matricule: string; paroisse: string;
  du: string; au: string; notes: string;
};

export async function listerChambres(): Promise<Chambre[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("chambres").select("id, nom, site, capacite, sexe, notes, active").order("site").order("nom");
  if (error) throw new Error("Lecture des chambres impossible.");
  return data as Chambre[];
}

export async function listerAffectations(f: { depuis?: string; membreId?: string } = {}): Promise<Affectation[]> {
  const supabase = await creerClientServeur();
  let q = supabase.from("affectations_chambre")
    .select(`id, chambre_id, membre_id, du, au, notes, chambres(nom, site), ${MEMBRE}`).order("du");
  if (f.depuis) q = q.gte("au", f.depuis);
  if (f.membreId) q = q.eq("membre_id", f.membreId);
  const { data, error } = await q;
  if (error) throw new Error("Lecture de l'hébergement impossible.");
  type L = { id: string; chambre_id: string; membre_id: string; du: string; au: string; notes: string;
    chambres: { nom: string; site: string } | null; membres: Nom | null };
  return (data as unknown as L[]).map((l) => ({
    id: l.id, chambreId: l.chambre_id, chambre: l.chambres?.nom ?? "", site: l.chambres?.site ?? "",
    membreId: l.membre_id, ...personne(l.membres), du: l.du, au: l.au, notes: l.notes,
  }));
}

// ---------------------------------------------------------------------
// Chants
// ---------------------------------------------------------------------
export type Chant = {
  id: string; titre: string; auteur: string; langue: string; categorie: string; paroles: string;
  voixCodes: CodeVoix[]; voix: string; lienPartition: string | null; lienAudio: string | null; archive: boolean;
};
const versChant = (l: Omit<Chant, "voixCodes" | "voix" | "lienPartition" | "lienAudio"> & { voix: CodeVoix[]; lien_partition: string | null; lien_audio: string | null }): Chant => ({
  id: l.id, titre: l.titre, auteur: l.auteur, langue: l.langue, categorie: l.categorie, paroles: l.paroles,
  voixCodes: l.voix, voix: l.voix.length ? l.voix.map((v) => VOIX[v]).join(", ") : "Toutes les voix",
  lienPartition: l.lien_partition, lienAudio: l.lien_audio, archive: l.archive,
});
const COLONNES_CHANT = "id, titre, auteur, langue, categorie, paroles, voix, lien_partition, lien_audio, archive";

export async function listerChants(f: { archives?: boolean } = {}): Promise<Chant[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("chants").select(COLONNES_CHANT).eq("archive", !!f.archives).order("titre");
  if (error) throw new Error("Lecture du répertoire impossible.");
  return (data as unknown as Parameters<typeof versChant>[0][]).map(versChant);
}

export async function lireChant(id: string): Promise<Chant | null> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("chants").select(COLONNES_CHANT).eq("id", id).maybeSingle();
  return data ? versChant(data as unknown as Parameters<typeof versChant>[0]) : null;
}
