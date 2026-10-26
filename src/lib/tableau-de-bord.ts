import "server-only";
import { dernieresVerifications } from "@/lib/cartes/depot";
import { lireDemandes } from "@/lib/membres/depot";
import { listerActivites, listerAnnonces, presencesPeriode, taux } from "@/lib/programmes/depot";
import { dansJours } from "@/lib/programmes/libelles";
import { STATUTS, VOIX, type CodeStatut, type CodeVoix } from "@/lib/membres/libelles";
import { creerClientServeur } from "@/lib/supabase/server";

/** Chiffres du tableau de bord, limités par la base au périmètre de l'utilisateur. */
export async function chiffresTableauDeBord() {
  const supabase = await creerClientServeur();
  const il_y_a_30_jours = new Date(Date.now() - 30 * 86400_000).toISOString();
  const [{ data: membres }, { count: cartesActives }, { data: attente }, demandes, controles, activites, annonces, presences] = await Promise.all([
    supabase.from("membres").select("statut, voix, cree_le, paroisses(nom)").eq("archive", false),
    supabase.from("cartes").select("id", { count: "exact", head: true }).eq("statut", "active"),
    supabase.from("membres").select("id, prenom, nom, postnom, matricule, paroisses(nom)")
      .eq("archive", false).eq("statut", "en_attente").order("cree_le", { ascending: false }).limit(6),
    lireDemandes({ enAttente: true }),
    dernieresVerifications(),
    listerActivites({ depuis: dansJours(-0.5), limite: 5 }),
    listerAnnonces({ limite: 3 }),
    presencesPeriode(dansJours(-30)),
  ]);
  type L = { statut: CodeStatut; voix: CodeVoix | null; cree_le: string; paroisses: { nom: string } | null };
  const lignes = (membres ?? []) as unknown as L[];
  const compter = <K extends string>(cle: (l: L) => K) =>
    lignes.reduce((acc, l) => acc.set(cle(l), (acc.get(cle(l)) ?? 0) + 1), new Map<K, number>());

  const parStatut = compter((l) => l.statut);
  const parVoix = compter((l) => (l.voix ?? "inconnue") as CodeVoix | "inconnue");
  const parParoisse = [...compter((l) => l.paroisses?.nom ?? "—").entries()]
    .map(([nom, total]) => ({ nom, total }))
    .sort((a, b) => b.total - a.total);

  return {
    total: lignes.length,
    statuts: (Object.keys(STATUTS) as CodeStatut[]).map((s) => ({ code: s, libelle: STATUTS[s], total: parStatut.get(s) ?? 0 })),
    voix: (Object.keys(VOIX) as CodeVoix[]).map((v): { libelle: string; total: number } => ({ libelle: VOIX[v], total: parVoix.get(v) ?? 0 }))
      .concat(parVoix.get("inconnue") ? [{ libelle: "Non précisée", total: parVoix.get("inconnue")! }] : []),
    parParoisse,
    nouveaux30j: lignes.filter((l) => l.cree_le >= il_y_a_30_jours).length,
    cartesActives: cartesActives ?? 0,
    enAttente: ((attente ?? []) as unknown as { id: string; prenom: string; nom: string; postnom: string; matricule: string; paroisses: { nom: string } | null }[])
      .map((m) => ({ id: m.id, prenom: m.prenom, nom: m.nom, postnom: m.postnom, matricule: m.matricule, paroisse: m.paroisses?.nom ?? "" })),
    demandes,
    controles: controles.slice(0, 6),
    activites,
    annonces,
    tauxPresence: taux(presences),
  };
}
