import "server-only";
import type { CarteVerifiee } from "@/components/carte/ResultatVerification";
import { creerClientServeur } from "@/lib/supabase/server";

type Reponse = {
  resultat: "valide" | "revoquee" | "inconnue";
  prenom: string; nom: string; postnom: string; matricule: string; paroisse: string; photo_url: string | null;
};

const versResultat = (d: Reponse | null): CarteVerifiee | undefined =>
  !d || d.resultat === "inconnue"
    ? undefined
    : { prenom: d.prenom, nom: d.nom, postnom: d.postnom, matricule: d.matricule, paroisse: d.paroisse, photo: d.photo_url, valide: d.resultat === "valide" };

/** Vérification publique d'une référence de QR code (chaque contrôle est enregistré par la base). */
export async function verifierReference(reference: string): Promise<CarteVerifiee | undefined> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.rpc("verifier_carte", { p_reference: reference.slice(0, 64) }).single<Reponse>();
  return versResultat(data);
}

/** Vérification par matricule, réservée au personnel connecté. */
export async function verifierParMatricule(matricule: string): Promise<CarteVerifiee | undefined> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.rpc("verifier_matricule", { p_matricule: matricule.slice(0, 20) }).single<Reponse>();
  return versResultat(data);
}
