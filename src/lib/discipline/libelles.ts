/** Sanctions prévues par le Règlement intérieur (art. 26), de la plus légère à la plus lourde. */
export const TYPES_SANCTION = {
  avertissement: "Avertissement",
  blame: "Blâme",
  suspension: "Suspension",
  exclusion: "Exclusion",
} as const;
export type CodeSanction = keyof typeof TYPES_SANCTION;

/** Manquements qui « ne peuvent être tolérés » (Règlement intérieur, art. 27). */
export const MANQUEMENTS = [
  "Toute absence ou retard non justifié dans les différentes activités",
  "Désobéissance, dérangement, écarts de langage, grossièreté, désordre, insoumission, insolence ou violence",
  "Tenue indécente",
  "Refus de s'acquitter de ses contributions et de se produire sans raison valable",
  "Intoxication, incitation à la haine, injure, vol d'objets, dispute ou bagarre",
  "Piraterie des œuvres de la PGM (auteur, coauteur ou complice)",
  "Vente illicite des supports musicaux (CD, DVD, bandes…)",
  "Violation de consigne, indiscrétion ou abandon de troupes",
  "Danse mondaine, alcoolisme, débauche, adultère, avortement, attentat à la pudeur ou trafic d'influence",
  "Port de l'uniforme de la chorale en dehors de la production",
] as const;

/** Nombre d'absences sans motif à partir duquel le membre apparaît dans la liste. */
export const SEUIL_ABSENCES = 2;

/** Rappel du règlement, à envoyer par WhatsApp au membre souvent absent. */
export const messageRappelAbsences = (prenom: string, nombre: number, jours: number) => [
  `Paix ${prenom},`,
  `La PGM a noté ${nombre} absence${nombre > 1 ? "s" : ""} sans motif de votre part ces ${jours} derniers jours.`,
  "Règlement intérieur, art. 27 : « toute absence ou retard non justifié dans les différentes activités » ne peut être toléré.",
  "Art. 16 : la qualité de membre se perd aussi « par absence prolongée et non justifiée ».",
  "Si vous avez un empêchement, prévenez votre responsable pour que l'absence soit excusée.",
].join("\n");
