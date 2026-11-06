import "server-only";
import { baseIdentifiant, cleNom, emailTechnique } from "@/lib/auth/comptes";
import { creerClientAdmin } from "@/lib/supabase/admin";

type ClientAdmin = NonNullable<ReturnType<typeof creerClientAdmin>>;

/**
 * Crée un compte « choriste » (sans e-mail) avec le premier identifiant libre
 * (prenom.nom, puis prenom.nom2…). Renvoie null en cas d'échec.
 */
export async function creerCompteChoriste(
  admin: ClientAdmin,
  v: { prenom: string; nom: string; motDePasse: string; paroisseId: string | null; actif?: boolean },
): Promise<{ id: string; identifiant: string } | null> {
  const base = baseIdentifiant(v.prenom, v.nom);
  const nomAffiche = `${v.prenom} ${v.nom}`.trim();
  for (let n = 1; n <= 30; n++) {
    const identifiant = n === 1 ? base : `${base}${n}`;
    const { data: pris } = await admin.from("profils").select("id").eq("identifiant", identifiant).maybeSingle();
    if (pris) continue;
    const { data, error } = await admin.auth.admin.createUser({
      email: emailTechnique(identifiant), password: v.motDePasse, email_confirm: true,
      user_metadata: { nom_affiche: nomAffiche },
    });
    if (error?.code === "email_exists") continue;
    if (error || !data.user) {
      console.error("Compte de membre refusé par Supabase :", error?.code, error?.message);
      return null;
    }
    const { error: e2 } = await admin.from("profils")
      .update({ identifiant, nom_affiche: nomAffiche, role: "choriste", paroisse_id: v.paroisseId, actif: v.actif ?? true })
      .eq("id", data.user.id);
    if (e2) {
      await admin.auth.admin.deleteUser(data.user.id);
      if (e2.code === "23505") continue;
      console.error("Profil du compte de membre refusé :", e2.code, e2.message);
      return null;
    }
    return { id: data.user.id, identifiant };
  }
  return null;
}

/**
 * Donne un compte à une fiche de membre qui n'en a pas encore, et relie les deux.
 * Le compte est supprimé si la fiche n'a pas pu être reliée (pour ne pas laisser de compte orphelin).
 */
export async function creerCompteDuMembre(
  admin: ClientAdmin,
  m: { id: string; prenom: string; nom: string; paroisse_id: string | null; statut: string },
  motDePasse: string,
): Promise<{ id: string; identifiant: string } | null> {
  const compte = await creerCompteChoriste(admin, {
    prenom: m.prenom, nom: m.nom, motDePasse, paroisseId: m.paroisse_id,
    actif: m.statut !== "suspendu" && m.statut !== "inactif",
  });
  if (!compte) return null;
  const { data, error } = await admin.from("membres").update({ profil_id: compte.id })
    .eq("id", m.id).is("profil_id", null).select("id");
  if (error || !data?.length) {
    await admin.auth.admin.deleteUser(compte.id);
    if (error) console.error("Fiche du membre non reliée à son compte :", error.code, error.message);
    return null;
  }
  return compte;
}

/**
 * Noms des comptes qui existent déjà. Une fiche qui porte le même nom qu'un compte
 * (ex. l'administrateur Reagan MBUMBA) ne reçoit pas de second compte : on la relie à la main.
 */
export async function nomsDesComptes(admin: ClientAdmin): Promise<Set<string>> {
  const { data } = await admin.from("profils").select("nom_affiche");
  return new Set((data ?? []).map((p) => cleNom(p.nom_affiche)).filter(Boolean));
}

export const memeNomQuUnCompte = (noms: Set<string>, m: { prenom: string; nom: string; postnom?: string | null }) =>
  noms.has(cleNom(m.prenom, m.nom)) || noms.has(cleNom(m.prenom, m.nom, m.postnom));
