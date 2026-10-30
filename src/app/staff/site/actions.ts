"use server";

import { revalidatePath } from "next/cache";
import { utilisateurCourant } from "@/lib/auth/session";
import { estAdmin } from "@/lib/auth/roles";
import { MAQUETTE, messageErreur, type Etat } from "@/lib/etat-action";
import { CHEMIN_AUDIO, schemaElementSite, schemaReglagesSite } from "@/lib/site/schema";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";

const REFUS = "Le site public est géré par l'administration (super administrateur et présidence).";
const PAGES = ["/", "/direct", "/ecouter", "/soirees", "/cas-sociaux", "/pionniers", "/causerie", "/chorales", "/programme", "/actualites", "/commissions", "/questions", "/contact", "/la-pgm"];

async function client() {
  if (!supabaseActif) return null;
  const moi = await utilisateurCourant();
  if (!moi || !estAdmin(moi.role)) return null;
  return creerClientServeur();
}

function rafraichir() {
  for (const p of PAGES) revalidatePath(p);
  revalidatePath("/actualites/[id]", "page");
  revalidatePath("/staff/site");
}

const ligne = (d: ReturnType<typeof schemaElementSite.parse>) => ({
  rubrique: d.rubrique, titre: d.titre, sous_titre: d.sousTitre, texte: d.texte, date_element: d.date, ordre: d.ordre,
});

/** Ajoute un élément (sans id) ou modifie celui dont l'id est donné. */
export async function enregistrerElement(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const d = schemaElementSite.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const id = String(form.get("id") ?? "");
  if (!id && d.data.rubrique === "audio") return { erreur: "Choisissez le fichier audio à envoyer." };
  const { data, error } = id
    ? await supabase.from("site_elements").update(ligne(d.data)).eq("id", id).select("id")
    : await supabase.from("site_elements").insert(ligne(d.data)).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  rafraichir();
  return { succes: id ? "Modification enregistrée. Le site est à jour." : `« ${d.data.titre} » ajouté au site.` };
}

/** Enregistre un audio déjà déposé dans l'espace de stockage par le navigateur. */
export async function ajouterAudio(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const d = schemaElementSite.safeParse({ ...Object.fromEntries(form), rubrique: "audio" });
  if (!d.success) return { erreur: d.error.issues[0].message };
  const fichier = String(form.get("fichier") ?? "");
  if (!CHEMIN_AUDIO.test(fichier)) return { erreur: "Le fichier audio n'a pas été envoyé. Réessayez." };
  const { error } = await supabase.from("site_elements").insert({ ...ligne(d.data), fichier });
  if (error) {
    await supabase.storage.from("site").remove([fichier]);
    return { erreur: messageErreur(error, REFUS) };
  }
  rafraichir();
  return { succes: `Audio « ${d.data.titre} » ajouté. On peut l'écouter sur le site.` };
}

export async function basculerElement(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const publie = form.get("publie") === "oui";
  const { data, error } = await supabase.from("site_elements").update({ publie }).eq("id", String(form.get("id"))).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  rafraichir();
  return { succes: publie ? "De nouveau visible sur le site." : "Masqué : le public ne le voit plus." };
}

export async function supprimerElement(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const { data, error } = await supabase.from("site_elements").delete().eq("id", String(form.get("id"))).select("fichier");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  const fichiers = data.map((l) => l.fichier as string | null).filter((f): f is string => !!f);
  if (fichiers.length) await supabase.storage.from("site").remove(fichiers);
  rafraichir();
  return { succes: "Supprimé du site." };
}

export async function enregistrerReglages(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const d = schemaReglagesSite.safeParse(Object.fromEntries(form));
  if (!d.success) return { erreur: d.error.issues[0].message };
  const lignes = Object.entries({ ...d.data, youtube_chaine: d.data.youtube_chaine.replace(/^@/, "") })
    .map(([cle, valeur]) => ({ cle, valeur }));
  const { error } = await supabase.from("site_reglages").upsert(lignes);
  if (error) return { erreur: messageErreur(error, REFUS) };
  rafraichir();
  return { succes: "Réglages enregistrés. Le site est à jour." };
}

export async function masquerMessage(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const masque = form.get("masque") === "oui";
  const { data, error } = await supabase.from("causerie_messages").update({ masque }).eq("id", Number(form.get("id"))).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  revalidatePath("/staff/site");
  return { succes: masque ? "Message masqué pour tout le monde." : "Message de nouveau visible." };
}

export async function supprimerMessage(_: Etat, form: FormData): Promise<Etat> {
  if (!supabaseActif) return MAQUETTE;
  const supabase = await client();
  if (!supabase) return { erreur: REFUS };
  const { data, error } = await supabase.from("causerie_messages").delete().eq("id", Number(form.get("id"))).select("id");
  if (error || !data?.length) return { erreur: messageErreur(error, REFUS) };
  revalidatePath("/staff/site");
  return { succes: "Message supprimé." };
}
