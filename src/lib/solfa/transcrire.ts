/**
 * Transcrire une mélodie chantée en tonic sol-fa, avec son rythme.
 * On reçoit des mesures de hauteur prises régulièrement au micro, on les découpe
 * en notes et en silences, puis on écrit le rythme en temps et demi-temps :
 *   d : r | m : - : s . f | m ||
 * Module pur (sans navigateur) : testé dans tests/solfa.test.ts.
 */
import { noteChantee } from "./hauteur";

/** Une mesure du micro : instant (ms) et demi-tons depuis le Do (null = silence). */
export type Mesure = { t: number; demiTons: number | null };

/** Un morceau de la mélodie : une note (demi-tons arrondis) ou un silence (null). */
export type Morceau = { demiTons: number | null; duree: number };

/** Une note ou un silence, avec sa durée en demi-temps. */
export type NoteRythmee = { demiTons: number | null; demiTemps: number };

const NOTE_MIN_MS = 110;
const SILENCE_ABSORBE_MS = 260;

/** Écriture sol-fa d'un nombre de demi-tons depuis le Do (ex. 4 → « m », -5 → « s₁ »). */
export const texteDemiTons = (demiTons: number) => noteChantee(2 ** (demiTons / 12), 1).texte;

/** Découpe les mesures en notes et silences. */
export function decouper(mesures: Mesure[]): Morceau[] {
  if (mesures.length < 2) return [];
  const pas = (mesures[mesures.length - 1].t - mesures[0].t) / (mesures.length - 1);
  const brutes = mesures.map((m) => (m.demiTons === null ? null : Math.round(m.demiTons)));
  // Filtre médian sur 3 mesures : enlève les petits sauts de la voix.
  const lisses = brutes.map((v, i) => {
    const a = brutes[i - 1], c = brutes[i + 1];
    if (a === undefined || c === undefined) return v;
    if (a === c && v !== a) return a;
    return v;
  });
  let morceaux: Morceau[] = [];
  for (const v of lisses) {
    const dernier = morceaux[morceaux.length - 1];
    if (dernier && dernier.demiTons === v) dernier.duree += pas;
    else morceaux.push({ demiTons: v, duree: pas });
  }
  // Les morceaux trop courts sont collés à celui d'avant (ou d'après).
  const nettoyes: Morceau[] = [];
  for (let i = 0; i < morceaux.length; i++) {
    const m = morceaux[i];
    const court = m.duree < NOTE_MIN_MS;
    if (court && nettoyes.length) nettoyes[nettoyes.length - 1].duree += m.duree;
    else if (court && morceaux[i + 1]) morceaux[i + 1].duree += m.duree;
    else nettoyes.push({ ...m });
  }
  morceaux = fusionner(nettoyes);
  // Un petit silence entre deux notes = on reprend son souffle : il compte dans la note d'avant.
  const absorbes: Morceau[] = [];
  for (const m of morceaux) {
    const avant = absorbes[absorbes.length - 1];
    if (m.demiTons === null && avant && avant.demiTons !== null && m.duree < SILENCE_ABSORBE_MS) avant.duree += m.duree;
    else absorbes.push({ ...m });
  }
  // On enlève les silences du début et de la fin.
  while (absorbes.length && absorbes[0].demiTons === null) absorbes.shift();
  while (absorbes.length && absorbes[absorbes.length - 1].demiTons === null) absorbes.pop();
  return absorbes;
}

function fusionner(liste: Morceau[]): Morceau[] {
  const res: Morceau[] = [];
  for (const m of liste) {
    const d = res[res.length - 1];
    if (d && d.demiTons === m.demiTons) d.duree += m.duree;
    else res.push({ ...m });
  }
  return res;
}

/** La durée d'un temps : la durée de note la plus courante (médiane). */
export function dureeDuTemps(morceaux: Morceau[]): number {
  const durees = morceaux.filter((m) => m.demiTons !== null).map((m) => m.duree).sort((a, b) => a - b);
  if (!durees.length) return 500;
  return durees[Math.floor((durees.length - 1) / 2)];
}

/** Ramène chaque durée à un nombre de demi-temps. */
export function rythmer(morceaux: Morceau[], temps = dureeDuTemps(morceaux)): NoteRythmee[] {
  return morceaux
    .map((m) => ({ demiTons: m.demiTons, demiTemps: Math.max(m.demiTons === null ? 0 : 1, Math.round((m.duree / temps) * 2)) }))
    .filter((n) => n.demiTemps > 0);
}

/**
 * Écrit la mélodie en tonic sol-fa :
 * « : » sépare les temps, « | » les mesures, « - » prolonge la note,
 * « . » coupe un temps en deux, un temps vide = silence.
 */
export function ecrireSolfa(notes: NoteRythmee[], tempsParMesure = 4): string {
  type Moitie = { texte: string | null; debut: boolean };
  const moities: Moitie[] = [];
  for (const n of notes) {
    for (let k = 0; k < n.demiTemps; k++) moities.push({ texte: n.demiTons === null ? null : texteDemiTons(n.demiTons), debut: k === 0 });
  }
  if (!moities.length) return "";
  if (moities.length % 2) moities.push({ ...moities[moities.length - 1], debut: false });
  const rendre = (m: Moitie) => (m.texte === null ? "" : m.debut ? m.texte : "-");
  const temps: string[] = [];
  for (let i = 0; i < moities.length; i += 2) {
    const a = moities[i], b = moities[i + 1];
    const memeNote = !b.debut && a.texte === b.texte;
    temps.push(memeNote ? rendre(a) : `${rendre(a)}.${rendre(b)}`);
  }
  const mesures: string[] = [];
  for (let i = 0; i < temps.length; i += tempsParMesure) {
    mesures.push(temps.slice(i, i + tempsParMesure).map((t) => t || " ").join(" : "));
  }
  return `${mesures.join(" | ")} ||`;
}

/** Tout en une fois : des mesures du micro jusqu'au texte sol-fa. */
export function transcrire(mesures: Mesure[], tempsParMesure = 4) {
  const morceaux = decouper(mesures);
  const temps = dureeDuTemps(morceaux);
  const notes = rythmer(morceaux, temps);
  return { notes, tempsMs: temps, solfa: ecrireSolfa(notes, tempsParMesure) };
}
