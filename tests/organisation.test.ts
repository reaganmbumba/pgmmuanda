import { describe, expect, it } from "vitest";
import { bilan, formatMontant, formatPeriode, nuits, occupation } from "@/lib/organisation/libelles";
import { schemaAffectation, schemaChant, schemaEvaluation, schemaOperation, schemaProjet } from "@/lib/validation/organisation";
import { peutGererCommission, peutOuvrir } from "@/lib/auth/roles";

describe("montants et bilans", () => {
  it("affiche les francs sans décimales et les dollars avec deux décimales", () => {
    expect(formatMontant(150000, "CDF")).toBe("150 000 FC");
    expect(formatMontant(25.5, "USD")).toBe("25,50 $");
  });

  it("ne mélange jamais francs et dollars et évite les erreurs d'arrondi", () => {
    const b = bilan([
      { sens: "recette", montant: 0.1, devise: "USD" },
      { sens: "recette", montant: 0.2, devise: "USD" },
      { sens: "depense", montant: 100000, devise: "CDF" },
      { sens: "recette", montant: 30000, devise: "CDF" },
    ]);
    expect(b.USD).toEqual({ recettes: 0.3, depenses: 0, solde: 0.3 });
    expect(b.CDF).toEqual({ recettes: 30000, depenses: 100000, solde: -70000 });
  });
});

describe("hébergement", () => {
  const sejours = [{ du: "2026-12-20", au: "2026-12-24" }, { du: "2026-12-24", au: "2026-12-26" }];
  it("compte les occupants d'un jour, arrivée et départ compris", () => {
    expect(occupation(sejours, "2026-12-19")).toBe(0);
    expect(occupation(sejours, "2026-12-20")).toBe(1);
    expect(occupation(sejours, "2026-12-24")).toBe(2);
    expect(occupation(sejours, "2026-12-26")).toBe(1);
  });
  it("décrit la période simplement", () => {
    expect(nuits("2026-12-20", "2026-12-23")).toBe(3);
    expect(formatPeriode("2026-12-20", "2026-12-23")).toBe("du 20 déc. au 23 décembre 2026");
    expect(formatPeriode("2026-12-20", "2026-12-20")).toBe("20 décembre 2026");
  });
  it("refuse un départ avant l'arrivée", () => {
    const r = schemaAffectation.safeParse({ chambreId: crypto.randomUUID(), membreId: crypto.randomUUID(), du: "2026-12-20", au: "2026-12-19", notes: "" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/départ/);
  });
});

describe("validation", () => {
  const op = { sens: "depense", libelle: "Transport", categorie: "Transport", devise: "CDF", dateOperation: "2026-10-20", projetId: "", piece: "" };
  it("lit un montant saisi à la française", () => {
    expect(schemaOperation.parse({ ...op, montant: "150 000" }).montant).toBe(150000);
    expect(schemaOperation.parse({ ...op, montant: "12,50" }).montant).toBe(12.5);
    expect(schemaOperation.parse({ ...op, montant: "1" }).projetId).toBeNull();
  });
  it("refuse un montant nul, négatif ou illisible", () => {
    for (const montant of ["0", "-5", "abc", ""]) expect(schemaOperation.safeParse({ ...op, montant }).success).toBe(false);
  });
  it("garde la note entre 0 et 20", () => {
    expect(schemaEvaluation.parse({ statut: "valide", note: "14,5", appreciation: "" }).note).toBe(14.5);
    expect(schemaEvaluation.parse({ statut: "inscrit", note: "", appreciation: "" }).note).toBeNull();
    expect(schemaEvaluation.safeParse({ statut: "valide", note: "21", appreciation: "" }).success).toBe(false);
  });
  it("refuse une fin de projet avant le début", () => {
    const p = { titre: "Projet", description: "", commissionId: "", responsable: "", budgetCdf: "0", budgetUsd: "0", statut: "planifie" };
    expect(schemaProjet.safeParse({ ...p, debut: "2026-12-01", finPrevue: "2026-11-01" }).success).toBe(false);
    expect(schemaProjet.parse({ ...p, debut: "", finPrevue: "" }).debut).toBeNull();
  });
  it("n'accepte que des liens https pour les partitions", () => {
    const c = { titre: "Chant", auteur: "", langue: "Lingala", categorie: "", paroles: "", lienAudio: "" };
    expect(schemaChant.safeParse({ ...c, lienPartition: "javascript:alert(1)" }).success).toBe(false);
    expect(schemaChant.safeParse({ ...c, lienPartition: "http://exemple.org/p.pdf" }).success).toBe(false);
    expect(schemaChant.parse({ ...c, lienPartition: "https://exemple.org/p.pdf" }).lienPartition).toBe("https://exemple.org/p.pdf");
  });
});

describe("accès aux modules de l'étape 7", () => {
  it("réserve l'hébergement à l'administration", () => {
    expect(peutOuvrir("presidence", "/staff/hebergement")).toBe(true);
    expect(peutOuvrir("responsable_paroisse", "/staff/hebergement")).toBe(false);
    expect(peutOuvrir("responsable_commission", "/staff/hebergement")).toBe(false);
  });
  it("ouvre les finances à tout le staff, les projets aux commissions", () => {
    expect(peutOuvrir("responsable_commission", "/staff/finances")).toBe(true);
    expect(peutOuvrir("responsable_paroisse", "/staff/finances")).toBe(true);
    expect(peutOuvrir("presidence", "/staff/finances")).toBe(true);
    expect(peutOuvrir("controleur", "/staff/finances")).toBe(false);
    expect(peutOuvrir("choriste", "/staff/finances")).toBe(false);
    expect(peutOuvrir("responsable_paroisse", "/staff/projets/x")).toBe(false);
    expect(peutOuvrir("controleur", "/staff/commissions")).toBe(false);
    expect(peutGererCommission("choriste")).toBe(false);
  });
});
