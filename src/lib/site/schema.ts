import { z } from "zod";

/* Validation des formulaires de l'espace « Site public ». */

const texteLibre = (max: number) => z.string().trim().max(max, `${max} caractères au plus.`).transform((v) => v || null);

export const schemaElementSite = z.object({
  rubrique: z.enum(["actualite", "chorale", "commission", "programme", "question", "audio", "soiree", "social", "pionnier"]),
  titre: z.string().trim().min(1, "Le titre est obligatoire.").max(200, "Le titre est trop long (200 caractères au plus)."),
  sousTitre: texteLibre(200).default(null),
  texte: texteLibre(20000).default(null),
  date: z.union([z.literal(""), z.iso.date("Date invalide.")]).optional().default("").transform((v) => v || null),
  image: z.union([z.literal(""), z.string().regex(/^images\/[A-Za-z0-9._-]{1,150}$/, "Image invalide.")]).optional().transform((v) => v || null),
  ordre: z.coerce.number().int().min(0).max(9999).optional().default(0),
});

export const CHEMIN_AUDIO = /^audios\/[A-Za-z0-9._-]{1,150}$/;

export const schemaReglagesSite = z.object({
  accueil_titre: z.string().trim().min(1, "Le titre de l'accueil est obligatoire.").max(200),
  accueil_texte: z.string().trim().min(1, "Le texte de l'accueil est obligatoire.").max(2000),
  telephone: z.string().trim().regex(/^\+?[\d\s.-]{8,20}$/, "Numéro de téléphone invalide (ex. +243 825 717 444)."),
  whatsapp_message: z.string().trim().max(500),
  youtube_chaine: z.string().trim().regex(/^@?[\w.-]{3,100}$/, "Nom de chaîne invalide (ex. pgmmuanda)."),
  causerie_ouverte: z.enum(["oui", "non"]),
  youtube_id: z.union([z.literal(""), z.string().trim().regex(/^UC[\w-]{22}$/, "L'identifiant commence par UC et fait 24 caractères.")]),
});
