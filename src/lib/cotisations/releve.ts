import type { Devise } from "@/lib/organisation/libelles";
import { libelleMois } from "./mois";

export type Versement = { id: string; mois: string; montant: number; devise: Devise; payeLe: string; saisiPar: string };

export type LigneReleve = Versement & {
  /** « Cotisation de octobre 2026 ». */
  motif: string;
  /** Total versé dans cette monnaie jusqu'à ce versement inclus (comme le solde d'un relevé de banque). */
  cumul: number;
};

export type Releve = {
  /** Versements du plus récent au plus ancien. */
  lignes: LigneReleve[];
  /** Total versé par monnaie : les francs et les dollars ne sont jamais additionnés ensemble. */
  totaux: { devise: Devise; montant: number }[];
  premier: string | null;
  dernier: string | null;
};

/** Relevé des cotisations d'un membre, présenté comme un relevé de banque. */
export function construireReleve(versements: Versement[]): Releve {
  const chrono = [...versements].sort((a, b) =>
    a.payeLe.localeCompare(b.payeLe) || a.mois.localeCompare(b.mois) || a.id.localeCompare(b.id));
  const cumuls = new Map<Devise, number>();
  const lignes = chrono.map((v) => {
    const cumul = (cumuls.get(v.devise) ?? 0) + v.montant;
    cumuls.set(v.devise, cumul);
    return { ...v, motif: `Cotisation de ${libelleMois(v.mois)}`, cumul };
  });
  return {
    lignes: lignes.reverse(),
    totaux: (["CDF", "USD"] as Devise[]).filter((d) => cumuls.has(d)).map((devise) => ({ devise, montant: cumuls.get(devise)! })),
    premier: chrono[0]?.payeLe ?? null,
    dernier: chrono.at(-1)?.payeLe ?? null,
  };
}

/** Regroupe les lignes par année de paiement (« 2026 »), dans l'ordre reçu. */
export function parAnnee<T extends { payeLe: string }>(lignes: T[]): { annee: string; lignes: T[] }[] {
  const groupes: { annee: string; lignes: T[] }[] = [];
  for (const l of lignes) {
    const annee = l.payeLe.slice(0, 4);
    if (groupes.at(-1)?.annee !== annee) groupes.push({ annee, lignes: [] });
    groupes.at(-1)!.lignes.push(l);
  }
  return groupes;
}
