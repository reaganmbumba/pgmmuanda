/** Correspondance entre les valeurs de la base et les libellés affichés. */
export const VOIX = { soprano: "Soprano", alto: "Alto", tenor: "Ténor", basse: "Basse" } as const;
export type CodeVoix = keyof typeof VOIX;

export const STATUTS = {
  en_attente: "En attente",
  actif: "Actif",
  inactif: "Inactif",
  suspendu: "Suspendu",
} as const;
export type CodeStatut = keyof typeof STATUTS;

export const CHAMPS_MEMBRE: Record<string, string> = {
  nom: "Nom",
  postnom: "Postnom",
  prenom: "Prénom",
  sexe: "Sexe",
  telephone: "Téléphone",
  email: "Adresse e-mail",
  paroisse_id: "Paroisse",
  chorale_id: "Chorale",
  voix: "Voix",
  fonction: "Fonction",
  date_adhesion: "Date d'adhésion",
  statut: "Statut",
  archive: "Archivé",
  profil_id: "Compte de connexion",
  photo_url: "Photo",
  carte: "Carte",
  motif: "Motif",
};

/** Champs qu'un choriste peut demander à corriger. */
export const CHAMPS_CORRIGEABLES = {
  nom: "Nom",
  postnom: "Postnom",
  prenom: "Prénom",
  telephone: "Téléphone",
  email: "Adresse e-mail",
  voix: "Voix",
  chorale: "Chorale",
  autre: "Autre",
} as const;
export type ChampCorrigeable = keyof typeof CHAMPS_CORRIGEABLES;

/** Champs qu'une correction acceptée peut appliquer automatiquement. */
export const CHAMPS_APPLICABLES = ["nom", "postnom", "prenom", "telephone", "email", "voix"] as const;

export const TYPES_HISTORIQUE: Record<string, string> = {
  creation: "Inscription",
  modification: "Modification",
  nomination: "Nomination",
  statut: "Changement de statut",
  archivage: "Archivage",
  carte: "Carte de membre",
};

export const STATUTS_DEMANDE: Record<string, string> = {
  en_attente: "En attente",
  acceptee: "Acceptée",
  refusee: "Refusée",
};
