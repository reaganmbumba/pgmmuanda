import { z } from "zod";
import { ROLES } from "@/lib/auth/roles";

const uuidOuVide = z
  .string()
  .trim()
  .transform((v) => v || null)
  .pipe(z.string().uuid().nullable());

const identifiant = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v) => v || null)
  .pipe(z.string().regex(/^[a-z0-9._-]{3,40}$/, "Identifiant : 3 à 40 caractères (lettres, chiffres, . _ -).").nullable());

const perimetre = <T extends { role: string; paroisseId: string | null; commissionId: string | null }>(d: T, ctx: z.RefinementCtx) => {
  if (d.role === "responsable_paroisse" && !d.paroisseId)
    ctx.addIssue({ code: "custom", message: "Choisissez la paroisse de ce responsable.", path: ["paroisseId"] });
  if (d.role === "responsable_commission" && !d.commissionId)
    ctx.addIssue({ code: "custom", message: "Choisissez la commission de ce responsable.", path: ["commissionId"] });
};

export const schemaNouveauCompte = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .transform((v) => v || null)
      .pipe(z.string().email("Adresse e-mail invalide.").nullable()),
    nom: z.string().trim().min(2, "Indiquez le nom de la personne.").max(80),
    identifiant: identifiant.pipe(z.string({ message: "Choisissez un identifiant (ex. : daniel.nkanga)." })),
    role: z.enum(ROLES, { message: "Rôle invalide." }),
    paroisseId: uuidOuVide,
    commissionId: uuidOuVide,
  })
  .superRefine(perimetre);

export const schemaModification = z
  .object({
    id: z.string().uuid(),
    role: z.enum(ROLES, { message: "Rôle invalide." }),
    paroisseId: uuidOuVide,
    commissionId: uuidOuVide,
    actif: z.enum(["oui", "non"]).transform((v) => v === "oui"),
  })
  .superRefine(perimetre);
