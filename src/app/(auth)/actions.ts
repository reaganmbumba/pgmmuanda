"use server";

import { redirect } from "next/navigation";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { URL_SITE, supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { accueilPourRole, cheminSur, peutOuvrir, type Role } from "@/lib/auth/roles";
import { estEmail, schemaConnexion, schemaEmail, schemaNouveauMotDePasse } from "@/lib/validation/auth";

export type EtatFormulaire = { erreur?: string; succes?: string } | undefined;

const ERREUR_IDENTIFIANTS = "Identifiant ou mot de passe incorrect.";
const ERREUR_BLOCAGE = "Trop d'essais avec un mot de passe faux. Pour votre sécurité, attendez 15 minutes avant de réessayer.";

export async function connexion(_: EtatFormulaire, form: FormData): Promise<EtatFormulaire> {
  if (!supabaseActif) return { erreur: "La base de données n'est pas encore configurée." };
  const donnees = schemaConnexion.safeParse({
    identifiant: form.get("identifiant"),
    motDePasse: form.get("motDePasse"),
  });
  if (!donnees.success) return { erreur: donnees.error.issues[0].message };

  let email = donnees.data.identifiant;
  // Protection contre les essais de mots de passe en série (si la clé serveur est configurée)
  const admin = creerClientAdmin();
  const cle = donnees.data.identifiant;
  if (admin) {
    const { data: bloque } = await admin.rpc("connexion_bloquee", { p_cle: cle });
    if (bloque) return { erreur: ERREUR_BLOCAGE };
  }
  if (!estEmail(email)) {
    // L'identifiant est converti en e-mail côté serveur uniquement (clé service_role).
    if (!admin) return { erreur: "Connectez-vous avec votre adresse e-mail." };
    const { data } = await admin.rpc("email_pour_identifiant", { p_identifiant: email });
    if (!data) {
      await admin.rpc("noter_echec_connexion", { p_cle: cle });
      return { erreur: ERREUR_IDENTIFIANTS };
    }
    email = data as string;
  }

  const supabase = await creerClientServeur();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: donnees.data.motDePasse });
  if (error?.name === "AuthRetryableFetchError") {
    return { erreur: "Le service est momentanément injoignable. Vérifiez votre connexion Internet." };
  }
  if (error || !data.user) {
    if (admin && error?.code !== "email_not_confirmed") await admin.rpc("noter_echec_connexion", { p_cle: cle });
    return { erreur: error?.code === "email_not_confirmed" ? "Votre adresse e-mail n'est pas encore confirmée." : ERREUR_IDENTIFIANTS };
  }

  if (admin) await admin.rpc("effacer_echecs_connexion", { p_cle: cle });

  const { data: profil } = await supabase.from("profils").select("role, actif, acces_finances").eq("id", data.user.id).single();
  if (!profil?.actif) {
    await supabase.auth.signOut();
    return { erreur: "Ce compte est désactivé. Contactez l'administration de la PGM." };
  }
  const role = profil.role as Role;
  const suite = cheminSur(form.get("suite") as string | null, accueilPourRole(role));
  redirect(peutOuvrir(role, suite, profil.acces_finances) && suite !== "/" ? suite : accueilPourRole(role));
}

export async function motDePasseOublie(_: EtatFormulaire, form: FormData): Promise<EtatFormulaire> {
  if (!supabaseActif) return { erreur: "La base de données n'est pas encore configurée." };
  const donnees = schemaEmail.safeParse({ email: form.get("email") });
  if (!donnees.success) return { erreur: donnees.error.issues[0].message };
  const supabase = await creerClientServeur();
  await supabase.auth.resetPasswordForEmail(donnees.data.email, {
    redirectTo: `${URL_SITE}/auth/confirm?suite=/reinitialiser`,
  });
  // Même message dans tous les cas : on ne révèle pas si l'adresse existe.
  return { succes: "Si un compte utilise cette adresse, un lien de réinitialisation vient d'être envoyé." };
}

export async function reinitialiserMotDePasse(_: EtatFormulaire, form: FormData): Promise<EtatFormulaire> {
  const donnees = schemaNouveauMotDePasse.safeParse({
    motDePasse: form.get("motDePasse"),
    confirmation: form.get("confirmation"),
  });
  if (!donnees.success) return { erreur: donnees.error.issues[0].message };
  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.updateUser({ password: donnees.data.motDePasse });
  if (error) return { erreur: "Le lien a expiré. Recommencez la procédure « Mot de passe oublié »." };
  return { succes: "Votre mot de passe a été modifié." };
}

export async function deconnexion() {
  if (supabaseActif) {
    const supabase = await creerClientServeur();
    await supabase.auth.signOut();
  }
  redirect("/connexion");
}
