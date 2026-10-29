import { z } from "zod";
import { VOIX } from "@/lib/membres/libelles";
import {
  DEVISES, SENS_OPERATION, STATUTS_FORMATION, STATUTS_INSCRIPTION, STATUTS_PROJET, STATUTS_TACHE,
} from "@/lib/organisation/libelles";
import { depuisSaisieLocale } from "@/lib/programmes/libelles";

const texte = (max: number) => z.string().trim().max(max, `${max} caractères maximum.`);
const uuid = z.string().uuid("Choix invalide.");
const optionnel = <T extends z.ZodType>(s: T) =>
  z.string().trim().transform((v) => v || null).pipe(s.nullable() as unknown as z.ZodType<z.output<T> | null, string | null>);
const jour = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");
const saisieDate = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Date et heure invalides.");
const choix = <T extends Record<string, string>>(o: T, message = "Choix invalide.") =>
  z.enum(Object.keys(o) as [keyof T & string], { message });
/** Montant saisi « 150 000 » ou « 12,50 » → nombre. */
const montant = z.string().trim()
  .transform((v) => Number(v.replace(/\s/g, "").replace(",", ".")))
  .pipe(z.number({ message: "Montant invalide." }).finite("Montant invalide.").min(0, "Le montant ne peut pas être négatif.").max(1e12, "Montant trop grand."));

export const schemaCommission = z.object({
  nom: texte(120).min(2, "Indiquez le nom de la commission."),
  description: texte(500),
});

export const schemaMembreCommission = z.object({
  commissionId: uuid,
  membreId: z.string().uuid("Choisissez un membre."),
  fonction: texte(60).min(2, "Indiquez la fonction."),
});

export const schemaFormation = z.object({
  titre: texte(150).min(2, "Indiquez le titre de la formation."),
  description: texte(3000),
  formateur: texte(120),
  lieu: texte(150),
  debut: saisieDate,
  fin: optionnel(saisieDate),
  places: optionnel(z.coerce.number().int("Nombre de places invalide.").min(1, "Au moins 1 place.").max(1000)),
  commissionId: optionnel(uuid),
  statut: choix(STATUTS_FORMATION, "Statut invalide."),
}).refine((d) => !d.fin || d.fin >= d.debut, { message: "La fin doit être après le début.", path: ["fin"] });
export type DonneesFormation = z.infer<typeof schemaFormation>;
export const versLigneFormation = (d: DonneesFormation) => ({
  titre: d.titre, description: d.description, formateur: d.formateur, lieu: d.lieu,
  debut: depuisSaisieLocale(d.debut), fin: d.fin ? depuisSaisieLocale(d.fin) : null,
  places: d.places, commission_id: d.commissionId, statut: d.statut,
});

export const schemaEvaluation = z.object({
  statut: choix(STATUTS_INSCRIPTION, "Résultat invalide."),
  note: optionnel(z.string().transform((v) => Number(v.replace(",", "."))).pipe(
    z.number({ message: "Note invalide." }).min(0, "La note est entre 0 et 20.").max(20, "La note est entre 0 et 20."))),
  appreciation: texte(1000),
});

export const schemaProjet = z.object({
  titre: texte(150).min(2, "Indiquez le nom du projet."),
  description: texte(3000),
  commissionId: optionnel(uuid),
  responsable: texte(120),
  debut: optionnel(jour),
  finPrevue: optionnel(jour),
  budgetCdf: montant,
  budgetUsd: montant,
  statut: choix(STATUTS_PROJET, "Statut invalide."),
}).refine((d) => !d.debut || !d.finPrevue || d.finPrevue >= d.debut, { message: "La fin prévue doit être après le début.", path: ["finPrevue"] });
export type DonneesProjet = z.infer<typeof schemaProjet>;
export const versLigneProjet = (d: DonneesProjet) => ({
  titre: d.titre, description: d.description, commission_id: d.commissionId, responsable: d.responsable,
  debut: d.debut, fin_prevue: d.finPrevue, budget_cdf: d.budgetCdf, budget_usd: d.budgetUsd, statut: d.statut,
});

export const schemaTache = z.object({
  titre: texte(200).min(2, "Décrivez la tâche."),
  responsable: texte(120),
  echeance: optionnel(jour),
});
export const statutTache = choix(STATUTS_TACHE, "Statut invalide.");

export const schemaRapport = z.object({
  avancement: z.coerce.number({ message: "Avancement invalide." }).int().min(0).max(100, "L'avancement va de 0 à 100 %."),
  contenu: texte(5000).min(2, "Écrivez ce qui a été fait."),
});

export const schemaOperation = z.object({
  sens: choix(SENS_OPERATION, "Choisissez entrée ou sortie d'argent."),
  libelle: texte(200).min(2, "Indiquez le motif."),
  categorie: texte(60).min(2, "Choisissez une catégorie."),
  montant: montant.refine((m) => m > 0, "Le montant doit être supérieur à zéro."),
  devise: choix(DEVISES, "Devise invalide."),
  dateOperation: jour,
  projetId: optionnel(uuid),
  piece: texte(80),
});

export const schemaChambre = z.object({
  nom: texte(60).min(1, "Indiquez le nom ou le numéro de la chambre."),
  site: texte(120),
  capacite: z.coerce.number({ message: "Nombre de places invalide." }).int().min(1, "Au moins 1 place.").max(100),
  sexe: z.enum(["M", "F", ""], { message: "Choix invalide." }).transform((v) => v || null),
  notes: texte(500),
});

export const schemaAffectation = z.object({
  chambreId: z.string().uuid("Choisissez une chambre."),
  membreId: z.string().uuid("Choisissez un membre."),
  du: jour,
  au: jour,
  notes: texte(300),
}).refine((d) => d.au >= d.du, { message: "La date de départ doit être après l'arrivée.", path: ["au"] });

const lien = optionnel(z.string().max(500).url("Lien invalide.").refine((u) => u.startsWith("https://"), "Le lien doit commencer par https://"));
export const schemaChant = z.object({
  titre: texte(150).min(1, "Indiquez le titre du chant."),
  auteur: texte(120),
  langue: texte(40).min(2, "Choisissez la langue."),
  categorie: texte(60),
  paroles: texte(20000),
  lienPartition: lien,
  lienAudio: lien,
});
export const voixChant = (form: FormData) => form.getAll("voix").map(String).filter((v) => v in VOIX);

export const schemaCotisation = z.object({
  membreId: z.string().uuid("Membre invalide."),
  mois: z.string().regex(/^\d{4}-\d{2}-01$/, "Mois invalide."),
  montant: montant.pipe(z.number().positive("Indiquez le montant payé.")),
  devise: choix(DEVISES, "Monnaie invalide."),
});
