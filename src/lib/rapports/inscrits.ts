/** Rapport des inscrits par chorale, prêt à copier-coller sur WhatsApp. */

export type Inscrit = { nom: string; postnom: string; prenom: string; chorale: string; voix: string };

export type GroupeChorale = { chorale: string; inscrits: Inscrit[] };

export type RapportInscrits = {
  groupes: GroupeChorale[];
  /** Sans chorale (administration) : ni listés ni comptés dans le texte. */
  sansChorale: Inscrit[];
  vides: string[];
  /** Total par famille de chorales (Alliance, CHOPDI, Echo, Oracle, Vision…). */
  familles: { nom: string; total: number }[];
  enAttente: number;
  total: number;
};

/** Signature du rapport (demande de la Présidence, 2026-11-05). */
export const SIGNATAIRE = "Prédicateur NKASA LUSALA Joel";

const nomAffiche = (i: Inscrit) =>
  [i.nom.toUpperCase(), i.postnom.toUpperCase(), i.prenom].filter(Boolean).join(" ");

/** « Oracle Junior (Filles et Garçons) » → « Oracle Junior », pour un texte plus court. */
const nomCourt = (c: string) => c.replace(/\s*\(.*\)\s*$/, "");
const famille = (c: string) => c.split(/\s+/)[0] ?? c;
const trier = (a: Inscrit, b: Inscrit) => nomAffiche(a).localeCompare(nomAffiche(b), "fr");

export function construireRapport(inscrits: Inscrit[], chorales: string[], enAttente = 0): RapportInscrits {
  const parChorale = new Map<string, Inscrit[]>();
  const sansChorale: Inscrit[] = [];
  for (const i of inscrits) {
    if (!i.chorale) sansChorale.push(i);
    else parChorale.set(i.chorale, [...(parChorale.get(i.chorale) ?? []), i]);
  }
  const toutes = [...new Set([...chorales, ...parChorale.keys()])].sort((a, b) => a.localeCompare(b, "fr"));
  const groupes = toutes.filter((c) => parChorale.has(c)).map((c) => ({ chorale: c, inscrits: parChorale.get(c)!.sort(trier) }));
  const vides = toutes.filter((c) => !parChorale.has(c));
  const totaux = new Map<string, number>();
  for (const c of toutes) totaux.set(famille(c), (totaux.get(famille(c)) ?? 0) + (parChorale.get(c)?.length ?? 0));
  return {
    groupes,
    sansChorale: sansChorale.sort(trier),
    vides,
    familles: [...totaux].map(([nom, total]) => ({ nom, total })),
    enAttente,
    total: inscrits.length - sansChorale.length,
  };
}

const pluriel = (n: number, f = false) => `${n} inscrit${f ? "e" : ""}${n > 1 ? "s" : ""}`;

/** Le lien d'inscription, s'il est ouvert, est ajouté à la fin. */
export function texteRapport(r: RapportInscrits, date: string, lienInscription?: string | null): string {
  const l: string[] = ["Paix à tous,", "", "*PGM ANTENNE DE MUANDA — EBNM KCC*", "*Rapport des inscrits par chorale*", `Situation au ${date}`, ""];
  for (const g of r.groupes) {
    l.push(`*${nomCourt(g.chorale).toUpperCase()}* — ${pluriel(g.inscrits.length, /femme/i.test(g.chorale))}`);
    g.inscrits.forEach((i, n) => l.push(`${n + 1}. ${nomAffiche(i)}${i.voix ? ` (${i.voix.toLowerCase()})` : ""}`));
    l.push("");
  }
  if (r.vides.length) l.push(`*Pas encore d'inscrit :* ${r.vides.map(nomCourt).join(", ")}.`, "");
  l.push("*CONCLUSION EN CHIFFRES*");
  for (const f of r.familles) l.push(`- ${f.nom} : ${f.total}`);
  l.push(`*TOTAL GÉNÉRAL : ${r.total} inscrit${r.total > 1 ? "s" : ""}*`);
  if (r.enAttente) l.push(`(+ ${r.enAttente} inscription${r.enAttente > 1 ? "s" : ""} par lien en attente de validation)`);
  l.push("", lienInscription
    ? `Chaque choriste qui ne s'est pas encore enregistré est invité à le faire dès aujourd'hui avec ce lien :\n${lienInscription}`
    : "Chaque choriste qui ne s'est pas encore enregistré est invité à le faire dès aujourd'hui sur www.pgmmuanda.com.");
  l.push("", "Pour la PGM Antenne de Muanda,", "*Le Président de l'antenne*", `*${SIGNATAIRE}*`);
  return l.join("\n");
}
