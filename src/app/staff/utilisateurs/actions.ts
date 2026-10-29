"use server";

import { revalidatePath } from "next/cache";
import { utilisateurCourant } from "@/lib/auth/session";
import { estAdmin, peutRecevoirAccesFinances, rolesAttribuables, type Role } from "@/lib/auth/roles";
import { emailTechnique, messageAcces, motDePasseProvisoire } from "@/lib/auth/comptes";
import { creerClientAdmin, problemeCleServeur } from "@/lib/supabase/admin";
import { URL_SITE } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaNouveauCompte, schemaModification } from "@/lib/validation/utilisateurs";

export type Etat = { erreur?: string; succes?: string } | undefined;
/** Accès à transmettre à la personne : affiché une seule fois, jamais enregistré en clair. */
export type EtatAcces = (NonNullable<Etat> & { acces?: { nom: string; identifiant: string; motDePasse: string; message: string } }) | undefined;

/** Raison lisible d'un refus de Supabase Auth, pour que l'administration sache quoi faire. */
function raisonAuth(e: { code?: string; message?: string } | null): string {
  if (e?.code === "no_authorization" || e?.code === "bad_jwt" || /bearer token|invalid jwt|not_admin/i.test(`${e?.code} ${e?.message}`)) {
    return `clé serveur refusée par Supabase : ${problemeCleServeur() ?? "la clé SUPABASE_SERVICE_ROLE_KEY de Vercel n'est pas la bonne"}`;
  }
  if (e?.code === "weak_password") return "mot de passe refusé par les règles de Supabase";
  if (e?.code === "over_request_rate_limit" || e?.code === "over_email_send_rate_limit") return "trop d'essais, réessayez dans quelques minutes";
  if (e?.code === "unexpected_failure" || /database error/i.test(e?.message ?? "")) return "erreur de la base de données";
  return e?.message || e?.code || "raison inconnue";
}

export async function creerCompte(_: EtatAcces, form: FormData): Promise<EtatAcces> {
  const moi = await utilisateurCourant();
  if (!moi || !estAdmin(moi.role)) return { erreur: "Action réservée à l'administration." };

  const d = schemaNouveauCompte.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  if (!rolesAttribuables(moi.role).includes(d.data.role)) return { erreur: "Vous ne pouvez pas attribuer ce rôle." };

  const admin = creerClientAdmin();
  if (!admin) return { erreur: "La clé serveur SUPABASE_SERVICE_ROLE_KEY n'est pas configurée." };

  // Vérifié avant la création, pour ne pas laisser un compte sans profil complet
  const { data: pris } = await admin.from("profils").select("id").eq("identifiant", d.data.identifiant).maybeSingle();
  if (pris) return { erreur: "Cet identifiant est déjà utilisé. Choisissez-en un autre." };

  const motDePasse = d.data.motDePasse ?? motDePasseProvisoire();
  const { data, error } = await admin.auth.admin.createUser({
    email: d.data.email ?? emailTechnique(d.data.identifiant),
    password: motDePasse,
    email_confirm: true,
    user_metadata: { nom_affiche: d.data.nom },
  });
  if (error || !data.user) {
    if (error?.code === "email_exists") {
      return { erreur: d.data.email ? "Un compte existe déjà avec cette adresse e-mail." : "Cet identifiant est déjà utilisé. Choisissez-en un autre." };
    }
    console.error("Création de compte refusée par Supabase :", error?.code, error?.message);
    return { erreur: `Le compte n'a pas pu être créé (${raisonAuth(error)}).` };
  }

  const { error: e2 } = await admin
    .from("profils")
    .update({
      nom_affiche: d.data.nom,
      identifiant: d.data.identifiant,
      role: d.data.role,
      paroisse_id: d.data.paroisseId,
      commission_id: d.data.commissionId,
      // Seulement si besoin : la colonne n'existe qu'après le fichier SQL du responsable de chorale
      ...(d.data.choraleId ? { chorale_id: d.data.choraleId } : {}),
      acces_finances: d.data.accesFinances && peutRecevoirAccesFinances(d.data.role),
    })
    .eq("id", data.user.id);
  if (e2) {
    await admin.auth.admin.deleteUser(data.user.id);
    console.error("Profil du nouveau compte refusé :", e2.code, e2.message);
    return { erreur: e2.code === "23505" ? "Cet identifiant est déjà utilisé. Choisissez-en un autre."
      : e2.code === "23514" ? "Choisissez la paroisse ou la commission de ce responsable."
      : `Le compte n'a pas pu être créé (profil : ${e2.message}).` };
  }
  revalidatePath("/staff/utilisateurs");
  return {
    succes: `Compte créé pour ${d.data.nom}.`,
    acces: {
      nom: d.data.nom,
      identifiant: d.data.identifiant,
      motDePasse,
      message: messageAcces(d.data.nom, d.data.identifiant, motDePasse, URL_SITE),
    },
  };
}

/** Pour un membre qui a oublié son mot de passe : l'administration en donne un nouveau, provisoire. */
export async function nouveauMotDePasse(_: EtatAcces, form: FormData): Promise<EtatAcces> {
  const moi = await utilisateurCourant();
  if (!moi || !estAdmin(moi.role)) return { erreur: "Action réservée à l'administration." };
  const id = String(form.get("id") ?? "");
  if (id === moi.id) return { erreur: "Pour votre propre compte, utilisez « Paramètres »." };

  const admin = creerClientAdmin();
  if (!admin) return { erreur: "La clé serveur SUPABASE_SERVICE_ROLE_KEY n'est pas configurée." };
  const { data: profil } = await admin.from("profils").select("nom_affiche, identifiant, role").eq("id", id).maybeSingle();
  if (!profil) return { erreur: "Compte introuvable." };
  // Même règle que pour les rôles : un administrateur ne touche pas au compte d'un super administrateur.
  if (!rolesAttribuables(moi.role).includes(profil.role as Role)) return { erreur: "Vous ne pouvez pas modifier ce compte." };
  if (!profil.identifiant) return { erreur: "Ce compte n'a pas d'identifiant : la personne peut utiliser « Mot de passe oublié » avec son e-mail." };

  const motDePasse = motDePasseProvisoire();
  const { data, error } = await admin.auth.admin.updateUserById(id, { password: motDePasse });
  if (error) {
    console.error("Nouveau mot de passe refusé par Supabase :", error.code, error.message);
    return { erreur: `Le mot de passe n'a pas pu être changé (${raisonAuth(error)}).` };
  }
  // Un compte bloqué après des essais ratés est débloqué
  await admin.rpc("effacer_echecs_connexion", { p_cle: profil.identifiant });
  if (data.user.email) await admin.rpc("effacer_echecs_connexion", { p_cle: data.user.email });
  const nom = profil.nom_affiche || profil.identifiant;
  return {
    succes: `Nouveau mot de passe provisoire pour ${nom}.`,
    acces: { nom, identifiant: profil.identifiant, motDePasse, message: messageAcces(nom, profil.identifiant, motDePasse, URL_SITE) },
  };
}

export async function modifierUtilisateur(_: Etat, form: FormData): Promise<Etat> {
  const moi = await utilisateurCourant();
  if (!moi || !estAdmin(moi.role)) return { erreur: "Action réservée à l'administration." };
  const d = schemaModification.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  if (!rolesAttribuables(moi.role).includes(d.data.role)) return { erreur: "Vous ne pouvez pas attribuer ce rôle." };
  if (d.data.id === moi.id && (d.data.role !== moi.role || !d.data.actif)) {
    return { erreur: "Vous ne pouvez pas modifier votre propre rôle ni désactiver votre compte." };
  }

  // Client de l'utilisateur : la base vérifie elle-même les droits (RLS).
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("profils")
    .update({
      role: d.data.role,
      paroisse_id: d.data.paroisseId,
      commission_id: d.data.commissionId,
      // Seulement si besoin : la colonne n'existe qu'après le fichier SQL du responsable de chorale
      ...(d.data.choraleId ? { chorale_id: d.data.choraleId } : {}),
      actif: d.data.actif,
      acces_finances: d.data.accesFinances && peutRecevoirAccesFinances(d.data.role),
    })
    .eq("id", d.data.id)
    .select("id");
  if (error || !data?.length) return { erreur: "Modification refusée." };
  revalidatePath("/staff/utilisateurs");
  return { succes: "Modification enregistrée." };
}
