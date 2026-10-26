import { z } from "zod";
import { CHAMPS_CORRIGEABLES, STATUTS, VOIX } from "@/lib/membres/libelles";

const texte = (max: number) => z.string().trim().max(max, `${max} caractères maximum.`);
const optionnel = <O,>(schema: z.ZodType<O, string>) =>
  z.string().trim().transform((v) => v || null).pipe(schema.nullable());

export const schemaMembre = z.object({
  id: optionnel(z.string().uuid()),
  nom: texte(80).min(1, "Indiquez le nom."),
  postnom: texte(80),
  prenom: texte(80).min(1, "Indiquez le prénom."),
  sexe: optionnel(z.enum(["M", "F"], { message: "Sexe invalide." })),
  telephone: optionnel(
    z.string().regex(/^\+?[0-9 ]{6,20}$/, "Téléphone : chiffres et espaces uniquement, ex. +243 81 234 5678."),
  ),
  email: optionnel(z.string().toLowerCase().email("Adresse e-mail invalide.")),
  paroisseId: z.string().uuid("Choisissez la paroisse."),
  choraleId: optionnel(z.string().uuid()),
  voix: optionnel(z.enum(Object.keys(VOIX) as [keyof typeof VOIX], { message: "Voix invalide." })),
  fonction: texte(80).min(2, "Indiquez la fonction (ex. Choriste)."),
  dateAdhesion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date d'adhésion invalide."),
  statut: z.enum(Object.keys(STATUTS) as [keyof typeof STATUTS], { message: "Statut invalide." }),
});
export type DonneesMembre = z.infer<typeof schemaMembre>;

/** Colonnes de la table membres correspondant au formulaire. */
export const versLigne = (d: DonneesMembre) => ({
  nom: d.nom,
  postnom: d.postnom,
  prenom: d.prenom,
  sexe: d.sexe,
  telephone: d.telephone,
  email: d.email,
  paroisse_id: d.paroisseId,
  chorale_id: d.choraleId,
  voix: d.voix,
  fonction: d.fonction,
  date_adhesion: d.dateAdhesion,
  statut: d.statut,
});

export const schemaDemandeCorrection = z
  .object({
    champ: z.enum(Object.keys(CHAMPS_CORRIGEABLES) as [keyof typeof CHAMPS_CORRIGEABLES], {
      message: "Choisissez l'information à corriger.",
    }),
    valeur: texte(500).min(1, "Indiquez la valeur correcte."),
    motif: texte(500),
  })
  .superRefine((d, ctx) => {
    if (d.champ === "voix" && !(d.valeur in VOIX))
      ctx.addIssue({ code: "custom", message: "Choisissez une voix.", path: ["valeur"] });
    if (d.champ === "telephone" && !/^\+?[0-9 ]{6,20}$/.test(d.valeur))
      ctx.addIssue({ code: "custom", message: "Numéro de téléphone invalide.", path: ["valeur"] });
    if (d.champ === "email" && !z.string().email().safeParse(d.valeur).success)
      ctx.addIssue({ code: "custom", message: "Adresse e-mail invalide.", path: ["valeur"] });
  });

export const schemaParoisse = z.object({
  nom: texte(120).min(2, "Indiquez le nom de la paroisse."),
  ville: texte(80).min(2, "Indiquez la ville.").default("Muanda"),
});

export const schemaChorale = z.object({
  paroisseId: z.string().uuid("Choisissez la paroisse."),
  nom: texte(120).min(2, "Indiquez le nom de la chorale."),
});
