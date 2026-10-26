import { describe, expect, it } from "vitest";
import { concerne, depuisSaisieLocale, jourLocal, lienWhatsApp, versSaisieLocale, type Ciblage } from "@/lib/programmes/libelles";
import { lireCiblage, schemaActivite } from "@/lib/validation/programmes";

const P1 = "10000000-0000-4000-8000-000000000001";
const P2 = "10000000-0000-4000-8000-000000000002";
const C1 = "20000000-0000-4000-8000-000000000001";
const tenorP1 = { paroisseId: P1, choraleId: C1, voixCode: "tenor" as const };
const basseP2 = { paroisseId: P2, choraleId: null, voixCode: "basse" as const };
const ciblage = (c: Partial<Ciblage>): Ciblage => ({ portee: null, pourTous: false, paroisses: [], chorales: [], voix: [], ...c });

describe("ciblage (même règle que la base)", () => {
  it("« tous » concerne tout le monde dans la portée", () => {
    expect(concerne(ciblage({ pourTous: true }), basseP2)).toBe(true);
    expect(concerne(ciblage({ pourTous: true, portee: P1 }), basseP2)).toBe(false);
    expect(concerne(ciblage({ pourTous: true, portee: P1 }), tenorP1)).toBe(true);
  });
  it("une cible suffit : paroisse, chorale ou voix", () => {
    expect(concerne(ciblage({ voix: ["basse"] }), basseP2)).toBe(true);
    expect(concerne(ciblage({ voix: ["basse"] }), tenorP1)).toBe(false);
    expect(concerne(ciblage({ chorales: [C1] }), tenorP1)).toBe(true);
    expect(concerne(ciblage({ paroisses: [P2], voix: ["tenor"] }), tenorP1)).toBe(true);
  });
  it("un membre sans chorale ni voix n'est pas visé par ces cibles", () => {
    expect(concerne(ciblage({ chorales: [C1], voix: ["alto"] }), { paroisseId: P1, choraleId: null, voixCode: null })).toBe(false);
  });
});

describe("heure de Muanda (UTC+1)", () => {
  it("convertit la saisie locale en instant et inversement", () => {
    const iso = depuisSaisieLocale("2026-11-02T16:00");
    expect(new Date(iso).toISOString()).toBe("2026-11-02T15:00:00.000Z");
    expect(versSaisieLocale("2026-11-02T15:00:00.000Z")).toBe("2026-11-02T16:00");
  });
  it("une activité à 23 h 30 à Muanda reste le même jour", () => {
    expect(jourLocal("2026-11-02T22:30:00Z")).toBe("2026-11-02");
    expect(jourLocal("2026-11-02T23:30:00Z")).toBe("2026-11-03");
  });
});

describe("formulaires", () => {
  const form = (champs: [string, string][]) => { const f = new FormData(); champs.forEach(([k, v]) => f.append(k, v)); return f; };
  it("lit les cibles cochées", () => {
    expect(lireCiblage(form([["portee", ""], ["ciblage", "cibles"], ["cibleVoix", "basse"], ["cibleVoix", "alto"]])))
      .toEqual({ portee: null, pourTous: false, paroisses: [], chorales: [], voix: ["basse", "alto"] });
  });
  it("ignore les cases cochées quand « tous les membres » est choisi", () => {
    expect(lireCiblage(form([["portee", P1], ["ciblage", "tous"], ["cibleVoix", "basse"]])))
      .toEqual({ portee: P1, pourTous: true, paroisses: [], chorales: [], voix: [] });
  });
  it("refuse un ciblage vide ou falsifié", () => {
    expect(typeof lireCiblage(form([["ciblage", "cibles"]]))).toBe("string");
    expect(typeof lireCiblage(form([["ciblage", "cibles"], ["cibleVoix", "baryton"]]))).toBe("string");
    expect(typeof lireCiblage(form([["portee", "'; drop table"], ["ciblage", "tous"]]))).toBe("string");
  });
  it("refuse une fin avant le début", () => {
    const base = { titre: "Répétition", description: "", lieu: "", responsable: "", commissionId: "", statut: "prevue" };
    expect(schemaActivite.safeParse({ ...base, debut: "2026-11-02T16:00", fin: "2026-11-02T18:00" }).success).toBe(true);
    expect(schemaActivite.safeParse({ ...base, debut: "2026-11-02T16:00", fin: "2026-11-02T15:00" }).success).toBe(false);
  });
});

it("le lien WhatsApp ne fait que préremplir un message", () => {
  expect(lienWhatsApp("Répétition à 16 h & tenue blanche")).toBe("https://wa.me/?text=R%C3%A9p%C3%A9tition%20%C3%A0%2016%20h%20%26%20tenue%20blanche");
});
