"use server";

import { utilisateurCourant } from "@/lib/auth/session";
import { MAQUETTE, type Etat } from "@/lib/etat-action";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaNouveauMotDePasse } from "@/lib/validation/auth";

/** Changement de mot de passe par l'utilisateur connecté, après vérification de l'ancien. */
export async function changerMotDePasse(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const moi = await utilisateurCourant();
  if (!moi?.email) return { erreur: "Session expirée : reconnectez-vous." };
  const d = schemaNouveauMotDePasse.safeParse({ motDePasse: form.get("motDePasse"), confirmation: form.get("confirmation") });
  if (!d.success) return { erreur: d.error.issues[0].message };
  const actuel = String(form.get("actuel") ?? "");
  if (actuel === d.data.motDePasse) return { erreur: "Le nouveau mot de passe doit être différent de l'ancien." };
  // Même protection que la connexion : 5 essais faux bloquent 15 minutes
  const admin = creerClientAdmin();
  if (admin && (await admin.rpc("connexion_bloquee", { p_cle: moi.email })).data) {
    return { erreur: "Trop d'essais avec un mot de passe faux. Attendez 15 minutes avant de réessayer." };
  }
  const supabase = await creerClientServeur();
  const { error: e1 } = await supabase.auth.signInWithPassword({ email: moi.email, password: actuel });
  if (e1) {
    if (admin) await admin.rpc("noter_echec_connexion", { p_cle: moi.email });
    return { erreur: "Le mot de passe actuel est incorrect." };
  }
  if (admin) await admin.rpc("effacer_echecs_connexion", { p_cle: moi.email });
  const { error } = await supabase.auth.updateUser({ password: d.data.motDePasse });
  if (error) return { erreur: "Le changement a échoué. Réessayez." };
  return { succes: "Votre mot de passe a été changé. Utilisez-le à la prochaine connexion." };
}
