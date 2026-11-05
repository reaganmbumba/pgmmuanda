"use server";

import { z } from "zod";
import { emailTechnique, problemeMotDePasse } from "@/lib/auth/comptes";
import { utilisateurCourant } from "@/lib/auth/session";
import type { Etat } from "@/lib/etat-action";
import { VOIX } from "@/lib/membres/libelles";
import { photoValable } from "@/lib/photo";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientAdmin } from "@/lib/supabase/admin";
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
  motDePasse: z.string().superRefine((m, ctx) => {
    const probleme = problemeMotDePasse(m);
    if (probleme) ctx.addIssue({ code: "custom", message: probleme });
  }),
});

/** Accès donnés à la personne à la fin de son inscription (affichés une seule fois). */
export type EtatInscription = (NonNullable<Etat> & { acces?: { identifiant: string; motDePasse: string; connecte: boolean } }) | undefined;

/** « Grâce Mavungu » → « grace.mavungu » : lettres sans accents, chiffres et points seulement. */
function baseIdentifiant(prenom: string, nom: string) {
  const propre = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const base = [propre(prenom), propre(nom)].filter(Boolean).join(".").slice(0, 34);
  return base.length >= 3 ? base : `membre.${base}`.replace(/\.$/, "");
}

/** Crée le compte (rôle choriste) avec le premier identifiant libre. Renvoie null en cas d'échec. */
async function creerCompteInscrit(prenom: string, nom: string, motDePasse: string, paroisseId: string) {
  const admin = creerClientAdmin();
  if (!admin) return null;
  const base = baseIdentifiant(prenom, nom);
  for (let n = 1; n <= 30; n++) {
    const identifiant = n === 1 ? base : `${base}${n}`;
    const { data: pris } = await admin.from("profils").select("id").eq("identifiant", identifiant).maybeSingle();
    if (pris) continue;
    const { data, error } = await admin.auth.admin.createUser({
      email: emailTechnique(identifiant), password: motDePasse, email_confirm: true,
      user_metadata: { nom_affiche: `${prenom} ${nom}` },
    });
    if (error?.code === "email_exists") continue;
    if (error || !data.user) {
      console.error("Compte d'inscription refusé par Supabase :", error?.code, error?.message);
      return null;
    }
    const { error: e2 } = await admin.from("profils")
      .update({ identifiant, nom_affiche: `${prenom} ${nom}`, role: "choriste", paroisse_id: paroisseId }).eq("id", data.user.id);
    if (e2) {
      await admin.auth.admin.deleteUser(data.user.id);
      if (e2.code === "23505") continue;
      console.error("Profil du compte d'inscription refusé :", e2.code, e2.message);
      return null;
    }
    return { id: data.user.id, identifiant };
  }
  return null;
}

export async function deposerInscription(_: EtatInscription, form: FormData): Promise<EtatInscription> {
  if (!supabaseActif) return { erreur: "Mode maquette : l'inscription est désactivée." };
  const d = schema.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const v = d.data;
  const supabase = await creerClientServeur();
  const { data: inscriptionId, error } = await supabase.rpc("inscription_deposer", {
    p_code: v.code, p_nom: v.nom, p_postnom: v.postnom, p_prenom: v.prenom, p_sexe: v.sexe,
    p_telephone: v.telephone, p_email: v.email, p_paroisse: v.paroisseId, p_chorale: v.choraleId || null,
    p_voix: v.voix, p_photo: v.photo,
  });
  if (error || !inscriptionId) {
    return { erreur: error?.code === "P0001" ? error.message : "L'envoi a échoué. Vérifiez votre connexion et réessayez." };
  }

  // Le compte est créé tout de suite ; la fiche de membre viendra avec la validation du staff.
  const compte = await creerCompteInscrit(v.prenom, v.nom, v.motDePasse, v.paroisseId);
  const merci = `Merci ${v.prenom} ! Votre inscription a bien été envoyée.`;
  if (!compte) return { succes: `${merci} Votre compte sera créé par le responsable.` };
  await creerClientAdmin()!.from("inscriptions").update({ profil_id: compte.id }).eq("id", inscriptionId);

  // Connexion immédiate, sauf si quelqu'un est déjà connecté sur ce téléphone (ex. un responsable qui aide)
  let connecte = false;
  if (!(await utilisateurCourant())) {
    const { error: e } = await supabase.auth.signInWithPassword({ email: emailTechnique(compte.identifiant), password: v.motDePasse });
    connecte = !e;
  }
  return { succes: merci, acces: { identifiant: compte.identifiant, motDePasse: v.motDePasse, connecte } };
}
