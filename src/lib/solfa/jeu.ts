/**
 * Jeu du tonic sol-fa : notes, niveaux et fabrication des questions.
 * Module pur (sans navigateur) : testé dans tests/solfa.test.ts.
 */
import { ecrireLigne, lireRythme } from "./rythme";

export type NoteId = "s1" | "l1" | "t1" | "d" | "r" | "m" | "f" | "s" | "l" | "t" | "d1" | "r1";

export type Note = { id: NoteId; texte: string; nom: string; demiTons: number };

/** Les notes du modulateur, de la plus grave à la plus aiguë (« Do » mobile). */
export const NOTES: Note[] = [
  { id: "s1", texte: "s₁", nom: "Sol grave", demiTons: -5 },
  { id: "l1", texte: "l₁", nom: "La grave", demiTons: -3 },
  { id: "t1", texte: "t₁", nom: "Ti grave", demiTons: -1 },
  { id: "d", texte: "d", nom: "Do", demiTons: 0 },
  { id: "r", texte: "r", nom: "Ré", demiTons: 2 },
  { id: "m", texte: "m", nom: "Mi", demiTons: 4 },
  { id: "f", texte: "f", nom: "Fa", demiTons: 5 },
  { id: "s", texte: "s", nom: "Sol", demiTons: 7 },
  { id: "l", texte: "l", nom: "La", demiTons: 9 },
  { id: "t", texte: "t", nom: "Ti", demiTons: 11 },
  { id: "d1", texte: "d¹", nom: "Do aigu", demiTons: 12 },
  { id: "r1", texte: "r¹", nom: "Ré aigu", demiTons: 14 },
];

export const note = (id: NoteId) => NOTES.find((n) => n.id === id)!;

/** L'échelle de base : d r m f s l t d¹. */
export const ECHELLE: NoteId[] = ["d", "r", "m", "f", "s", "l", "t", "d1"];

/** Fréquence d'une note, pour un Do donné (par défaut le Do du milieu du piano). */
export const frequence = (id: NoteId, doHz = 261.63) => doHz * 2 ** (note(id).demiTons / 12);

export type Choix = { texte: string; sous?: string };

export type Question =
  | {
      type: "choix";
      consigne: string;
      /** Gros texte affiché (ex. « m » ou « d m s »). */
      grand?: string;
      /** Sons à écouter (le Do de départ est joué avant si `avecDo`). */
      sons?: NoteId[];
      avecDo?: boolean;
      choix: Choix[];
      bonne: number;
      /** Ligne sol-fa dont on écoute le rythme (avec le battement des temps). */
      rythme?: string;
      /** Notes jouées pour aider après la réponse. */
      sonReponse?: NoteId[];
      explication: string;
    }
  | {
      type: "chant";
      consigne: string;
      /** La note que le choriste doit chanter. */
      cible: NoteId;
      explication: string;
    }
  | {
      type: "dictee";
      consigne: string;
      sons: NoteId[];
      avecDo: true;
      /** Touches proposées sur le modulateur. */
      touches: NoteId[];
      explication: string;
    };

export type Niveau = {
  numero: number;
  titre: string;
  resume: string;
  /** Petite leçon montrée avant de jouer : quelques phrases simples. */
  lecon: string[];
  /** Notes à montrer (et à écouter) dans la leçon. */
  notesLecon: NoteId[];
  fabriquer: (hasard: () => number) => Question;
  /** Niveau de chant (micro) : il ne bloque jamais les niveaux suivants. */
  chant?: boolean;
  /** Lignes de rythme à écouter dans la leçon. */
  lignesLecon?: string[];
  /** Niveau de rythme (lié au cours). */
  rythme?: boolean;
};

export const QUESTIONS_PAR_PARTIE = 10;
export const POINTS_BONNE_REPONSE = 10;
/** Il faut au moins ce nombre de bonnes réponses pour ouvrir le niveau suivant. */
export const SEUIL_REUSSITE = 6;

const tirer = <T,>(liste: T[], hasard: () => number) => liste[Math.floor(hasard() * liste.length) % liste.length];

function melanger<T>(liste: T[], hasard: () => number): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1)) % (i + 1);
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/** Une question à choix où la bonne réponse est placée au hasard parmi les autres. */
function avecChoix(
  bonne: Choix,
  autres: Choix[],
  hasard: () => number,
  reste: Omit<Extract<Question, { type: "choix" }>, "type" | "choix" | "bonne">,
  ordreFixe = false,
): Question {
  const choix = ordreFixe ? [bonne, ...autres] : melanger([bonne, ...autres], hasard);
  if (ordreFixe) choix.sort((a, b) => ordreNote(a.texte) - ordreNote(b.texte));
  return { type: "choix", choix, bonne: choix.indexOf(bonne), ...reste };
}

const ordreNote = (texte: string) => NOTES.findIndex((n) => n.texte === texte);
const choixNote = (id: NoteId): Choix => ({ texte: note(id).texte, sous: note(id).nom });

/** Question de rythme : on écoute un rythme et on choisit comment il s'écrit. */
function rythmeQ(cellules: string[], hasard: () => number): Question {
  const debuts = cellules.filter((c) => c.trim().startsWith("d"));
  const fabriquer = () => [tirer(debuts, hasard), tirer(cellules, hasard), tirer(cellules, hasard), tirer(cellules, hasard)];
  const bonne = fabriquer();
  const son = (c: string[]) => JSON.stringify(lireRythme(ecrireLigne(c)));
  const vus = new Set([son(bonne)]);
  const autres: Choix[] = [];
  let essais = 0;
  while (autres.length < 2 && essais++ < 100) {
    const copie = [...bonne];
    const pos = 1 + Math.floor(hasard() * 3);
    copie[pos] = tirer(cellules.filter((c) => c !== bonne[pos]), hasard);
    if (!vus.has(son(copie))) { vus.add(son(copie)); autres.push({ texte: ecrireLigne(copie) }); }
  }
  const ligne = ecrireLigne(bonne);
  return avecChoix({ texte: ligne }, autres, hasard, {
    consigne: "Écoutez le rythme (le tic-tac marque les temps). Comment s'écrit-il ?",
    rythme: ligne,
    explication: `Le rythme était « ${ligne} ».`,
  });
}

/** Question de chant : le choriste chante la note demandée, le micro vérifie. */
function chant(notes: NoteId[], hasard: () => number): Question {
  const cible = tirer(notes, hasard);
  return {
    type: "chant",
    consigne: `Chantez la note « ${note(cible).texte} » (${note(cible).nom}).`,
    cible,
    explication: `La note demandée était « ${note(cible).texte} » (${note(cible).nom}).`,
  };
}

/** Question d'écoute : on entend le Do, puis une note, et on la reconnaît. */
function ecoute(notes: NoteId[], hasard: () => number): Question {
  const cible = tirer(notes, hasard);
  return avecChoix(choixNote(cible), notes.filter((n) => n !== cible).map(choixNote), hasard, {
    consigne: "Écoutez : d'abord le Do, puis une note. Quelle est cette note ?",
    sons: [cible],
    avecDo: true,
    sonReponse: ["d", cible],
    explication: `C'était « ${note(cible).texte} » (${note(cible).nom}).`,
  }, true);
}

const LISTE: Omit<Niveau, "numero">[] = [
  {
    titre: "L'échelle du sol-fa",
    resume: "Apprendre l'ordre des notes d r m f s l t d¹.",
    lecon: [
      "En tonic sol-fa, chaque note a une lettre : d (Do), r (Ré), m (Mi), f (Fa), s (Sol), l (La), t (Ti).",
      "On monte toujours dans cet ordre : d r m f s l t, puis on retrouve d¹, le Do aigu.",
      "Touchez chaque note ci-dessous pour l'écouter.",
    ],
    notesLecon: ECHELLE,
    fabriquer: (hasard) => {
      const apres = hasard() < 0.6;
      const i = apres ? Math.floor(hasard() * 7) : 1 + Math.floor(hasard() * 7);
      const depart = ECHELLE[i];
      const cible = ECHELLE[apres ? i + 1 : i - 1];
      const autres = melanger(ECHELLE.filter((n) => n !== cible && n !== depart), hasard).slice(0, 2);
      return avecChoix(choixNote(cible), autres.map(choixNote), hasard, {
        consigne: apres ? `Quelle note vient juste après « ${note(depart).texte} » ?` : `Quelle note vient juste avant « ${note(depart).texte} » ?`,
        grand: apres ? `${note(depart).texte}  →  ?` : `?  →  ${note(depart).texte}`,
        sonReponse: apres ? [depart, cible] : [cible, depart],
        explication: apres
          ? `Après « ${note(depart).texte} » vient « ${note(cible).texte} ».`
          : `Avant « ${note(depart).texte} » vient « ${note(cible).texte} ».`,
      });
    },
  },
  {
    titre: "Écouter d, m, s",
    resume: "Reconnaître à l'oreille Do, Mi et Sol.",
    lecon: [
      "d, m et s sont les trois notes les plus solides : on les entend dans beaucoup de chants.",
      "d est la maison. m est un peu plus haut. s est encore plus haut.",
      "Dans le jeu, on joue toujours d'abord le Do, pour que votre oreille sache où est la maison.",
    ],
    notesLecon: ["d", "m", "s"],
    fabriquer: (hasard) => ecoute(["d", "m", "s"], hasard),
  },
  {
    titre: "Monte ou descend ?",
    resume: "Dire si la 2ᵉ note est plus haute ou plus basse.",
    lecon: [
      "Une mélodie monte, descend ou reste sur la même note.",
      "Écoutez deux notes. La deuxième est-elle plus haute (elle monte), plus basse (elle descend) ou pareille ?",
    ],
    notesLecon: ["d", "s", "m"],
    fabriquer: (hasard) => {
      const n1 = tirer(ECHELLE, hasard);
      const sens = tirer(["haut", "bas", "pareil"] as const, hasard);
      const i = ECHELLE.indexOf(n1);
      const possibles = ECHELLE.filter((_, j) => (sens === "haut" ? j > i : sens === "bas" ? j < i : j === i));
      const n2 = possibles.length ? tirer(possibles, hasard) : n1;
      const vrai = n2 === n1 ? "pareil" : ECHELLE.indexOf(n2) > i ? "haut" : "bas";
      const choix: Choix[] = [
        { texte: "⬆", sous: "Elle monte" },
        { texte: "⬇", sous: "Elle descend" },
        { texte: "=", sous: "Pareille" },
      ];
      const bonne = vrai === "haut" ? 0 : vrai === "bas" ? 1 : 2;
      return {
        type: "choix",
        consigne: "Écoutez les deux notes. La deuxième note…",
        sons: [n1, n2],
        choix,
        bonne,
        sonReponse: [n1, n2],
        explication: `C'était « ${note(n1).texte} » puis « ${note(n2).texte} » : ${vrai === "haut" ? "elle monte" : vrai === "bas" ? "elle descend" : "c'est la même note"}.`,
      };
    },
  },
  {
    titre: "Chantez la note",
    resume: "Le jeu vous écoute chanter d, r, m, f, s.",
    lecon: [
      "Maintenant c'est vous qui chantez ! Le téléphone écoute avec le micro et vous dit quelle note vous chantez.",
      "Écoutez le Do et la note demandée, puis touchez « Je chante » et tenez la note sur « a » ou « o ».",
      "Si la flèche dit « plus haut », montez un peu la voix. Si elle dit « plus bas », descendez un peu.",
    ],
    notesLecon: ["d", "r", "m", "f", "s"],
    fabriquer: (hasard) => chant(["d", "r", "m", "f", "s"], hasard),
    chant: true,
  },
  {
    titre: "Le rythme : temps et demi-temps",
    resume: "Lire « d », « - » et « d . d » à l'oreille.",
    lecon: [
      "Chaque temps est entre deux « : ». Une note seule dure un temps.",
      "« - » tient la note d'avant. « d . d » met deux notes dans un seul temps.",
      "Écoutez le tic-tac : il marque chaque temps. Puis choisissez la bonne écriture.",
      "Toutes les explications sont dans « Le cours » (bouton en haut du jeu).",
    ],
    notesLecon: [],
    lignesLecon: [": d : d : d : d :", ": d : - : d . d : d :", ": d . d : - . d : d : - :"],
    fabriquer: (hasard) => rythmeQ(["d", "d", "-", "d . d", "- . d"], hasard),
    rythme: true,
  },
  {
    titre: "Écouter de d à s",
    resume: "Reconnaître d, r, m, f, s à l'oreille.",
    lecon: [
      "Maintenant, cinq notes : d r m f s.",
      "Astuce : chantez dans votre tête d r m f s depuis le Do, et arrêtez-vous sur la note entendue.",
    ],
    notesLecon: ["d", "r", "m", "f", "s"],
    fabriquer: (hasard) => ecoute(["d", "r", "m", "f", "s"], hasard),
  },
  {
    titre: "Toute l'échelle",
    resume: "Reconnaître les 8 notes de d à d¹.",
    lecon: [
      "Toute l'échelle : d r m f s l t d¹.",
      "t (Ti) est juste en dessous du Do aigu : il donne envie de monter jusqu'à d¹.",
    ],
    notesLecon: ECHELLE,
    fabriquer: (hasard) => ecoute(ECHELLE, hasard),
  },
  {
    titre: "Le temps pointé",
    resume: "Reconnaître « d .,d » : une note longue et une très courte.",
    lecon: [
      "« d .,d » : la première note est longue (¾ du temps), la seconde très courte (¼).",
      "Comparez avec « d . d » : deux moitiés égales.",
    ],
    notesLecon: [],
    lignesLecon: [": d . d : d . d : d .,d : d .,d :", ": d .,d : d : d .,d : d :"],
    fabriquer: (hasard) => rythmeQ(["d", "d . d", "d .,d", "-", "- .,d"], hasard),
    rythme: true,
  },
  {
    titre: "Grave ou aigu",
    resume: "Lire s₁, l₁, t₁ (graves) et d¹, r¹ (aigus).",
    lecon: [
      "Un petit 1 en bas (s₁) veut dire : la note est plus grave, en dessous du Do.",
      "Un petit 1 en haut (d¹) veut dire : la note est plus aiguë, au-dessus.",
      "Les basses chantent souvent s₁, l₁, t₁. Les sopranos montent souvent jusqu'à d¹ et r¹.",
    ],
    notesLecon: ["s1", "l1", "t1", "d", "d1", "r1"],
    fabriquer: (hasard) => {
      const paires: [NoteId, NoteId][] = [["s1", "s"], ["l1", "l"], ["t1", "t"], ["d", "d1"], ["r", "r1"]];
      const [a, b] = tirer(paires, hasard);
      const cible = hasard() < 0.5 ? a : b;
      return avecChoix(choixNote(cible), [choixNote(cible === a ? b : a)], hasard, {
        consigne: "Écoutez : d'abord le Do, puis une note. Laquelle avez-vous entendue ?",
        sons: [cible],
        avecDo: true,
        sonReponse: ["d", cible],
        explication: `C'était « ${note(cible).texte} » (${note(cible).nom}).`,
      }, true);
    },
  },
  {
    titre: "Lire une petite mélodie",
    resume: "Écouter 3 notes et trouver comment elles s'écrivent.",
    lecon: [
      "Une mélodie s'écrit avec les lettres, de gauche à droite : « d m s » veut dire Do, puis Mi, puis Sol.",
      "Écoutez la mélodie, puis choisissez la bonne écriture.",
    ],
    notesLecon: ["d", "m", "s"],
    fabriquer: (hasard) => {
      const gamme: NoteId[] = ["d", "r", "m", "f", "s", "l"];
      const melodie: NoteId[] = ["d", tirer(gamme, hasard), tirer(gamme, hasard)];
      const ecrire = (m: NoteId[]) => m.map((n) => note(n).texte).join(" ");
      const variantes = new Set<string>([ecrire(melodie)]);
      const autres: Choix[] = [];
      while (autres.length < 2) {
        const copie = [...melodie];
        const pos = 1 + Math.floor(hasard() * 2);
        copie[pos] = tirer(gamme.filter((n) => n !== melodie[pos]), hasard);
        const texte = ecrire(copie);
        if (!variantes.has(texte)) { variantes.add(texte); autres.push({ texte }); }
      }
      return avecChoix({ texte: ecrire(melodie) }, autres, hasard, {
        consigne: "Écoutez la mélodie. Comment s'écrit-elle ?",
        sons: melodie,
        sonReponse: melodie,
        explication: `La mélodie était « ${ecrire(melodie)} ».`,
      });
    },
  },
  {
    titre: "Trois et quatre notes dans un temps",
    resume: "Lire « d . d ,d », « d ,d . d » et « d ,d . d ,d ».",
    lecon: [
      "La virgule « , » coupe en quarts de temps.",
      "« d . d ,d » : ½ + ¼ + ¼. « d ,d . d » : ¼ + ¼ + ½. « d ,d . d ,d » : quatre notes égales.",
    ],
    notesLecon: [],
    lignesLecon: [": d . d ,d : d : d ,d . d : d :", ": d ,d . d ,d : d : d ,d . d ,d : d :"],
    fabriquer: (hasard) => rythmeQ(["d", "d . d", "d . d ,d", "d ,d . d", "d ,d . d ,d"], hasard),
    rythme: true,
  },
  {
    titre: "La dictée musicale",
    resume: "Écouter 3 notes et les taper dans l'ordre.",
    lecon: [
      "Dernier défi : la dictée. Vous entendez le Do, puis 3 notes.",
      "Touchez les notes dans l'ordre sur le modulateur. Vous pouvez réécouter autant de fois que vous voulez.",
    ],
    notesLecon: ["d", "r", "m", "f", "s", "l"],
    fabriquer: (hasard) => {
      const touches: NoteId[] = ["d", "r", "m", "f", "s", "l"];
      const sons = [tirer(touches, hasard), tirer(touches, hasard), tirer(touches, hasard)];
      return {
        type: "dictee",
        consigne: "Écoutez : le Do, puis 3 notes. Touchez-les dans l'ordre.",
        sons,
        avecDo: true,
        touches,
        explication: `La dictée était « ${sons.map((n) => note(n).texte).join(" ")} ».`,
      };
    },
  },
  {
    titre: "Les silences",
    resume: "Entendre où l'on se tait : « :   : », « . d », « d . ».",
    lecon: [
      "Une place vide = un silence. On compte quand même le temps.",
      "« . d » : silence puis d. « d . » : d puis silence.",
    ],
    notesLecon: [],
    lignesLecon: [": d : d :   : d :", ": . d : d . : d : d :"],
    fabriquer: (hasard) => rythmeQ(["d", "d . d", " . d", "d . ", " "], hasard),
    rythme: true,
  },
  {
    titre: "Chantez toute l'échelle",
    resume: "Chanter juste toutes les notes de d à d¹.",
    lecon: [
      "Le grand défi : chanter juste n'importe quelle note de l'échelle.",
      "Pensez à l'échelle depuis le Do : d r m f s l t d¹. Vous pouvez toujours réécouter.",
    ],
    notesLecon: ECHELLE,
    fabriquer: (hasard) => chant(["r", "m", "f", "s", "l", "t", "d1"], hasard),
    chant: true,
  },
];

/** Les niveaux, numérotés dans l'ordre. */
export const NIVEAUX: Niveau[] = LISTE.map((n, i) => ({ ...n, numero: i + 1 }));

/** Prépare une partie : des questions sans deux fois la même à la suite. */
export function preparerPartie(niveau: Niveau, hasard: () => number = Math.random): Question[] {
  const liste: Question[] = [];
  let essais = 0;
  while (liste.length < QUESTIONS_PAR_PARTIE && essais < 200) {
    essais++;
    const q = niveau.fabriquer(hasard);
    const precedente = liste[liste.length - 1];
    if (precedente && JSON.stringify(precedente) === JSON.stringify(q) && essais < 150) continue;
    liste.push(q);
  }
  return liste;
}

/** Bonne réponse à une dictée ? */
export const dicteeJuste = (attendu: NoteId[], tape: NoteId[]) =>
  attendu.length === tape.length && attendu.every((n, i) => n === tape[i]);

/** Étoiles gagnées selon le nombre de bonnes réponses (sur 10). */
export function etoiles(bonnes: number): 0 | 1 | 2 | 3 {
  if (bonnes >= QUESTIONS_PAR_PARTIE) return 3;
  if (bonnes >= 8) return 2;
  if (bonnes >= SEUIL_REUSSITE) return 1;
  return 0;
}

export type Progression = {
  /** Meilleur nombre de bonnes réponses par niveau (clé : numéro du niveau). */
  meilleurs: Record<number, number>;
  /** Points gagnés depuis le début (chaque partie ajoute ses points). */
  points: number;
  parties: number;
};

export const progressionVide = (): Progression => ({ meilleurs: {}, points: 0, parties: 0 });

/**
 * Un niveau est ouvert si c'est le premier, ou si le niveau d'avant est réussi.
 * Les niveaux de chant ne bloquent pas la suite (téléphone sans micro, voix fatiguée…).
 */
export function niveauOuvert(p: Progression, numero: number) {
  let avant = numero - 1;
  while (avant >= 1 && NIVEAUX[avant - 1]?.chant) avant--;
  return avant < 1 || (p.meilleurs[avant] ?? 0) >= SEUIL_REUSSITE;
}

export function enregistrerPartie(p: Progression, numero: number, bonnes: number): Progression {
  return {
    meilleurs: { ...p.meilleurs, [numero]: Math.max(p.meilleurs[numero] ?? 0, bonnes) },
    points: p.points + bonnes * POINTS_BONNE_REPONSE,
    parties: p.parties + 1,
  };
}

export const totalEtoiles = (p: Progression) =>
  NIVEAUX.reduce((t, n) => t + etoiles(p.meilleurs[n.numero] ?? 0), 0);

const RANGS = [
  { min: 0, titre: "Petite voix" },
  { min: 100, titre: "Apprenti du sol-fa" },
  { min: 300, titre: "Choriste qui lit" },
  { min: 600, titre: "Bonne oreille" },
  { min: 1000, titre: "Maître du sol-fa" },
];

/** Le titre du joueur selon ses points, et les points qu'il faut pour le suivant. */
export function rang(points: number) {
  let i = 0;
  while (i + 1 < RANGS.length && points >= RANGS[i + 1].min) i++;
  const suivant = RANGS[i + 1];
  return { titre: RANGS[i].titre, suivant: suivant?.titre, manque: suivant ? suivant.min - points : 0 };
}

/** Lit une progression enregistrée, en ignorant tout ce qui est abîmé. */
export function lireProgression(brut: string | null): Progression {
  if (!brut) return progressionVide();
  try {
    const o = JSON.parse(brut) as Partial<Progression>;
    const meilleurs: Record<number, number> = {};
    for (const [k, v] of Object.entries(o.meilleurs ?? {})) {
      const n = Number(k);
      if (Number.isInteger(n) && typeof v === "number" && v >= 0) meilleurs[n] = Math.min(v, QUESTIONS_PAR_PARTIE);
    }
    return {
      meilleurs,
      points: typeof o.points === "number" && o.points >= 0 ? o.points : 0,
      parties: typeof o.parties === "number" && o.parties >= 0 ? o.parties : 0,
    };
  } catch {
    return progressionVide();
  }
}
