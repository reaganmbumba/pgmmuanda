import { describe, expect, it } from "vitest";
import { construireReleve, parAnnee, type Versement } from "@/lib/cotisations/releve";

const v = (id: string, mois: string, payeLe: string, montant = 5000, devise: "CDF" | "USD" = "CDF"): Versement =>
  ({ id, mois, payeLe, montant, devise, saisiPar: "Trésorerie" });

describe("relevé des cotisations", () => {
  it("liste les versements du plus récent au plus ancien avec le total cumulé", () => {
    const r = construireReleve([v("a", "2026-09-01", "2026-09-28"), v("b", "2026-10-01", "2026-10-05"), v("c", "2026-08-01", "2026-08-02")]);
    expect(r.lignes.map((l) => l.id)).toEqual(["b", "a", "c"]);
    expect(r.lignes.map((l) => l.cumul)).toEqual([15000, 10000, 5000]);
    expect(r.lignes[0].motif).toBe("Cotisation de octobre 2026");
    expect(r.totaux).toEqual([{ devise: "CDF", montant: 15000 }]);
    expect(r.premier).toBe("2026-08-02");
    expect(r.dernier).toBe("2026-10-05");
  });

  it("n'additionne jamais les francs et les dollars", () => {
    const r = construireReleve([v("a", "2026-09-01", "2026-09-01"), v("b", "2026-10-01", "2026-10-01", 3, "USD"), v("c", "2026-11-01", "2026-11-01")]);
    expect(r.totaux).toEqual([{ devise: "CDF", montant: 10000 }, { devise: "USD", montant: 3 }]);
    expect(r.lignes.find((l) => l.id === "b")!.cumul).toBe(3);
  });

  it("gère un relevé vide", () => {
    expect(construireReleve([])).toEqual({ lignes: [], totaux: [], premier: null, dernier: null });
  });

  it("regroupe par année de paiement", () => {
    const r = construireReleve([v("a", "2025-12-01", "2025-12-07"), v("b", "2026-01-01", "2026-01-11")]);
    expect(parAnnee(r.lignes).map((g) => [g.annee, g.lignes.length])).toEqual([["2026", 1], ["2025", 1]]);
  });
});
