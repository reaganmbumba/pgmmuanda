"use server";

import { z } from "zod";
import type { Etat } from "@/lib/etat-action";
import { VOIX } from "@/lib/membres/libelles";
import { photoValable } from "@/lib/photo";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";

const texte = (max: number) => z.string().trim().max(max, `${max} caractères maximum.`);

const schema = z.object({
  code: z.string().regex(/^[a-z0-9]{12,40}$/, "Ce lien n'est pas valable."),
  nom: texte(80).min(1, "Écrivez votre nom."),
  postnom: texte(80),
  prenom: texte(80).min(1, "Écrivez votre prénom."),
  sexe: z.enum(["M", "F"], { message: "Choisissez Homme ou Femme." }),
  telephone: z.string().trim().regex(/^\+?[0-9 ]{6,20}$/, "Numéro de téléphone : chiffres seulement, ex. +243 81 234 5678."),
  email: z.union([z.literal(""), z.string().trim().toLowerCase().email("Adresse e-mail invalide.")]),
  paroisseId: z.string().uuid("Choisissez votre paroisse."),
  choraleId: z.union([z.literal(""), z.string().uuid()]),
  voix: z.union([z.literal(""), z.enum(Object.keys(VOIX) as [keyof typeof VOIX])]),
  photo: z.string().min(1, "Ajoutez votre photo.").refine(photoValable, "La photo n'a pas pu être lue. Choisissez une autre photo."),
});

export async function deposerInscription(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return { erreur: "Mode maquette : l'inscription est désactivée." };
  const d = schema.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const v = d.data;
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc("inscription_deposer", {
    p_code: v.code, p_nom: v.nom, p_postnom: v.postnom, p_prenom: v.prenom, p_sexe: v.sexe,
    p_telephone: v.telephone, p_email: v.email, p_paroisse: v.paroisseId, p_chorale: v.choraleId || null,
    p_voix: v.voix, p_photo: v.photo,
  });
  if (error) return { erreur: error.code === "P0001" ? error.message : "L'envoi a échoué. Vérifiez votre connexion et réessayez." };
  return { succes: `Merci ${v.prenom} ! Votre inscription a bien été envoyée.` };
}
