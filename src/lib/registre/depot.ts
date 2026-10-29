import { creerClientServeur } from "@/lib/supabase/server";
import type { CodeStatutPresence } from "@/lib/programmes/libelles";
import { trierHoraires, type CodeTypeSeance, type Horaire } from "./libelles";

/** Jours habituels d'une chorale ; null si le fichier SQL du registre n'a pas encore été exécuté. */
export async function lireHoraires(choraleId: string): Promise<Horaire[] | null> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("chorale_horaires").select("id, chorale_id, jour, type, heure").eq("chorale_id", choraleId);
  if (error) return null;
  return trierHoraires((data ?? []).map((h) => ({ id: h.id, choraleId: h.chorale_id, jour: h.jour, type: h.type as CodeTypeSeance, heure: h.heure })));
}

export type Seance = {
  id: string; jour: string; type: CodeTypeSeance; annulee: boolean;
  presents: number; absents: number; excuses: number;
};

/** Derniers registres d'une chorale, du plus récent au plus ancien. */
export async function listerSeances(choraleId: string, limite = 20): Promise<Seance[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("activites")
    .select("id, seance_jour, seance_type, statut, presences(statut)")
    .eq("seance_chorale", choraleId).order("seance_jour", { ascending: false }).limit(limite);
  type L = { id: string; seance_jour: string; seance_type: CodeTypeSeance; statut: string; presences: { statut: CodeStatutPresence }[] };
  return ((data ?? []) as unknown as L[]).map((s) => ({
    id: s.id, jour: s.seance_jour, type: s.seance_type, annulee: s.statut === "annulee",
    presents: s.presences.filter((p) => p.statut === "present").length,
    absents: s.presences.filter((p) => p.statut === "absent").length,
    excuses: s.presences.filter((p) => p.statut === "excuse").length,
  }));
}

/** La chorale et le jour d'un registre (null si l'activité n'est pas un registre). */
export async function lireSeance(id: string): Promise<{ choraleId: string; jour: string; type: CodeTypeSeance } | null> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("activites").select("seance_chorale, seance_jour, seance_type").eq("id", id).maybeSingle();
  if (!data?.seance_chorale) return null;
  return { choraleId: data.seance_chorale, jour: data.seance_jour, type: data.seance_type as CodeTypeSeance };
}
