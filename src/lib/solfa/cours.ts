/**
 * Le cours de tonic sol-fa de la PGM : lecture des notes et du rythme.
 * Chaque leçon : une explication simple, des exemples et des exercices à chanter.
 * Chaque ligne s'écoute dans l'application (avec le battement des temps).
 */

export type Ligne = { solfa: string; aide?: string };

export type LeconCours = {
  id: string;
  titre: string;
  resume: string;
  explication: string[];
  /** Petit tableau « ce qu'on écrit → ce qu'on chante ». */
  regles?: { signe: string; sens: string }[];
  exemples: Ligne[];
  exercices: Ligne[];
  /** Titre du niveau du jeu qui entraîne cette leçon. */
  niveauJeu?: string;
};

export const COURS: LeconCours[] = [
  {
    id: "notes",
    titre: "1. Les notes",
    resume: "d r m f s l t : l'échelle, les notes graves et aiguës.",
    explication: [
      "En tonic sol-fa, on écrit les notes avec leur première lettre : d (Do), r (Ré), m (Mi), f (Fa), s (Sol), l (La), t (Ti).",
      "Le Do est « mobile » : il se place là où le chef de chœur donne le ton. Les autres notes se chantent toujours à la même distance du Do.",
      "Une note plus grave que l'échelle porte une petite marque en bas : s₁ (on l'écrit aussi s,). Une note plus aiguë porte une marque en haut : d¹ (on l'écrit aussi d').",
    ],
    regles: [
      { signe: "d r m f s l t d¹", sens: "l'échelle qui monte" },
      { signe: "s₁ l₁ t₁", sens: "notes graves (sous le Do), écrites aussi s, l, t," },
      { signe: "d¹ r¹ m¹", sens: "notes aiguës (au-dessus), écrites aussi d' r' m'" },
    ],
    exemples: [
      { solfa: ": d : r : m : f : s : l : t : d¹ :", aide: "On monte l'échelle, une note par temps." },
      { solfa: ": d¹ : t : l : s : f : m : r : d :", aide: "On redescend." },
    ],
    exercices: [
      { solfa: ": d : m : s : d¹ : s : m : d : - :" },
      { solfa: ": d : t₁ : l₁ : s₁ : l₁ : t₁ : d : - :" },
      { solfa: ": s : l : t : d¹ : r¹ : d¹ : t : d¹ :" },
    ],
    niveauJeu: "L'échelle du sol-fa",
  },
  {
    id: "temps",
    titre: "2. Le temps et la mesure",
    resume: "Les deux-points « : » et la barre « | ».",
    explication: [
      "Le chant avance au rythme d'un battement régulier, comme le pas d'une marche : c'est le temps.",
      "En sol-fa, chaque temps est placé entre deux signes « : ». Une note seule entre deux « : » dure un temps.",
      "Les temps sont groupés en mesures, séparées par une barre « | ». La fin du chant s'écrit « || ». Une mesure a souvent 2, 3 ou 4 temps.",
    ],
    regles: [
      { signe: ":", sens: "sépare deux temps" },
      { signe: "|", sens: "sépare deux mesures" },
      { signe: "||", sens: "fin du chant" },
    ],
    exemples: [
      { solfa: ": d : r | m : f | s : - | d : - ||", aide: "Mesures à 2 temps." },
      { solfa: ": d : m : s | d¹ : s : m | d : - : - ||", aide: "Mesures à 3 temps." },
    ],
    exercices: [
      { solfa: ": d : d : r : r | m : m : r : - | d : d : t₁ : t₁ | d : - : - : - ||" },
      { solfa: ": s : m : d | r : m : f | m : r : d | d : - : - ||" },
    ],
  },
  {
    id: "prolonger",
    titre: "3. Tenir une note : le tiret « - »",
    resume: "Une note qui dure plusieurs temps.",
    explication: [
      "Le tiret « - » veut dire : on continue la note d'avant pendant ce temps, sans la rechanter.",
      "« : d : - : » est un Do qui dure deux temps. « : d : - : - : - : » dure quatre temps.",
    ],
    regles: [{ signe: ": d : - :", sens: "d tenu pendant 2 temps" }],
    exemples: [
      { solfa: ": d : - : r : - : m : - : - : - :", aide: "2 temps, 2 temps, puis 4 temps." },
    ],
    exercices: [
      { solfa: ": s : - : m : - : d : - : - : - :" },
      { solfa: ": d : r : m : - : f : m : r : - : d : - : - : - :" },
      { solfa: ": m : - : - : r : d : - : t₁ : d : - : - :" },
    ],
    niveauJeu: "Le rythme : temps et demi-temps",
  },
  {
    id: "deux-notes",
    titre: "4. Deux notes dans un temps : le point « . »",
    resume: "Le demi-temps.",
    explication: [
      "Le point « . » coupe le temps en deux moitiés égales : « : d . r : » se chante Do-Ré, deux fois plus vite, dans un seul temps.",
      "On peut aussi tenir la note d'avant pendant la première moitié : « : - . r : ».",
    ],
    regles: [
      { signe: ": d . r :", sens: "deux demi-temps" },
      { signe: ": - . r :", sens: "on tient, puis r sur le demi-temps" },
    ],
    exemples: [
      { solfa: ": d . d : r . r : m : - :", aide: "Deux paires de demi-temps, puis une note de deux temps." },
    ],
    exercices: [
      { solfa: ": d . r : m . f : s : - : f . m : r . d : r : - :" },
      { solfa: ": s : - . m : d . m : s : l . s : f . m : r : - :" },
      { solfa: ": m . r : d . r : m : m : r . r : m . r : d : - :" },
    ],
    niveauJeu: "Le rythme : temps et demi-temps",
  },
  {
    id: "pointe",
    titre: "5. Le temps pointé « ., »",
    resume: "Une note longue et une note très courte.",
    explication: [
      "Le signe « ., » coupe le temps en une partie longue (trois quarts) et une partie très courte (un quart).",
      "« : d .,r : » se chante « Doooo-ré » : le Do est long, le Ré arrive juste avant le temps suivant. C'est un rythme sautillant.",
    ],
    regles: [{ signe: ": d .,r :", sens: "d long (¾) + r très court (¼)" }],
    exemples: [
      { solfa: ": d .,d : r .,r : m : - :", aide: "Comparez avec « : d . d : »." },
    ],
    exercices: [
      { solfa: ": s .,f : m .,r : d : - : m .,f : s .,l : s : - :" },
      { solfa: ": d : m .,m : s : s .,l : s : m .,r : d : - :" },
    ],
    niveauJeu: "Le temps pointé",
  },
  {
    id: "trois-quatre",
    titre: "6. Trois ou quatre notes dans un temps « , »",
    resume: "Le quart de temps.",
    explication: [
      "La virgule « , » coupe chaque moitié du temps en deux : on obtient des quarts de temps.",
      "« : d . r ,m : » = un demi-temps puis deux quarts. « : d ,r . m : » = deux quarts puis un demi-temps. « : d ,r . m ,f : » = quatre notes égales dans un seul temps.",
    ],
    regles: [
      { signe: ": d . r ,m :", sens: "½ + ¼ + ¼" },
      { signe: ": d ,r . m :", sens: "¼ + ¼ + ½" },
      { signe: ": d ,r . m ,f :", sens: "quatre quarts" },
    ],
    exemples: [
      { solfa: ": d . r ,m : f : d ,r . m : f :", aide: "Les deux façons de mettre trois notes dans un temps." },
      { solfa: ": d ,r . m ,f : s : s ,f . m ,r : d :", aide: "Quatre notes dans un temps, en montant puis en descendant." },
    ],
    exercices: [
      { solfa: ": s . f ,m : r : m ,f . s : - :" },
      { solfa: ": d ,r . m ,f : s : l ,s . f ,m : r : d ,t₁ . d ,r : d :" },
      { solfa: ": m . r ,d : r ,m . f : m . r ,d : d :" },
    ],
    niveauJeu: "Trois et quatre notes dans un temps",
  },
  {
    id: "silences",
    titre: "7. Les silences",
    resume: "Une place vide = on se tait.",
    explication: [
      "Quand une place est vide entre les signes, on ne chante pas : c'est un silence. On compte quand même le temps.",
      "« :   : » est un temps de silence. « : . d : » = on se tait la première moitié, puis on chante d. « : d . : » = on chante d, puis on se tait.",
      "Le silence sert souvent à respirer : profitez-en pour prendre votre souffle.",
    ],
    regles: [
      { signe: ":   :", sens: "un temps de silence" },
      { signe: ": . d :", sens: "silence, puis d sur le demi-temps" },
      { signe: ": d . :", sens: "d, puis silence" },
    ],
    exemples: [
      { solfa: ": d : r : m :   : m : r : d :   :", aide: "Un temps de silence à la fin de chaque phrase." },
    ],
    exercices: [
      { solfa: ": s . : s . : m :   : . r : r . m : d : - :" },
      { solfa: ": d : . d : m . m : s :   : . s : f . m : r :" },
    ],
    niveauJeu: "Les silences",
  },
];
