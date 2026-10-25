export type Voix = "Soprano" | "Alto" | "Ténor" | "Basse";
export type StatutMembre = "En attente" | "Actif" | "Inactif" | "Suspendu";
export type StatutCarte = "Active" | "Révoquée" | "Remplacée";
export type StatutActivite =
  | "Prévu"
  | "Confirmé"
  | "Réalisé"
  | "Reporté"
  | "Annulé";

export type Membre = {
  matricule: string;
  nom: string;
  postnom: string;
  prenom: string;
  sexe: "M" | "F";
  telephone: string;
  email: string;
  paroisse: string;
  chorale: string;
  voix: Voix;
  fonction: string;
  dateAdhesion: string;
  statut: StatutMembre;
  chambre?: string;
  carte: { reference: string; statut: StatutCarte; dateEmission: string };
};

export type Activite = {
  id: string;
  titre: string;
  description: string;
  debut: string;
  lieu: string;
  paroisse: string;
  commission: string;
  responsable: string;
  statut: StatutActivite;
};

export type Annonce = {
  id: string;
  titre: string;
  type: "Officielle" | "Communiqué" | "Invitation" | "Changement" | "Urgente";
  extrait: string;
  date: string;
  cible: string;
};
