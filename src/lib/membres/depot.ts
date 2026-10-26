import "server-only";
import { creerClientServeur } from "@/lib/supabase/server";
import { STATUTS, VOIX, type CodeStatut, type CodeVoix } from "./libelles";

/** Membre tel qu'affiché dans l'application (libellés en français). */
export type FicheMembre = {
  id: string;
  matricule: string;
  nom: string;
  postnom: string;
  prenom: string;
  sexe: "M" | "F" | null;
  telephone: string;
  email: string;
  paroisseId: string;
  paroisse: string;
  choraleId: string | null;
  chorale: string;
  voixCode: CodeVoix | null;
  voix: string;
  fonction: string;
  dateAdhesion: string;
  statutCode: CodeStatut;
  statut: string;
  archive: boolean;
  estDemo: boolean;
  profilId: string | null;
};

const COLONNES =
  "id, matricule, nom, postnom, prenom, sexe, telephone, email, paroisse_id, chorale_id, voix, fonction, date_adhesion, statut, archive, est_demo, profil_id, paroisses(nom), chorales(nom)";

type Ligne = {
  id: string; matricule: string; nom: string; postnom: string; prenom: string; sexe: "M" | "F" | null;
  telephone: string | null; email: string | null; paroisse_id: string; chorale_id: string | null;
  voix: CodeVoix | null; fonction: string; date_adhesion: string; statut: CodeStatut; archive: boolean;
  est_demo: boolean; profil_id: string | null;
  paroisses: { nom: string } | null; chorales: { nom: string } | null;
};

const versFiche = (l: Ligne): FicheMembre => ({
  id: l.id,
  matricule: l.matricule,
  nom: l.nom,
  postnom: l.postnom,
  prenom: l.prenom,
  sexe: l.sexe,
  telephone: l.telephone ?? "",
  email: l.email ?? "",
  paroisseId: l.paroisse_id,
  paroisse: l.paroisses?.nom ?? "",
  choraleId: l.chorale_id,
  chorale: l.chorales?.nom ?? "",
  voixCode: l.voix,
  voix: l.voix ? VOIX[l.voix] : "",
  fonction: l.fonction,
  dateAdhesion: l.date_adhesion,
  statutCode: l.statut,
  statut: STATUTS[l.statut],
  archive: l.archive,
  estDemo: l.est_demo,
  profilId: l.profil_id,
});

/** Membres visibles par l'utilisateur connecté (la base applique les règles d'accès). */
export async function listerMembres({ archives = false } = {}): Promise<FicheMembre[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("membres").select(COLONNES).eq("archive", archives).order("matricule");
  if (error) throw new Error("Lecture des membres impossible.");
  return (data as unknown as Ligne[]).map(versFiche);
}

export async function lireMembre(id: string): Promise<FicheMembre | null> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("membres").select(COLONNES).eq("id", id).maybeSingle();
  return data ? versFiche(data as unknown as Ligne) : null;
}

/** Fiche du choriste connecté, s'il est relié à un membre. */
export async function maFiche(profilId: string): Promise<FicheMembre | null> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("membres").select(COLONNES).eq("profil_id", profilId).maybeSingle();
  return data ? versFiche(data as unknown as Ligne) : null;
}

export type Organisation = {
  paroisses: { id: string; nom: string; ville: string; estDemo: boolean }[];
  chorales: { id: string; nom: string; paroisseId: string; estDemo: boolean }[];
};

export async function lireOrganisation(): Promise<Organisation> {
  const supabase = await creerClientServeur();
  const [p, c] = await Promise.all([
    supabase.from("paroisses").select("id, nom, ville, est_demo").order("nom"),
    supabase.from("chorales").select("id, nom, paroisse_id, est_demo").order("nom"),
  ]);
  return {
    paroisses: (p.data ?? []).map((x) => ({ id: x.id, nom: x.nom, ville: x.ville, estDemo: x.est_demo })),
    chorales: (c.data ?? []).map((x) => ({ id: x.id, nom: x.nom, paroisseId: x.paroisse_id, estDemo: x.est_demo })),
  };
}

export type EvenementHistorique = {
  id: number;
  type: string;
  avant: Record<string, unknown> | null;
  apres: Record<string, unknown> | null;
  auteur: string;
  date: string;
};

export async function lireHistorique(membreId: string): Promise<EvenementHistorique[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("membre_historique")
    .select("id, type, avant, apres, auteur_id, cree_le")
    .eq("membre_id", membreId)
    .order("cree_le", { ascending: false })
    .limit(100);
  const lignes = data ?? [];
  // Noms des auteurs : visibles seulement pour l'administration (règles d'accès des profils).
  const ids = [...new Set(lignes.map((l) => l.auteur_id).filter(Boolean))] as string[];
  const { data: profils } = ids.length
    ? await supabase.from("profils").select("id, nom_affiche").in("id", ids)
    : { data: [] };
  const noms = new Map((profils ?? []).map((p) => [p.id, p.nom_affiche as string]));
  return lignes.map((l) => ({
    id: l.id,
    type: l.type,
    avant: l.avant,
    apres: l.apres,
    auteur: l.auteur_id ? (noms.get(l.auteur_id) ?? "Membre du staff") : "Système",
    date: l.cree_le,
  }));
}

export type DemandeCorrection = {
  id: string;
  membreId: string;
  membre?: string;
  matricule?: string;
  champ: string;
  valeur: string;
  motif: string;
  statut: string;
  date: string;
};

export async function lireDemandes(filtre: { membreId?: string; enAttente?: boolean } = {}): Promise<DemandeCorrection[]> {
  const supabase = await creerClientServeur();
  let q = supabase
    .from("demandes_correction")
    .select("id, membre_id, champ, valeur_proposee, motif, statut, cree_le, membres(nom, prenom, matricule)")
    .order("cree_le", { ascending: false });
  if (filtre.membreId) q = q.eq("membre_id", filtre.membreId);
  if (filtre.enAttente) q = q.eq("statut", "en_attente");
  const { data } = await q;
  type L = { id: string; membre_id: string; champ: string; valeur_proposee: string; motif: string | null; statut: string; cree_le: string; membres: { nom: string; prenom: string; matricule: string } | null };
  return ((data ?? []) as unknown as L[]).map((d) => ({
    id: d.id,
    membreId: d.membre_id,
    membre: d.membres ? `${d.membres.prenom} ${d.membres.nom}` : undefined,
    matricule: d.membres?.matricule,
    champ: d.champ,
    valeur: d.valeur_proposee,
    motif: d.motif ?? "",
    statut: d.statut,
    date: d.cree_le,
  }));
}

/** Comptes « choriste » qui ne sont reliés à aucun membre (lecture réservée à l'administration). */
export async function comptesNonRelies(): Promise<{ id: string; nom: string; identifiant: string | null }[]> {
  const supabase = await creerClientServeur();
  const [{ data: profils }, { data: relies }] = await Promise.all([
    supabase.from("profils").select("id, nom_affiche, identifiant").eq("role", "choriste").eq("actif", true).order("nom_affiche"),
    supabase.from("membres").select("profil_id").not("profil_id", "is", null),
  ]);
  const pris = new Set((relies ?? []).map((r) => r.profil_id));
  return (profils ?? []).filter((p) => !pris.has(p.id)).map((p) => ({ id: p.id, nom: p.nom_affiche, identifiant: p.identifiant }));
}
