import "server-only";
import { creerClientServeur } from "@/lib/supabase/server";
import { STATUTS_REUNION, TYPES_REUNION, type CodeFonction, type CodeStatutReunion, type CodeTypeReunion } from "./libelles";

// La base applique les règles d'accès : composition lisible par tous les membres connectés,
// réunions par le staff et les membres du Conseil, modifications par l'administration.

export type Mandat = { id: string; membreId: string; nom: string; fonction: CodeFonction; adjoint: boolean; debut: string; fin: string };

/** Composition du Conseil à une date (AAAA-MM-JJ), aujourd'hui par défaut. */
export async function conseilA(jour?: string): Promise<Mandat[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.rpc("conseil_actuel", jour ? { p_jour: jour } : {});
  type L = { mandat_id: string; membre_id: string; nom: string; fonction: CodeFonction; adjoint: boolean; debut: string; fin: string };
  return ((data ?? []) as L[]).map((m) => ({
    id: m.mandat_id, membreId: m.membre_id, nom: m.nom, fonction: m.fonction, adjoint: m.adjoint, debut: m.debut, fin: m.fin,
  }));
}

export type Reunion = {
  id: string; typeCode: CodeTypeReunion; type: string; titre: string; debut: string; lieu: string; ordreDuJour: string;
  statutCode: CodeStatutReunion; statut: string; compteRendu: string; convoquePar: string;
};

const COLONNES = "id, type, titre, debut, lieu, ordre_du_jour, statut, compte_rendu, convoque_par_nom";
type L = { id: string; type: CodeTypeReunion; titre: string; debut: string; lieu: string; ordre_du_jour: string;
  statut: CodeStatutReunion; compte_rendu: string; convoque_par_nom: string };
const versReunion = (r: L): Reunion => ({
  id: r.id, typeCode: r.type, type: TYPES_REUNION[r.type], titre: r.titre, debut: r.debut, lieu: r.lieu,
  ordreDuJour: r.ordre_du_jour, statutCode: r.statut, statut: STATUTS_REUNION[r.statut], compteRendu: r.compte_rendu,
  convoquePar: r.convoque_par_nom,
});

export async function listerReunions(): Promise<Reunion[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("reunions").select(COLONNES).order("debut", { ascending: false });
  return ((data ?? []) as L[]).map(versReunion);
}

export async function lireReunion(id: string): Promise<Reunion | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("reunions").select(COLONNES).eq("id", id).maybeSingle();
  return data ? versReunion(data as L) : null;
}

/** Feuille de présence d'une réunion : membre → statut. */
export async function presencesReunion(id: string): Promise<Map<string, string>> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("reunion_presences").select("membre_id, statut").eq("reunion_id", id);
  return new Map(((data ?? []) as { membre_id: string; statut: string }[]).map((p) => [p.membre_id, p.statut]));
}

/** Présences de chaque membre aux réunions du Conseil tenues, de la plus récente à la plus ancienne. */
export async function historiqueConseil(): Promise<Map<string, string[]>> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("reunion_presences")
    .select("membre_id, statut, reunions!inner(debut, type, statut)")
    .eq("reunions.type", "conseil").eq("reunions.statut", "tenue");
  type P = { membre_id: string; statut: string; reunions: { debut: string } };
  const parMembre = new Map<string, { debut: string; statut: string }[]>();
  for (const p of (data ?? []) as unknown as P[]) {
    parMembre.set(p.membre_id, [...(parMembre.get(p.membre_id) ?? []), { debut: p.reunions.debut, statut: p.statut }]);
  }
  return new Map([...parMembre].map(([m, l]) => [m, l.sort((a, b) => b.debut.localeCompare(a.debut)).map((x) => x.statut)]));
}
