import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { creerClientServeur } from "@/lib/supabase/server";
import { supabaseActif } from "@/lib/supabase/config";
import { accueilPourRole, peutOuvrir, type Role } from "./roles";

export type UtilisateurConnecte = {
  id: string;
  email: string | null;
  nom: string;
  role: Role;
  paroisseId: string | null;
  commissionId: string | null;
};

/** Utilisateur connecté et actif, ou null. Mis en cache le temps d'une requête. */
export const utilisateurCourant = cache(async (): Promise<UtilisateurConnecte | null> => {
  if (!supabaseActif) return null;
  const supabase = await creerClientServeur();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profil } = await supabase
    .from("profils")
    .select("nom_affiche, role, paroisse_id, commission_id, actif")
    .eq("id", user.id)
    .single();
  if (!profil || !profil.actif) return null;
  return {
    id: user.id,
    email: user.email ?? null,
    nom: profil.nom_affiche || user.email || "Utilisateur",
    role: profil.role as Role,
    paroisseId: profil.paroisse_id,
    commissionId: profil.commission_id,
  };
});

/**
 * Garde d'accès pour une page. En mode maquette (sans Supabase), laisse passer.
 * Sinon : non connecté → connexion ; rôle insuffisant → son propre espace.
 */
export async function exigerAcces(chemin: string): Promise<UtilisateurConnecte | null> {
  if (!supabaseActif) return null;
  const u = await utilisateurCourant();
  if (!u) redirect(`/connexion?suite=${encodeURIComponent(chemin)}`);
  if (!peutOuvrir(u.role, chemin)) redirect(accueilPourRole(u.role));
  return u;
}
