import { describe, expect, it } from "vitest";
import { peutOuvrir } from "@/lib/auth/roles";
import {
  absencesConsecutives, finMandat, libelleFonction, messageConvocation, quorumAtteint, SIEGES_CONSEIL,
} from "@/lib/conseil/libelles";
import { schemaMandat, schemaReunion } from "@/lib/validation/organisation";

describe("Conseil et réunions", () => {
  it("compte 11 fonctions, chacune avec un adjoint sauf le Président (art. 28)", () => {
    expect(SIEGES_CONSEIL).toBe(21);
    expect(libelleFonction("secretaire", true)).toBe("Secrétaire adjoint");
    expect(libelleFonction("finances", true)).toBe("Adjoint du conseiller chargé des Finances");
  });

  it("donne un mandat de 4 ans (art. 29)", () => {
    expect(finMandat("2026-10-29")).toBe("2030-10-29");
    expect(finMandat("2028-02-29")).toBe("2032-02-29");
    expect(finMandat("2024-02-29")).toBe("2028-02-29");
    expect(finMandat("2027-03-01")).toBe("2031-03-01");
  });

  it("calcule le quorum de la moitié (art. 30)", () => {
    expect(quorumAtteint(5, 10)).toBe(true);
    expect(quorumAtteint(4, 10)).toBe(false);
    expect(quorumAtteint(0, 0)).toBe(false);
  });

  it("repère trois absences sans motif de suite (art. 31)", () => {
    expect(absencesConsecutives(["absent", "absent", "absent", "present"])).toBe(3);
    expect(absencesConsecutives(["absent", "excuse", "absent", "absent"])).toBe(1);
    expect(absencesConsecutives([])).toBe(0);
  });

  it("prépare la convocation pour WhatsApp", () => {
    const m = messageConvocation({ typeCode: "ag_ordinaire", titre: "AG 2026", debut: "2026-12-05T09:00:00+01:00", lieu: "Temple", ordreDuJour: "1. Bilan" });
    expect(m).toContain("Assemblée générale ordinaire");
    expect(m).toContain("1. Bilan");
    expect(m).toContain("art. 21");
  });

  it("vérifie les formulaires", () => {
    expect(schemaMandat.safeParse({ membreId: crypto.randomUUID(), fonction: "president", adjoint: "on", debut: "2026-10-29" }).success).toBe(false);
    expect(schemaMandat.safeParse({ membreId: crypto.randomUUID(), fonction: "caisse", debut: "2026-10-29" }).data?.adjoint).toBe(false);
    const r = schemaReunion.safeParse({ type: "conseil", titre: "Conseil", debut: "2026-11-02T16:00", lieu: "", ordreDuJour: "" });
    expect(r.success).toBe(false);
    expect(schemaReunion.safeParse({ type: "conseil", titre: "Conseil", debut: "2026-11-02T16:00", lieu: "", ordreDuJour: "1. Budget" }).data?.debut)
      .toBe("2026-11-02T16:00:00+01:00");
  });

  it("ouvre les pages au staff, pas au contrôleur", () => {
    expect(peutOuvrir("responsable_paroisse", "/staff/conseil")).toBe(true);
    expect(peutOuvrir("responsable_commission", "/staff/reunions/x")).toBe(true);
    expect(peutOuvrir("controleur", "/staff/reunions")).toBe(false);
    expect(peutOuvrir("choriste", "/choriste/reunions")).toBe(true);
  });
});

describe("Président de l'antenne", () => {
  it("ouvre toutes les pages du staff, sans être administrateur", async () => {
    const { estAdmin, niveauDe, peutOuvrir, voitTout } = await import("@/lib/auth/roles");
    expect(peutOuvrir("president_antenne", "/staff/finances")).toBe(true);
    expect(peutOuvrir("president_antenne", "/staff/utilisateurs")).toBe(true);
    expect(peutOuvrir("president_antenne", "/choriste")).toBe(false);
    expect(estAdmin("president_antenne")).toBe(false);
    expect(voitTout("president_antenne")).toBe(true);
    expect(niveauDe("president_antenne")).toBe("admin");
    expect(niveauDe("controleur")).toBe("staff");
  });
});
