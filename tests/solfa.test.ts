import { describe, expect, it } from "vitest";
import {
  ECHELLE, NIVEAUX, QUESTIONS_PAR_PARTIE, dicteeJuste, enregistrerPartie, etoiles, frequence,
  lireProgression, niveauOuvert, note, preparerPartie, progressionVide, rang,
} from "@/lib/solfa/jeu";

/** Hasard reproductible pour les tests. */
function graine(n: number) {
  let x = n;
  return () => { x = (x * 1103515245 + 12345) % 2 ** 31; return x / 2 ** 31; };
}

describe("jeu du sol-fa", () => {
  it("les notes ont les bonnes hauteurs (Do mobile)", () => {
    expect(ECHELLE.map((n) => note(n).texte).join(" ")).toBe("d r m f s l t d¹");
    expect(frequence("d")).toBeCloseTo(261.63);
    expect(frequence("d1")).toBeCloseTo(523.26, 1);
    expect(frequence("s1")).toBeLessThan(frequence("d"));
  });

  it("chaque niveau fabrique 10 questions valides", () => {
    for (const niveau of NIVEAUX) {
      for (let s = 1; s <= 30; s++) {
        const partie = preparerPartie(niveau, graine(s * 7 + niveau.numero));
        expect(partie).toHaveLength(QUESTIONS_PAR_PARTIE);
        for (const q of partie) {
          if (q.type === "choix") {
            expect(q.bonne).toBeGreaterThanOrEqual(0);
            expect(q.bonne).toBeLessThan(q.choix.length);
            expect(new Set(q.choix.map((c) => c.texte)).size).toBe(q.choix.length);
          } else {
            expect(q.sons).toHaveLength(3);
            for (const n of q.sons) expect(q.touches).toContain(n);
          }
        }
      }
    }
  });

  it("niveau 1 : la bonne réponse suit vraiment l'ordre de l'échelle", () => {
    const q = NIVEAUX[0].fabriquer(graine(3));
    if (q.type !== "choix") throw new Error("type");
    const [a, b] = q.sonReponse!;
    expect(ECHELLE.indexOf(b) - ECHELLE.indexOf(a)).toBe(1);
  });

  it("étoiles, ouverture des niveaux et points", () => {
    expect([5, 6, 8, 10].map(etoiles)).toEqual([0, 1, 2, 3]);
    let p = progressionVide();
    expect(niveauOuvert(p, 1)).toBe(true);
    expect(niveauOuvert(p, 2)).toBe(false);
    p = enregistrerPartie(p, 1, 5);
    expect(niveauOuvert(p, 2)).toBe(false);
    p = enregistrerPartie(p, 1, 7);
    p = enregistrerPartie(p, 1, 4);
    expect(p.meilleurs[1]).toBe(7);
    expect(p.points).toBe(160);
    expect(p.parties).toBe(3);
    expect(niveauOuvert(p, 2)).toBe(true);
    expect(rang(160).titre).toBe("Apprenti du sol-fa");
  });

  it("dictée et lecture d'une progression abîmée", () => {
    expect(dicteeJuste(["d", "m", "s"], ["d", "m", "s"])).toBe(true);
    expect(dicteeJuste(["d", "m", "s"], ["d", "s", "m"])).toBe(false);
    expect(lireProgression("pas du json")).toEqual(progressionVide());
    expect(lireProgression('{"meilleurs":{"1":99,"x":3},"points":-4}')).toEqual({ meilleurs: { 1: 10 }, points: 0, parties: 0 });
  });
});
