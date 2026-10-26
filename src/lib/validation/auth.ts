import { z } from "zod";

export const schemaConnexion = z.object({
  identifiant: z.string().trim().min(3, "Saisissez votre identifiant ou votre adresse e-mail.").max(120),
  motDePasse: z.string().min(1, "Saisissez votre mot de passe.").max(200),
});

export const schemaEmail = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
});

export const schemaNouveauMotDePasse = z
  .object({
    motDePasse: z
      .string()
      .min(10, "Le mot de passe doit contenir au moins 10 caractères.")
      .max(200)
      .regex(/[A-Za-z]/, "Le mot de passe doit contenir au moins une lettre.")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre."),
    confirmation: z.string(),
  })
  .refine((d) => d.motDePasse === d.confirmation, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmation"],
  });

export const estEmail = (s: string) => s.includes("@");
