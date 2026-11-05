import { describe, expect, it } from "vitest";
import { construireRapport, texteRapport } from "@/lib/rapports/inscrits";

const p = (nom: string, prenom: string, chorale: string, voix = "") => ({ nom, postnom: "", prenom, chorale, voix });

describe("rapport des inscrits par chorale", () => {
  const r = construireRapport(
    [p("Nkasa", "Joel", "Oracle Homme", "Basse"), p("Bayiza", "Blaise", "Oracle Homme", "Alto"), p("Muaka", "Lajoie", "Vision Femme"), p("Mbumba", "Reagan", "")],
    ["Oracle Homme", "Oracle Junior (Filles et Garçons)", "Vision Femme", "Echo Homme"],
    1,
  );
  it("regroupe, trie et compte par chorale et par famille", () => {
    expect(r.groupes.map((g) => [g.chorale, g.inscrits.length])).toEqual([["Oracle Homme", 2], ["Vision Femme", 1]]);
    expect(r.groupes[0].inscrits[0].nom).toBe("Bayiza");
    expect(r.vides).toEqual(["Echo Homme", "Oracle Junior (Filles et Garçons)"]);
    expect(r.familles).toEqual([{ nom: "Echo", total: 0 }, { nom: "Oracle", total: 2 }, { nom: "Vision", total: 1 }]);
    expect(r.total).toBe(3);
  });
  it("écrit un texte prêt pour WhatsApp", () => {
    const t = texteRapport(r, "5 novembre 2026", "https://www.pgmmuanda.com/inscription/abc");
    expect(t.startsWith("Paix à tous,")).toBe(true);
    expect(t).toContain("*ORACLE HOMME* — 2 inscrits\n1. BAYIZA Blaise (alto)\n2. NKASA Joel (basse)");
    expect(t).toContain("*VISION FEMME* — 1 inscrite");
    expect(t).toContain("Echo Homme, Oracle Junior.");
    expect(t).not.toContain("MBUMBA");
    expect(t).not.toContain("Encadrement");
    expect(t).toContain("*TOTAL GÉNÉRAL : 3 inscrits*");
    expect(t).toContain("avec ce lien :\nhttps://www.pgmmuanda.com/inscription/abc");
    expect(t).toContain("1 inscription par lien en attente");
  });
});
