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
          } else if (q.type === "chant") {
            expect(niveau.chant).toBe(true);
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

import { chanteJuste, detecterFrequence, doDe, ecartAvec, lireReglages, noteChantee } from "@/lib/solfa/hauteur";
import { ecrireSolfa, transcrire, type Mesure } from "@/lib/solfa/transcrire";

/** Un son de voix simulé : fondamentale + harmoniques. */
function voix(hz: number, sr = 48000, n = 2048) {
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    b[i] = 0.4 * Math.sin(2 * Math.PI * hz * t) + 0.2 * Math.sin(2 * Math.PI * 2 * hz * t) + 0.1 * Math.sin(2 * Math.PI * 3 * hz * t);
  }
  return b;
}

describe("reconnaître la note chantée", () => {
  it("mesure la hauteur d'une voix de femme et d'homme", () => {
    for (const hz of [110, 146.83, 261.63, 329.63, 523.25]) {
      expect(detecterFrequence(voix(hz), 48000)!).toBeCloseTo(hz, 0);
    }
    expect(detecterFrequence(new Float32Array(2048), 48000)).toBeNull();
  });

  it("traduit la hauteur en sol-fa selon le Do choisi", () => {
    const femme = doDe({ voix: "femme", ton: 0 });
    expect(noteChantee(329.63, femme).texte).toBe("m");
    expect(noteChantee(196, femme).texte).toBe("s₁");
    expect(noteChantee(523.25, femme).texte).toBe("d¹");
    expect(noteChantee(277.18, femme).texte).toBe("de");
    // Un homme qui chante Mi une octave plus bas : c'est aussi « m » pour lui.
    expect(noteChantee(164.81, doDe({ voix: "homme", ton: 0 })).texte).toBe("m");
    // En Sol : le Do (d) est sur Sol.
    expect(noteChantee(196, doDe({ voix: "femme", ton: -5 })).texte).toBe("d");
    expect(noteChantee(335, femme).cents).toBeGreaterThan(20);
  });

  it("juge la note chantée, quelle que soit l'octave", () => {
    const femme = doDe({ voix: "femme", ton: 0 });
    expect(chanteJuste(noteChantee(392, femme), "s")).toBe(true);
    expect(chanteJuste(noteChantee(196, femme), "s")).toBe(true);
    expect(ecartAvec(noteChantee(349.23, femme), "s")).toBeLessThan(0); // Fa au lieu de Sol : trop bas
    expect(lireReglages("{\"voix\":\"homme\",\"ton\":99}")).toEqual({ voix: "homme", ton: 0 });
  });
});

/** Mesures simulées : [demi-tons ou null, durée en ms], une mesure toutes les 40 ms. */
function chanter(parties: [number | null, number][]): Mesure[] {
  const res: Mesure[] = [];
  let t = 0;
  for (const [d, ms] of parties) {
    for (let k = 0; k < ms / 40; k++) { res.push({ t, demiTons: d === null ? null : d + (k % 3 === 0 ? 0.1 : -0.1) }); t += 40; }
  }
  return res;
}

describe("transcrire une mélodie chantée", () => {
  it("écrit les notes et le rythme en sol-fa", () => {
    // d r m (un temps chacun), puis s tenu deux temps
    const r = transcrire(chanter([[null, 300], [0, 600], [2, 600], [4, 600], [7, 1200], [null, 400]]));
    expect(r.solfa).toBe("d : r : m : s | - ||");
  });

  it("comprend les demi-temps, les silences et les petites respirations", () => {
    const r = transcrire(chanter([[0, 600], [null, 120], [0, 600], [4, 300], [2, 300], [0, 600], [null, 600], [-5, 600]]));
    expect(r.solfa).toBe("d : d : m.r : d |   : s₁ ||");
  });

  it("ignore les petits accidents de la voix", () => {
    const mesures = chanter([[0, 600], [4, 600]]);
    mesures[5].demiTons = 12; // un saut d'octave sur une seule mesure
    expect(transcrire(mesures).solfa).toBe("d : m ||");
    expect(ecrireSolfa([{ demiTons: 0, demiTemps: 3 }, { demiTons: 2, demiTemps: 1 }], 2)).toBe("d : -.r ||");
  });
});

import { COURS } from "@/lib/solfa/cours";
import { lireNote, lireRythme, notesInconnues } from "@/lib/solfa/rythme";

describe("le rythme en sol-fa", () => {
  const duree = (l: string) => lireRythme(l).map((e) => [e.demiTons, e.temps]);

  it("lit les temps, les demi-temps, les quarts et le temps pointé", () => {
    expect(duree(": d : r : m :")).toEqual([[0, 1], [2, 1], [4, 1]]);
    expect(duree(": d : - : r . m :")).toEqual([[0, 2], [2, 0.5], [4, 0.5]]);
    expect(duree(": d .,r :")).toEqual([[0, 0.75], [2, 0.25]]);
    expect(duree(": d . r ,m : d ,r . m : d ,r . m ,f :")).toEqual([
      [0, 0.5], [2, 0.25], [4, 0.25], [0, 0.25], [2, 0.25], [4, 0.5], [0, 0.25], [2, 0.25], [4, 0.25], [5, 0.25],
    ]);
    expect(duree(": - . r : s :")).toEqual([[null, 0.5], [2, 0.5], [7, 1]]);
  });

  it("lit les silences, les mesures et les octaves", () => {
    expect(duree(": d :   : . d : d . :")).toEqual([[0, 1], [null, 1.5], [0, 0.5], [0, 0.5], [null, 0.5]]);
    expect(duree(": d : r | m : - ||")).toEqual([[0, 1], [2, 1], [4, 2]]);
    expect([lireNote("s₁"), lireNote("d¹"), lireNote("d'"), lireNote("fe"), lireNote("x")]).toEqual([-5, 12, 12, 6, null]);
  });

  it("toutes les lignes du cours se lisent sans erreur", () => {
    for (const l of COURS) {
      for (const ligne of [...l.exemples, ...l.exercices]) {
        expect(notesInconnues(ligne.solfa), ligne.solfa).toEqual([]);
        expect(lireRythme(ligne.solfa).length).toBeGreaterThan(0);
      }
      if (l.niveauJeu) expect(NIVEAUX.some((n) => n.titre === l.niveauJeu), l.niveauJeu).toBe(true);
    }
  });

  it("les niveaux de rythme proposent des écritures qui sonnent différemment", () => {
    for (const niveau of NIVEAUX.filter((n) => n.rythme)) {
      for (let s = 1; s <= 20; s++) {
        const q = niveau.fabriquer(graine(s * 13));
        if (q.type !== "choix" || !q.rythme) throw new Error("question de rythme attendue");
        expect(q.choix[q.bonne].texte).toBe(q.rythme);
        const sons = new Set(q.choix.map((c) => JSON.stringify(lireRythme(c.texte))));
        expect(sons.size).toBe(q.choix.length);
      }
    }
  });
});
