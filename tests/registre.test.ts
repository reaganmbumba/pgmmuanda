import { describe, expect, it } from "vitest";
import { aujourdhuiMuanda, jourIso, libelleHeure, libelleJour, trierHoraires, typePropose } from "@/lib/registre/libelles";

const habituels = [
  { jour: 7, type: "culte" as const, heure: "08:00:00" },
  { jour: 1, type: "repetition" as const, heure: "17:00:00" },
  { jour: 4, type: "repetition" as const, heure: "17:00:00" },
];

describe("registre de présence", () => {
  it("donne le jour de la semaine (1 = lundi, 7 = dimanche)", () => {
    expect(jourIso("2026-10-26")).toBe(1);
    expect(jourIso("2026-10-29")).toBe(4);
    expect(jourIso("2026-11-01")).toBe(7);
  });
  it("propose la séance habituelle du jour, sinon une répétition", () => {
    expect(typePropose(habituels, "2026-11-01")).toBe("culte");
    expect(typePropose(habituels, "2026-10-26")).toBe("repetition");
    expect(typePropose(habituels, "2026-10-28")).toBe("repetition"); // mercredi : jour inhabituel
  });
  it("écrit la date et l'heure simplement", () => {
    expect(libelleJour("2026-10-26")).toBe("Lundi 26 octobre 2026");
    expect(libelleHeure("17:00:00")).toBe("17 h 00");
    expect(trierHoraires(habituels).map((h) => h.jour)).toEqual([1, 4, 7]);
  });
  it("prend la date de Muanda (UTC+1)", () => {
    expect(aujourdhuiMuanda(new Date("2026-10-26T23:30:00Z"))).toBe("2026-10-27");
  });
});
