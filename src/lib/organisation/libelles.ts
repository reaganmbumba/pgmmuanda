export const STATUTS_FORMATION = { planifiee: "Planifiée", en_cours: "En cours", terminee: "Terminée", annulee: "Annulée" } as const;
export type CodeStatutFormation = keyof typeof STATUTS_FORMATION;

export const STATUTS_INSCRIPTION = { inscrit: "Inscrit", valide: "Validé", non_valide: "Non validé", abandon: "Abandon" } as const;
export type CodeStatutInscription = keyof typeof STATUTS_INSCRIPTION;

export const STATUTS_PROJET = { planifie: "Planifié", en_cours: "En cours", suspendu: "Suspendu", termine: "Terminé", annule: "Annulé" } as const;
export type CodeStatutProjet = keyof typeof STATUTS_PROJET;

export const STATUTS_TACHE = { a_faire: "À faire", en_cours: "En cours", terminee: "Terminée" } as const;
export type CodeStatutTache = keyof typeof STATUTS_TACHE;

export const DEVISES = { CDF: "Francs congolais (FC)", USD: "Dollars (USD)" } as const;
export type Devise = keyof typeof DEVISES;

export const SENS_OPERATION = { recette: "Entrée d'argent", depense: "Sortie d'argent" } as const;
export type SensOperation = keyof typeof SENS_OPERATION;

export const CATEGORIES_FINANCES = [
  "Cotisations", "Dons", "Offrandes", "Transport", "Hébergement", "Restauration",
  "Matériel", "Location", "Communication", "Divers",
];
export const FONCTIONS_COMMISSION = ["Responsable", "Adjoint", "Secrétaire", "Trésorier", "Membre"];
export const LANGUES = ["Français", "Lingala", "Kikongo", "Swahili", "Tshiluba", "Anglais", "Autre"];

const formats: Record<Devise, Intl.NumberFormat> = {
  CDF: new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
};
/** « 150 000 FC », « 25,00 $ » (espaces fines remplacées : lisibles partout). */
export const formatMontant = (montant: number, devise: Devise) =>
  `${formats[devise].format(montant).replace(/ | /g, " ")} ${devise === "CDF" ? "FC" : "$"}`;

export type Bilan = Record<Devise, { recettes: number; depenses: number; solde: number }>;

/** Totaux par devise : les francs et les dollars ne sont jamais additionnés ensemble. */
export function bilan(ops: { sens: SensOperation; montant: number; devise: Devise }[]): Bilan {
  const b: Bilan = { CDF: { recettes: 0, depenses: 0, solde: 0 }, USD: { recettes: 0, depenses: 0, solde: 0 } };
  for (const o of ops) {
    // Calcul en centimes pour éviter les erreurs d'arrondi
    const c = Math.round(o.montant * 100);
    if (o.sens === "recette") b[o.devise].recettes += c;
    else b[o.devise].depenses += c;
  }
  for (const d of Object.keys(b) as Devise[]) {
    b[d] = { recettes: b[d].recettes / 100, depenses: b[d].depenses / 100, solde: (b[d].recettes - b[d].depenses) / 100 };
  }
  return b;
}

/** Nombre de personnes logées dans une chambre un jour donné (AAAA-MM-JJ). */
export const occupation = (affectations: { du: string; au: string }[], jour: string) =>
  affectations.filter((a) => a.du <= jour && jour <= a.au).length;

/** Jours entre deux dates incluses (AAAA-MM-JJ) : « 3 nuits » pour du 20 au 23. */
export const nuits = (du: string, au: string) => Math.round((Date.parse(au) - Date.parse(du)) / 86_400_000);

/** « 20 déc. → 23 déc. 2026 » */
const jourCourt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const jourLong = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const formatJour = (jour: string) => jourLong.format(new Date(`${jour}T00:00:00Z`));
export const formatPeriode = (du: string, au: string) =>
  du === au ? formatJour(du) : `du ${jourCourt.format(new Date(`${du}T00:00:00Z`))} au ${formatJour(au)}`;
