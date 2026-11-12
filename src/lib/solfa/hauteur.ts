/**
 * Reconnaître la note chantée : on mesure la hauteur de la voix (en Hz),
 * puis on la traduit en tonic sol-fa par rapport au Do choisi.
 * Module pur (sans navigateur) : testé dans tests/solfa.test.ts.
 */
import { NOTES, type NoteId } from "./jeu";

/**
 * Hauteur d'un morceau de son (méthode YIN simplifiée).
 * Renvoie null si c'est trop faible (silence) ou si ce n'est pas une note tenue.
 */
export function detecterFrequence(son: Float32Array, frequenceEchantillon: number, { min = 65, max = 1100 } = {}): number | null {
  const n = son.length;
  let energie = 0;
  for (let i = 0; i < n; i++) energie += son[i] * son[i];
  if (Math.sqrt(energie / n) < 0.01) return null;

  const decalageMin = Math.max(2, Math.floor(frequenceEchantillon / max));
  const decalageMax = Math.min(Math.floor(frequenceEchantillon / min), Math.floor(n / 2));
  const fenetre = n - decalageMax;
  const ecart = new Float32Array(decalageMax + 1);
  for (let tau = 1; tau <= decalageMax; tau++) {
    let somme = 0;
    for (let i = 0; i < fenetre; i++) {
      const d = son[i] - son[i + tau];
      somme += d * d;
    }
    ecart[tau] = somme;
  }
  // Différence normalisée : un creux proche de 0 = la période de la note.
  const norme = new Float32Array(decalageMax + 1);
  norme[0] = 1;
  let cumul = 0;
  for (let tau = 1; tau <= decalageMax; tau++) {
    cumul += ecart[tau];
    norme[tau] = cumul === 0 ? 1 : (ecart[tau] * tau) / cumul;
  }
  let periode = -1;
  for (let tau = decalageMin; tau <= decalageMax; tau++) {
    if (norme[tau] < 0.15) {
      while (tau + 1 <= decalageMax && norme[tau + 1] < norme[tau]) tau++;
      periode = tau;
      break;
    }
  }
  if (periode < 0) {
    let meilleur = decalageMin;
    for (let tau = decalageMin; tau <= decalageMax; tau++) if (norme[tau] < norme[meilleur]) meilleur = tau;
    if (norme[meilleur] > 0.35) return null;
    periode = meilleur;
  }
  // Affinage entre deux échantillons (parabole).
  let precise = periode;
  if (periode > 1 && periode < decalageMax) {
    const a = norme[periode - 1], b = norme[periode], c = norme[periode + 1];
    const den = a - 2 * b + c;
    if (den !== 0) precise = periode + (a - c) / (2 * den);
  }
  return frequenceEchantillon / precise;
}

/** Les 12 demi-tons à partir du Do, en tonic sol-fa (notes altérées comprises). */
const DEGRES: { texte: string; nom: string; diatonique: boolean }[] = [
  { texte: "d", nom: "Do", diatonique: true },
  { texte: "de", nom: "Do dièse", diatonique: false },
  { texte: "r", nom: "Ré", diatonique: true },
  { texte: "ri", nom: "Ré dièse", diatonique: false },
  { texte: "m", nom: "Mi", diatonique: true },
  { texte: "f", nom: "Fa", diatonique: true },
  { texte: "fe", nom: "Fa dièse", diatonique: false },
  { texte: "s", nom: "Sol", diatonique: true },
  { texte: "se", nom: "Sol dièse", diatonique: false },
  { texte: "l", nom: "La", diatonique: true },
  { texte: "ta", nom: "Ti bémol", diatonique: false },
  { texte: "t", nom: "Ti", diatonique: true },
];

const HAUT = ["", "¹", "²", "³"];
const BAS = ["", "₁", "₂", "₃"];

export type NoteChantee = {
  /** Écriture sol-fa avec la marque d'octave (ex. « m », « s₁ », « d¹ »). */
  texte: string;
  nom: string;
  /** Demi-tons depuis le Do (0 à 11), sans l'octave. */
  degre: number;
  /** 0 = octave du Do, -1 = plus grave, +1 = plus aigu. */
  octave: number;
  /** Écart en centièmes de demi-ton : négatif = un peu bas, positif = un peu haut. */
  cents: number;
  /** La note du modulateur correspondante, si elle existe. */
  id: NoteId | null;
};

export function noteChantee(hz: number, doHz: number): NoteChantee {
  const demiTons = 12 * Math.log2(hz / doHz);
  const proche = Math.round(demiTons);
  const degre = ((proche % 12) + 12) % 12;
  const octave = Math.floor(proche / 12);
  const d = DEGRES[degre];
  const marque = octave > 0 ? HAUT[Math.min(octave, 3)] : BAS[Math.min(-octave, 3)];
  const id = (NOTES.find((n) => n.demiTons === proche)?.id) ?? null;
  return {
    texte: d.texte + marque,
    nom: d.nom + (octave < 0 ? " grave" : octave > 0 ? " aigu" : ""),
    degre, octave, id,
    cents: Math.round((demiTons - proche) * 100),
  };
}

/** Demi-tons (sans l'octave) d'une note du modulateur. */
export const degreDe = (id: NoteId) => ((NOTES.find((n) => n.id === id)!.demiTons % 12) + 12) % 12;

/**
 * Comparer la note chantée à la note demandée (l'octave ne compte pas :
 * hommes et femmes peuvent chanter la même note).
 * Renvoie l'écart en demi-tons ramené entre -6 et +6 (négatif = trop bas).
 */
export function ecartAvec(chantee: NoteChantee, cible: NoteId): number {
  let e = chantee.degre + chantee.cents / 100 - degreDe(cible);
  while (e > 6) e -= 12;
  while (e < -6) e += 12;
  return Math.round(e * 100) / 100;
}

/** Juste si l'on est à moins d'un tiers de demi-ton de la bonne note. */
export const chanteJuste = (chantee: NoteChantee, cible: NoteId) => Math.abs(ecartAvec(chantee, cible)) <= 0.35;

/** Où se trouve le Do : voix (femme/enfant ou homme) et tonalité. */
export type Reglages = { voix: "femme" | "homme"; ton: number };

export const TONALITES = [
  { ton: -5, nom: "Sol" }, { ton: -4, nom: "La♭" }, { ton: -3, nom: "La" }, { ton: -2, nom: "Si♭" }, { ton: -1, nom: "Si" },
  { ton: 0, nom: "Do" }, { ton: 1, nom: "Ré♭" }, { ton: 2, nom: "Ré" }, { ton: 3, nom: "Mi♭" }, { ton: 4, nom: "Mi" }, { ton: 5, nom: "Fa" },
];

export const reglagesParDefaut = (): Reglages => ({ voix: "femme", ton: 0 });

/** Fréquence du Do : Do du milieu pour les femmes et enfants, une octave plus bas pour les hommes. */
export const doDe = (r: Reglages) => (r.voix === "homme" ? 130.81 : 261.63) * 2 ** (r.ton / 12);

export function lireReglages(brut: string | null): Reglages {
  try {
    const o = JSON.parse(brut ?? "") as Partial<Reglages>;
    return {
      voix: o.voix === "homme" ? "homme" : "femme",
      ton: TONALITES.some((t) => t.ton === o.ton) ? (o.ton as number) : 0,
    };
  } catch {
    return reglagesParDefaut();
  }
}
