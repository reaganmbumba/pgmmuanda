/**
 * Le rythme en tonic sol-fa : lire une ligne écrite et en tirer les durées.
 *   :  sépare les temps          -   prolonge la note
 *   .  coupe le temps en deux    ,   coupe en quarts       .,  le temps pointé (¾ + ¼)
 *   une place vide = un silence
 * Exemples : « : d . r : m : - : d .,r : »   « : d ,r . m ,f : »   « : . d : »
 * Module pur (sans navigateur) : testé dans tests/solfa.test.ts.
 */
/** Un son (demi-tons depuis le Do) ou un silence (null), avec sa durée en temps. */
export type Evenement = { demiTons: number | null; temps: number };

const DEGRES: Record<string, number> = { d: 0, de: 1, ra: 1, r: 2, ri: 3, ma: 3, m: 4, f: 5, fe: 6, s: 7, se: 8, la: 8, l: 9, ta: 10, t: 11 };

/** Demi-tons d'une note écrite (« m », « s₁ », « d¹ », « d' », « fe »). Renvoie null si inconnue. */
export function lireNote(texte: string): number | null {
  const m = /^([a-z]+)(¹|²|₁|₂|'|’|''|’’)?$/.exec(texte.trim());
  if (!m || DEGRES[m[1]] === undefined) return null;
  const marque = m[2] ?? "";
  const octave = marque === "¹" || marque === "'" || marque === "’" ? 1 : marque === "²" || marque === "''" || marque === "’’" ? 2 : marque === "₁" ? -1 : marque === "₂" ? -2 : 0;
  return DEGRES[m[1]] + 12 * octave;
}

/** Lit un seul temps (le texte entre deux « : »). Positions en quarts de temps. */
function lireTemps(texte: string): { pos: number; jeton: string }[] {
  const morceaux: { pos: number; jeton: string }[] = [];
  let pos = 0;
  let jeton = "";
  let i = 0;
  const fermer = () => { morceaux.push({ pos, jeton: jeton.trim() }); jeton = ""; };
  while (i < texte.length) {
    const c = texte[i];
    if (c === "." && texte[i + 1] === ",") { fermer(); pos = 3; i += 2; continue; }
    if (c === ".") { fermer(); pos = 2; i++; continue; }
    if (c === ",") { fermer(); pos = pos < 2 ? 1 : 3; i++; continue; }
    jeton += c;
    i++;
  }
  fermer();
  return morceaux;
}

/** Lit une ligne entière et renvoie la suite des sons et silences avec leurs durées. */
export function lireRythme(ligne: string): Evenement[] {
  const temps = ligne.replace(/\|\|?/g, ":").split(":").map((t) => t).slice(1, -1);
  const evts: Evenement[] = [];
  for (const t of temps) {
    const morceaux = lireTemps(t);
    morceaux.forEach((m, k) => {
      const fin = morceaux[k + 1]?.pos ?? 4;
      const duree = (fin - m.pos) / 4;
      if (duree <= 0) return;
      const dernier = evts[evts.length - 1];
      if (m.jeton === "-") {
        if (dernier) dernier.temps += duree;
        else evts.push({ demiTons: null, temps: duree });
      } else if (m.jeton === "") {
        if (dernier && dernier.demiTons === null) dernier.temps += duree;
        else evts.push({ demiTons: null, temps: duree });
      } else {
        evts.push({ demiTons: lireNote(m.jeton), temps: duree });
      }
    });
  }
  return evts;
}

/** Nombre de temps d'une ligne. */
export const nombreDeTemps = (ligne: string) => ligne.replace(/\|\|?/g, ":").split(":").length - 2;

/** Écrit des cellules (un texte par temps) en ligne sol-fa : « : d : d . d : ». */
export const ecrireLigne = (cellules: string[]) => `: ${cellules.map((c) => (c.trim() === "" ? " " : c)).join(" : ")} :`;

/** Les notes d'une ligne qu'on ne sait pas lire (doit rester vide). */
export function notesInconnues(ligne: string): string[] {
  const temps = ligne.replace(/\|\|?/g, ":").split(":").slice(1, -1);
  return temps.flatMap((t) => t.split(/\.,|\.|,/)).map((j) => j.trim()).filter((j) => j !== "" && j !== "-" && lireNote(j) === null);
}
