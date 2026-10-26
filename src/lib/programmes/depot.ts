import "server-only";
import type { CodeVoix } from "@/lib/membres/libelles";
import { VOIX } from "@/lib/membres/libelles";
import type { Organisation } from "@/lib/membres/depot";
import { creerClientServeur } from "@/lib/supabase/server";
import {
  STATUTS_ACTIVITE, STATUTS_PRESENCE, TYPES_ANNONCE,
  type Ciblage, type CodeStatutActivite, type CodeStatutPresence, type CodeTypeAnnonce,
} from "./libelles";

type LigneCiblage = {
  portee_paroisse: string | null; pour_tous: boolean;
  cible_paroisses: string[]; cible_chorales: string[]; cible_voix: CodeVoix[];
};
const versCiblage = (l: LigneCiblage): Ciblage => ({
  portee: l.portee_paroisse, pourTous: l.pour_tous, paroisses: l.cible_paroisses, chorales: l.cible_chorales, voix: l.cible_voix,
});
const COLONNES_CIBLAGE = "portee_paroisse, pour_tous, cible_paroisses, cible_chorales, cible_voix";

/** « Toute la PGM · Ténors, Chorale X » : lisible par un humain. */
export function decrireCiblage(c: Ciblage, org: Organisation): { portee: string; cibles: string } {
  const nomParoisse = (id: string) => org.paroisses.find((p) => p.id === id)?.nom ?? "Paroisse supprimée";
  const portee = c.portee ? nomParoisse(c.portee) : "Toute la PGM";
  if (c.pourTous) return { portee, cibles: "Tous les membres" };
  const cibles = [
    ...c.paroisses.map(nomParoisse),
    ...c.chorales.map((id) => org.chorales.find((x) => x.id === id)?.nom ?? "Chorale supprimée"),
    ...c.voix.map((v) => `Voix ${VOIX[v].toLowerCase()}`),
  ];
  return { portee, cibles: cibles.join(", ") };
}

// ---------------------------------------------------------------------
// Activités
// ---------------------------------------------------------------------
export type Activite = {
  id: string; titre: string; description: string; debut: string; fin: string | null; lieu: string;
  responsable: string; commissionId: string | null; commission: string;
  statutCode: CodeStatutActivite; statut: string; ciblage: Ciblage;
};
const COLONNES_ACTIVITE = `id, titre, description, debut, fin, lieu, responsable, commission_id, statut, ${COLONNES_CIBLAGE}, commissions(nom)`;
type LigneActivite = LigneCiblage & {
  id: string; titre: string; description: string; debut: string; fin: string | null; lieu: string; responsable: string;
  commission_id: string | null; statut: CodeStatutActivite; commissions: { nom: string } | null;
};
const versActivite = (l: LigneActivite): Activite => ({
  id: l.id, titre: l.titre, description: l.description, debut: l.debut, fin: l.fin, lieu: l.lieu,
  responsable: l.responsable, commissionId: l.commission_id, commission: l.commissions?.nom ?? "",
  statutCode: l.statut, statut: STATUTS_ACTIVITE[l.statut], ciblage: versCiblage(l),
});

/** Activités visibles par l'utilisateur (un choriste ne reçoit que celles qui le concernent). */
export async function listerActivites(f: { depuis?: string; avant?: string; limite?: number; decroissant?: boolean } = {}): Promise<Activite[]> {
  const supabase = await creerClientServeur();
  let q = supabase.from("activites").select(COLONNES_ACTIVITE).order("debut", { ascending: !f.decroissant });
  if (f.depuis) q = q.gte("debut", f.depuis);
  if (f.avant) q = q.lt("debut", f.avant);
  if (f.limite) q = q.limit(f.limite);
  const { data, error } = await q;
  if (error) throw new Error("Lecture du programme impossible.");
  return (data as unknown as LigneActivite[]).map(versActivite);
}

export async function lireActivite(id: string): Promise<Activite | null> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("activites").select(COLONNES_ACTIVITE).eq("id", id).maybeSingle();
  return data ? versActivite(data as unknown as LigneActivite) : null;
}

export async function lireCommissions(): Promise<{ id: string; nom: string }[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("commissions").select("id, nom").order("nom");
  return data ?? [];
}

// ---------------------------------------------------------------------
// Annonces
// ---------------------------------------------------------------------
export type Annonce = {
  id: string; titre: string; contenu: string; typeCode: CodeTypeAnnonce; type: string;
  date: string; archivee: boolean; auteur: string; ciblage: Ciblage;
};
type LigneAnnonce = LigneCiblage & {
  id: string; titre: string; contenu: string; type: CodeTypeAnnonce; publiee_le: string; archivee: boolean;
  profils: { nom_affiche: string } | null;
};

export async function listerAnnonces(f: { archivees?: boolean; limite?: number } = {}): Promise<Annonce[]> {
  const supabase = await creerClientServeur();
  let q = supabase.from("annonces")
    .select(`id, titre, contenu, type, publiee_le, archivee, ${COLONNES_CIBLAGE}, profils(nom_affiche)`)
    .eq("archivee", f.archivees ?? false)
    .order("publiee_le", { ascending: false });
  if (f.limite) q = q.limit(f.limite);
  const { data, error } = await q;
  if (error) throw new Error("Lecture des annonces impossible.");
  return (data as unknown as LigneAnnonce[]).map((l) => ({
    id: l.id, titre: l.titre, contenu: l.contenu, typeCode: l.type, type: TYPES_ANNONCE[l.type],
    date: l.publiee_le, archivee: l.archivee, auteur: l.profils?.nom_affiche ?? "", ciblage: versCiblage(l),
  }));
}

// ---------------------------------------------------------------------
// Présences
// ---------------------------------------------------------------------
export type Presence = { membreId: string; statutCode: CodeStatutPresence; statut: string; methode: "manuel" | "qr"; date: string };

export async function presencesActivite(activiteId: string): Promise<Presence[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("presences").select("membre_id, statut, methode, saisi_le").eq("activite_id", activiteId);
  return (data ?? []).map((p) => ({
    membreId: p.membre_id, statutCode: p.statut, statut: STATUTS_PRESENCE[p.statut as CodeStatutPresence],
    methode: p.methode, date: p.saisi_le,
  }));
}

/** Historique de présence d'un membre (le choriste ne lit que le sien). */
export async function presencesMembre(membreId: string) {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("presences")
    .select("statut, methode, activites!inner(id, titre, debut)")
    .eq("membre_id", membreId);
  type L = { statut: CodeStatutPresence; methode: string; activites: { id: string; titre: string; debut: string } };
  return ((data ?? []) as unknown as L[])
    .map((p) => ({ activiteId: p.activites.id, activite: p.activites.titre, date: p.activites.debut, statutCode: p.statut, statut: STATUTS_PRESENCE[p.statut] }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Taux de présence : part des « présent » parmi les présences saisies. */
export const taux = (lignes: { statutCode: CodeStatutPresence }[]) =>
  lignes.length ? Math.round((lignes.filter((l) => l.statutCode === "present").length / lignes.length) * 100) : null;

/** Présences saisies pour les activités d'une période (limitées par la base au périmètre). */
export async function presencesPeriode(depuis: string, avant = new Date().toISOString()) {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("presences")
    .select("statut, membre_id, activite_id, activites!inner(debut), membres!inner(paroisse_id)")
    .gte("activites.debut", depuis).lt("activites.debut", avant);
  type L = { statut: CodeStatutPresence; membre_id: string; activite_id: string; membres: { paroisse_id: string } };
  return ((data ?? []) as unknown as L[]).map((p) => ({
    statutCode: p.statut, membreId: p.membre_id, activiteId: p.activite_id, paroisseId: p.membres.paroisse_id,
  }));
}
