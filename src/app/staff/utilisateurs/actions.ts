"use server";

import { revalidatePath } from "next/cache";
import { utilisateurCourant } from "@/lib/auth/session";
import { estAdmin, rolesAttribuables } from "@/lib/auth/roles";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { URL_SITE } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { schemaInvitation, schemaModification } from "@/lib/validation/utilisateurs";

export type Etat = { erreur?: string; succes?: string } | undefined;

export async function inviterUtilisateur(_: Etat, form: FormData): Promise<Etat> {
  const moi = await utilisateurCourant();
  if (!moi || !estAdmin(moi.role)) return { erreur: "Action réservée à l'administration." };

  const d = schemaInvitation.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  if (!rolesAttribuables(moi.role).includes(d.data.role)) return { erreur: "Vous ne pouvez pas attribuer ce rôle." };

  const admin = creerClientAdmin();
  if (!admin) return { erreur: "La clé serveur SUPABASE_SERVICE_ROLE_KEY n'est pas configurée." };

  const { data, error } = await admin.auth.admin.inviteUserByEmail(d.data.email, {
    data: { nom_affiche: d.data.nom },
    redirectTo: `${URL_SITE}/auth/confirm?suite=/reinitialiser`,
  });
  if (error || !data.user) {
    return { erreur: error?.code === "email_exists" ? "Un compte existe déjà avec cette adresse." : "L'invitation n'a pas pu être envoyée." };
  }

  const { error: e2 } = await admin
    .from("profils")
    .update({
      nom_affiche: d.data.nom,
      identifiant: d.data.identifiant,
      role: d.data.role,
      paroisse_id: d.data.paroisseId,
      commission_id: d.data.commissionId,
    })
    .eq("id", data.user.id);
  if (e2) {
    return { erreur: e2.code === "23505" ? "Cet identifiant est déjà utilisé." : "Le compte est créé mais son rôle n'a pas pu être enregistré." };
  }
  revalidatePath("/staff/utilisateurs");
  return { succes: `Invitation envoyée à ${d.data.email}.` };
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
      actif: d.data.actif,
    })
    .eq("id", d.data.id)
    .select("id");
  if (error || !data?.length) return { erreur: "Modification refusée." };
  revalidatePath("/staff/utilisateurs");
  return { succes: "Modification enregistrée." };
}
