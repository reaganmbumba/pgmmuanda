import "server-only";
import { creerClientServeur } from "@/lib/supabase/server";
import { SEUIL_ABSENCES, TYPES_SANCTION, type CodeSanction } from "./libelles";

// La base applique les règles d'accès : sanctions pour l'administration seulement,
// absences limitées à la paroisse du responsable.

export type Sanction = {
  id: string; membreId: string; membre: string; matricule: string; typeCode: CodeSanction; type: string;
  manquement: string; details: string; dateFaits: string; decideLe: string; finSuspension: string | null; decidePar: string;
};

export async function listerSanctions(membreId?: string): Promise<Sanction[]> {
  const supabase = await creerClientServeur();
  let q = supabase.from("sanctions")
    .select("id, membre_id, type, manquement, details, date_faits, decide_le, fin_suspension, decide_par_nom, membres(prenom, nom, postnom, matricule)")
    .order("decide_le", { ascending: false }).order("cree_le", { ascending: false });
  if (membreId) q = q.eq("membre_id", membreId);
  const { data } = await q;
  type L = { id: string; membre_id: string; type: CodeSanction; manquement: string; details: string; date_faits: string; decide_le: string;
    fin_suspension: string | null; decide_par_nom: string; membres: { prenom: string; nom: string; postnom: string; matricule: string } | null };
  return ((data ?? []) as unknown as L[]).map((s) => ({
    id: s.id, membreId: s.membre_id,
    membre: s.membres ? `${s.membres.prenom} ${s.membres.nom} ${s.membres.postnom}`.trim() : "Membre",
    matricule: s.membres?.matricule ?? "",
    typeCode: s.type, type: TYPES_SANCTION[s.type], manquement: s.manquement, details: s.details,
    dateFaits: s.date_faits, decideLe: s.decide_le, finSuspension: s.fin_suspension, decidePar: s.decide_par_nom,
  }));
}

export type MembreAbsent = {
  membreId: string; nom: string; prenom: string; matricule: string; paroisse: string; telephone: string | null;
  absences: { titre: string; date: string }[];
  rappel: { le: string; par: string } | null;
};

/** Membres actifs avec au moins SEUIL_ABSENCES absences sans motif depuis `depuis`. */
export async function membresAbsents(depuis: string): Promise<MembreAbsent[]> {
  const supabase = await creerClientServeur();
  const [{ data: absences }, { data: rappels }] = await Promise.all([
    supabase.from("presences")
      .select("membre_id, activites!inner(titre, debut), membres!inner(prenom, nom, postnom, matricule, telephone, statut, archive, paroisses(nom))")
      .eq("statut", "absent").gte("activites.debut", depuis).lte("activites.debut", new Date().toISOString()),
    supabase.from("absences_rappels").select("membre_id, rappele_le, rappele_par_nom"),
  ]);
  type L = { membre_id: string; activites: { titre: string; debut: string };
    membres: { prenom: string; nom: string; postnom: string; matricule: string; telephone: string | null; statut: string; archive: boolean; paroisses: { nom: string } | null } };
  const parMembre = new Map<string, MembreAbsent>();
  for (const a of (absences ?? []) as unknown as L[]) {
    if (a.membres.statut !== "actif" || a.membres.archive) continue;
    const m = parMembre.get(a.membre_id) ?? {
      membreId: a.membre_id, nom: `${a.membres.prenom} ${a.membres.nom} ${a.membres.postnom}`.trim(), prenom: a.membres.prenom,
      matricule: a.membres.matricule, paroisse: a.membres.paroisses?.nom ?? "", telephone: a.membres.telephone, absences: [], rappel: null,
    };
    m.absences.push({ titre: a.activites.titre, date: a.activites.debut });
    parMembre.set(a.membre_id, m);
  }
  for (const r of (rappels ?? []) as { membre_id: string; rappele_le: string; rappele_par_nom: string }[]) {
    const m = parMembre.get(r.membre_id);
    if (m) m.rappel = { le: r.rappele_le, par: r.rappele_par_nom };
  }
  return [...parMembre.values()]
    .filter((m) => m.absences.length >= SEUIL_ABSENCES)
    .map((m) => ({ ...m, absences: m.absences.sort((x, y) => y.date.localeCompare(x.date)) }))
    .sort((x, y) => y.absences.length - x.absences.length || x.nom.localeCompare(y.nom, "fr"));
}
