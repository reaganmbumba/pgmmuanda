/**
 * JEU DE DONNÉES DE DÉMONSTRATION — maquettes de l'Étape 1.
 * Toutes ces personnes sont fictives. Ces données seront remplacées
 * par la base Supabase à l'Étape 2 et ne doivent jamais servir en production.
 */
import type { Activite, Annonce, Membre } from "./types";
import type { Affectation, Chambre, Chant, Commission, MaFormation, Operation, Projet } from "./organisation/depot";

export const MODE_DEMO = true;

export const paroisses = [
  "Muanda-Centre",
  "Nsiamfumu",
  "Banana",
  "Kimuabi",
  "Tonde",
];

export const membres: Membre[] = [
  {
    matricule: "PGM-MUA-0001",
    nom: "Nkanga",
    postnom: "Mavungu",
    prenom: "Daniel",
    sexe: "M",
    telephone: "+243 81 000 0001",
    email: "daniel.demo@example.org",
    paroisse: "Muanda-Centre",
    chorale: "Chorale Centrale",
    voix: "Ténor",
    fonction: "Chef de chœur",
    dateAdhesion: "2018-03-11",
    statut: "Actif",
    chambre: "B-12",
    carte: { reference: "demo-7Hq2LmZx9Kp4Rt", statut: "Active", dateEmission: "2026-01-15" },
  },
  {
    matricule: "PGM-MUA-0002",
    nom: "Lusala",
    postnom: "Mbuku",
    prenom: "Esther",
    sexe: "F",
    telephone: "+243 82 000 0002",
    email: "esther.demo@example.org",
    paroisse: "Muanda-Centre",
    chorale: "Chorale Centrale",
    voix: "Soprano",
    fonction: "Choriste",
    dateAdhesion: "2020-07-02",
    statut: "Actif",
    carte: { reference: "demo-Vc8nWq3Ty6Bm2D", statut: "Active", dateEmission: "2026-01-15" },
  },
  {
    matricule: "PGM-MUA-0003",
    nom: "Makiadi",
    postnom: "Nzuzi",
    prenom: "Ruth",
    sexe: "F",
    telephone: "+243 89 000 0003",
    email: "ruth.demo@example.org",
    paroisse: "Nsiamfumu",
    chorale: "Voix de Nsiamfumu",
    voix: "Alto",
    fonction: "Secrétaire de chorale",
    dateAdhesion: "2019-11-20",
    statut: "Actif",
    carte: { reference: "demo-Pz4Xk9Lr2Hs7Qa", statut: "Active", dateEmission: "2026-02-03" },
  },
  {
    matricule: "PGM-MUA-0004",
    nom: "Phanzu",
    postnom: "Kiese",
    prenom: "Samuel",
    sexe: "M",
    telephone: "+243 85 000 0004",
    email: "samuel.demo@example.org",
    paroisse: "Banana",
    chorale: "Écho de Banana",
    voix: "Basse",
    fonction: "Choriste",
    dateAdhesion: "2022-01-09",
    statut: "Suspendu",
    carte: { reference: "demo-Jm6Tn1Wy8Fe3Ku", statut: "Révoquée", dateEmission: "2025-06-10" },
  },
  {
    matricule: "PGM-MUA-0005",
    nom: "Ndombasi",
    postnom: "Luzolo",
    prenom: "Grâce",
    sexe: "F",
    telephone: "+243 81 000 0005",
    email: "grace.demo@example.org",
    paroisse: "Kimuabi",
    chorale: "Louange Kimuabi",
    voix: "Soprano",
    fonction: "Responsable des sopranos",
    dateAdhesion: "2017-05-14",
    statut: "Actif",
    chambre: "A-04",
    carte: { reference: "demo-Rb5Gs8Cv2Nx6Lp", statut: "Active", dateEmission: "2026-01-20" },
  },
  {
    matricule: "PGM-MUA-0006",
    nom: "Kiala",
    postnom: "Mampuya",
    prenom: "Joël",
    sexe: "M",
    telephone: "+243 84 000 0006",
    email: "joel.demo@example.org",
    paroisse: "Tonde",
    chorale: "Harmonie de Tonde",
    voix: "Ténor",
    fonction: "Choriste",
    dateAdhesion: "2026-09-28",
    statut: "En attente",
    carte: { reference: "demo-Hk3Dm7Qw9Zr4Ty", statut: "Active", dateEmission: "2026-10-01" },
  },
  {
    matricule: "PGM-MUA-0007",
    nom: "Mbumba",
    postnom: "Tsasa",
    prenom: "Naomi",
    sexe: "F",
    telephone: "+243 82 000 0007",
    email: "naomi.demo@example.org",
    paroisse: "Nsiamfumu",
    chorale: "Voix de Nsiamfumu",
    voix: "Alto",
    fonction: "Choriste",
    dateAdhesion: "2021-04-18",
    statut: "Inactif",
    carte: { reference: "demo-Lq2Wf6Bn8Ms3Vc", statut: "Active", dateEmission: "2025-09-12" },
  },
  {
    matricule: "PGM-MUA-0008",
    nom: "Ngoma",
    postnom: "Bazola",
    prenom: "Élie",
    sexe: "M",
    telephone: "+243 89 000 0008",
    email: "elie.demo@example.org",
    paroisse: "Banana",
    chorale: "Écho de Banana",
    voix: "Basse",
    fonction: "Trésorier de chorale",
    dateAdhesion: "2016-08-30",
    statut: "Actif",
    carte: { reference: "demo-Ty9Kp3Hx7Dw2Qs", statut: "Active", dateEmission: "2026-01-15" },
  },
  {
    matricule: "PGM-MUA-0009",
    nom: "Vuvu",
    postnom: "Makengo",
    prenom: "Sarah",
    sexe: "F",
    telephone: "+243 85 000 0009",
    email: "sarah.demo@example.org",
    paroisse: "Muanda-Centre",
    chorale: "Chorale Centrale",
    voix: "Alto",
    fonction: "Choriste",
    dateAdhesion: "2026-10-12",
    statut: "En attente",
    carte: { reference: "demo-Mx4Rn8Gk2Bv6Wp", statut: "Active", dateEmission: "2026-10-14" },
  },
  {
    matricule: "PGM-MUA-0010",
    nom: "Lunkebila",
    postnom: "Nsimba",
    prenom: "Paul",
    sexe: "M",
    telephone: "+243 81 000 0010",
    email: "paul.demo@example.org",
    paroisse: "Kimuabi",
    chorale: "Louange Kimuabi",
    voix: "Ténor",
    fonction: "Choriste",
    dateAdhesion: "2023-02-05",
    statut: "Actif",
    carte: { reference: "demo-Qs7Vb3Lz9Hn2Kt", statut: "Active", dateEmission: "2026-01-15" },
  },
];

export const activites: Activite[] = [
  {
    id: "act-1",
    titre: "Répétition générale des quatre voix",
    description: "Préparation des chants du culte de clôture.",
    debut: "2026-10-28T16:00:00",
    lieu: "Temple de Muanda-Centre",
    paroisse: "Toutes",
    commission: "Commission artistique",
    responsable: "Daniel Nkanga",
    statut: "Confirmé",
  },
  {
    id: "act-2",
    titre: "Réunion des responsables de paroisses",
    description: "Bilan du trimestre et calendrier de fin d'année.",
    debut: "2026-10-31T10:00:00",
    lieu: "Salle de la PGM",
    paroisse: "Toutes",
    commission: "Présidence",
    responsable: "Présidence PGM",
    statut: "Prévu",
  },
  {
    id: "act-3",
    titre: "Formation solfège — niveau 1",
    description: "Lecture de partition et rythme, pour les nouveaux membres.",
    debut: "2026-11-04T15:00:00",
    lieu: "Paroisse Nsiamfumu",
    paroisse: "Nsiamfumu",
    commission: "Commission formation",
    responsable: "Ruth Makiadi",
    statut: "Prévu",
  },
  {
    id: "act-4",
    titre: "Concert de louange de Noël",
    description: "Grand concert inter-paroisses.",
    debut: "2026-12-20T17:00:00",
    lieu: "Place de Muanda",
    paroisse: "Toutes",
    commission: "Commission événements",
    responsable: "Présidence PGM",
    statut: "Prévu",
  },
];

export const annonces: Annonce[] = [
  {
    id: "ann-1",
    titre: "Changement d'horaire de la répétition générale",
    type: "Changement",
    extrait: "La répétition du 28 octobre commence à 16 h au lieu de 15 h.",
    date: "2026-10-24",
    cible: "Tous les membres",
  },
  {
    id: "ann-2",
    titre: "Distribution des nouvelles cartes de membres",
    type: "Officielle",
    extrait: "Les cartes seront remises par paroisse à partir du 2 novembre.",
    date: "2026-10-22",
    cible: "Tous les membres",
  },
  {
    id: "ann-3",
    titre: "Invitation au concert de Noël",
    type: "Invitation",
    extrait: "Toutes les chorales sont invitées à confirmer leur participation.",
    date: "2026-10-20",
    cible: "Responsables de chorales",
  },
];

/** Présences de démonstration du choriste connecté (PGM-MUA-0001). */
export const mesPresences = [
  { date: "2026-10-21", activite: "Répétition hebdomadaire", statut: "Présent" },
  { date: "2026-10-14", activite: "Répétition hebdomadaire", statut: "Présent" },
  { date: "2026-10-10", activite: "Réunion des chefs de chœur", statut: "Excusé" },
  { date: "2026-10-07", activite: "Répétition hebdomadaire", statut: "Présent" },
  { date: "2026-09-30", activite: "Répétition hebdomadaire", statut: "Absent" },
] as const;

export const choristeConnecte = membres[0];

export function trouverParReference(ref: string) {
  return membres.find((m) => m.carte.reference === ref);
}

export function trouverParMatricule(matricule: string) {
  const m = matricule.trim().toUpperCase();
  return membres.find((x) => x.matricule === m);
}

// ---------------------------------------------------------------------
// Étape 7 (maquette uniquement)
// ---------------------------------------------------------------------
export const commissionsDemo: Commission[] = [
  { id: "com-1", nom: "Commission artistique", description: "Répertoire, répétitions et direction musicale", nbMembres: 8 },
  { id: "com-2", nom: "Commission formation", description: "Solfège, technique vocale et évaluations", nbMembres: 5 },
  { id: "com-3", nom: "Commission événements", description: "Concerts, accueil et hébergement", nbMembres: 6 },
];

const formation = {
  description: "", formateur: "Daniel Nkanga", fin: null, commissionId: "com-2", commission: "Commission formation",
} as const;
export const formationsDemo: MaFormation[] = [
  { ...formation, id: "for-1", titre: "Solfège pour débutants", lieu: "Salle de la PGM", debut: "2026-11-07T09:00:00+01:00",
    places: 20, statutCode: "planifiee", statut: "Planifiée", nbInscrits: 14, resultatCode: "inscrit", resultat: "Inscrit", note: null, appreciation: "" },
  { ...formation, id: "for-2", titre: "Technique vocale : la respiration", lieu: "Temple de Muanda-Centre", debut: "2026-09-12T09:00:00+01:00",
    places: null, statutCode: "terminee", statut: "Terminée", nbInscrits: 22, resultatCode: "valide", resultat: "Validé", note: 15.5,
    appreciation: "Bonne maîtrise du souffle." },
];
export const mesFormationsDemo = formationsDemo;

export const projetsDemo: Projet[] = [
  { id: "pro-1", titre: "Achat de pupitres et d'un clavier", description: "", commissionId: "com-1", commission: "Commission artistique",
    responsable: "Esther Lusala", debut: "2026-09-01", finPrevue: "2026-12-15", budgetCdf: 1_500_000, budgetUsd: 350,
    statutCode: "en_cours", statut: "En cours", avancement: 45 },
  { id: "pro-2", titre: "Concert de Noël 2026", description: "", commissionId: "com-3", commission: "Commission événements",
    responsable: "Samuel Phanzu", debut: "2026-10-15", finPrevue: "2026-12-24", budgetCdf: 800_000, budgetUsd: 0,
    statutCode: "planifie", statut: "Planifié", avancement: 10 },
];

export const operationsDemo: Operation[] = [
  { id: "op-1", sens: "recette", libelle: "Cotisations d'octobre", categorie: "Cotisations", montant: 450_000, devise: "CDF", date: "2026-10-20", projetId: null, projet: "", piece: "R-014" },
  { id: "op-2", sens: "depense", libelle: "Acompte menuisier (pupitres)", categorie: "Matériel", montant: 300_000, devise: "CDF", date: "2026-10-18", projetId: "pro-1", projet: "Achat de pupitres et d'un clavier", piece: "F-203" },
  { id: "op-3", sens: "recette", libelle: "Don d'un fidèle", categorie: "Dons", montant: 200, devise: "USD", date: "2026-10-12", projetId: null, projet: "", piece: "" },
  { id: "op-4", sens: "depense", libelle: "Transport des choristes", categorie: "Transport", montant: 45, devise: "USD", date: "2026-10-05", projetId: null, projet: "", piece: "R-011" },
];

export const chambresDemo: Chambre[] = [
  { id: "ch-1", nom: "Chambre 1", site: "Internat de Muanda", capacite: 4, sexe: "M", notes: "", active: true },
  { id: "ch-2", nom: "Chambre 2", site: "Internat de Muanda", capacite: 4, sexe: "F", notes: "", active: true },
  { id: "ch-3", nom: "Chambre familiale", site: "Maison d'accueil", capacite: 3, sexe: null, notes: "Rez-de-chaussée", active: true },
];
export const affectationsDemo: Affectation[] = [
  { id: "af-1", chambreId: "ch-1", chambre: "Chambre 1", site: "Internat de Muanda", membreId: "m1", nom: "Daniel Nkanga Mavungu",
    matricule: "PGM-MUA-0001", paroisse: "Muanda-Centre", du: "2026-12-22", au: "2026-12-26", notes: "Apportez vos draps." },
  { id: "af-2", chambreId: "ch-2", chambre: "Chambre 2", site: "Internat de Muanda", membreId: "m2", nom: "Esther Lusala Mbuku",
    matricule: "PGM-MUA-0002", paroisse: "Muanda-Centre", du: "2026-12-22", au: "2026-12-26", notes: "" },
];

export const chantsDemo: Chant[] = [
  { id: "cha-1", titre: "Nzambe azali malamu", auteur: "Traditionnel", langue: "Lingala", categorie: "Louange", paroles: "",
    voixCodes: [], voix: "Toutes les voix", lienPartition: "https://exemple.org/partition.pdf", lienAudio: null, archive: false },
  { id: "cha-2", titre: "Yesu kele ntinu", auteur: "", langue: "Kikongo", categorie: "Adoration", paroles: "",
    voixCodes: [], voix: "Toutes les voix", lienPartition: null, lienAudio: "https://exemple.org/audio", archive: false },
  { id: "cha-3", titre: "Gloire à Dieu", auteur: "Chorale de Muanda", langue: "Français", categorie: "Noël", paroles: "",
    voixCodes: ["tenor", "basse"], voix: "Ténor, Basse", lienPartition: "https://exemple.org/p2.pdf", lienAudio: null, archive: false },
];
