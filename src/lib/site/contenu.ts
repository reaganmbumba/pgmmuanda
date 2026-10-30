import "server-only";
import { SUPABASE_URL, supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";

/*
 * Contenu du site public, géré par l'administration (tables site_elements et
 * site_reglages). Tant que la base n'a pas ces tables, le site garde son contenu
 * de départ : il ne tombe jamais en panne à cause d'elles.
 */

export const RUBRIQUES = ["actualite", "chorale", "commission", "programme", "question", "audio", "soiree", "social", "pionnier"] as const;
export type Rubrique = (typeof RUBRIQUES)[number];

export type ElementSite = {
  id: string;
  rubrique: Rubrique;
  titre: string;
  sousTitre: string | null;
  texte: string | null;
  date: string | null;
  fichier: string | null;
  ordre: number;
  publie: boolean;
};

export const CLES_REGLAGES = ["accueil_titre", "accueil_texte", "telephone", "whatsapp_message", "youtube_chaine", "youtube_id", "causerie_ouverte"] as const;
export type CleReglage = (typeof CLES_REGLAGES)[number];
export type Reglages = Record<CleReglage, string>;

export const REGLAGES_DEFAUT: Reglages = {
  accueil_titre: "Servir Dieu par le chant, à Muanda",
  accueil_texte: "La Présidence générale de la musique rassemble les chorales de l'EBNM KCC. L'Antenne de Muanda en est la représentation locale.",
  telephone: "+243 825 717 444",
  whatsapp_message: "Paix ! Je vous écris depuis le site de la PGM Antenne de Muanda.",
  youtube_chaine: "pgmmuanda",
  youtube_id: "",
  causerie_ouverte: "oui",
};

const el = (rubrique: Rubrique, ordre: number, titre: string, sousTitre: string | null, texte: string | null, date: string | null = null): ElementSite =>
  ({ id: `defaut-${rubrique}-${ordre}`, rubrique, titre, sousTitre, texte, date, fichier: null, ordre, publie: true });

const ELEMENTS_DEFAUT: ElementSite[] = [
  el("actualite", 0, "La PGM Antenne de Muanda passe au numérique",
    "Avec PGM MUANDA DIGITAL, chaque choriste et chaque responsable a son espace personnel pour suivre la vie de la PGM depuis son téléphone.",
    "La Présidence générale de la musique, Antenne de Muanda (EBNM KCC), a le plaisir d'annoncer la numérisation de son système d'organisation. Les fiches des membres, les cartes, le programme des activités, les présences, les annonces et les chants sont maintenant réunis dans une seule application : PGM MUANDA DIGITAL.\n\nJusqu'ici, beaucoup d'informations circulaient sur papier ou dans plusieurs groupes de messages. L'application met tout cela au même endroit, de manière claire et simple.\n\nChaque choriste dispose d'une carte de membre numérique avec un code QR. Les responsables tiennent la liste des membres, le registre de présence, le programme, les annonces, les chants, les réunions et les cotisations. Chacun ne voit que ce qui concerne sa fonction, et les données sont sauvegardées chaque nuit.\n\nCette numérisation ne remplace ni la prière, ni les répétitions, ni la fraternité entre choristes. Elle doit nous aider à mieux nous organiser et à consacrer davantage de temps à l'essentiel : servir Dieu par le chant.\n\nQue Dieu bénisse la PGM Antenne de Muanda et tous ses choristes.",
    "2026-10-30"),
  el("chorale", 1, "Vision", "Paroisse Atlantique", null),
  el("chorale", 2, "Echo", "Paroisse Pika Pende", null),
  el("chorale", 3, "Alliance", "Paroisse Itonde", null),
  el("chorale", 4, "CHOPDI", "Paroisse Kitsiaku", null),
  el("chorale", 5, "Oracle", "Chorale urbaine, dans toutes les paroisses", null),
  el("commission", 1, "Coordination des commissions", null, "Relie le travail de toutes les commissions."),
  el("commission", 2, "Finances & Budget", null, "Cotisations, caisse et budget des activités."),
  el("commission", 3, "Uniforme et Tenue", null, "Les uniformes et la tenue lors des productions."),
  el("commission", 4, "Logistique & Infrastructure", null, "Matériel, salles, transport et hébergement."),
  el("commission", 5, "Presse, Communication et Promotion", null, "Annonces, photos, réseaux et ce site."),
  el("commission", 6, "Censure, Musique & Répertoire", null, "Choix et vérification des chants."),
  el("commission", 7, "Santé & Assistance", null, "Soutien aux choristes malades ou dans le besoin."),
  el("programme", 1, "Lundi", "15h30 – 17h30", "Répétition des femmes"),
  el("programme", 2, "Lundi", "17h30 – 19h30", "Répétition des hommes"),
  el("programme", 3, "Jeudi", "15h30 – 17h30", "Répétition des femmes"),
  el("programme", 4, "Jeudi", "17h30 – 19h30", "Répétition des hommes"),
  el("programme", 5, "Dimanche", "Culte", "Louange dans chaque paroisse"),
  el("question", 1, "Qui peut devenir choriste ?", null, "Tout KCCiste de bonne moralité et disponible, qui fait une demande écrite au Comité directeur de la chorale de sa paroisse, réussit le test et signe l'acte d'engagement. Les enfants vont dans la chorale junior."),
  el("question", 2, "Quand ont lieu les répétitions ?", null, "Le lundi et le jeudi : de 15h30 à 17h30 pour les femmes, de 17h30 à 19h30 pour les hommes. Les horaires exacts de chaque chorale sont dans l'espace membres."),
  el("question", 3, "Faut-il payer une cotisation ?", null, "Oui. Chaque membre paie régulièrement sa cotisation, comme le prévoit le Règlement intérieur. Le montant est donné par votre chorale."),
  el("question", 4, "Comment obtenir mon compte dans l'application ?", null, "Votre responsable de chorale crée votre compte et vous envoie, par WhatsApp, votre identifiant et un mot de passe provisoire. Aucune adresse e-mail n'est nécessaire."),
  el("question", 5, "J'ai oublié mon mot de passe. Que faire ?", null, "Sur la page « Se connecter », touchez « Mot de passe oublié ? », ou demandez à votre responsable de chorale de vous en donner un nouveau."),
  el("question", 6, "Comment vérifier une carte de membre ?", null, "Scannez le code QR de la carte avec l'appareil photo d'un téléphone : une page indique tout de suite si la carte est valable."),
  el("question", 7, "Où trouver le Règlement intérieur ?", null, "Dans la rubrique « Règlement » de ce site : un résumé simple et le texte complet à télécharger."),
];

type Ligne = {
  id: string; rubrique: Rubrique; titre: string; sous_titre: string | null; texte: string | null;
  date_element: string | null; fichier: string | null; ordre: number; publie: boolean;
};
const versElement = (l: Ligne): ElementSite => ({
  id: l.id, rubrique: l.rubrique, titre: l.titre, sousTitre: l.sous_titre, texte: l.texte,
  date: l.date_element, fichier: l.fichier, ordre: l.ordre, publie: l.publie,
});

const PAR_DATE: Rubrique[] = ["actualite", "audio", "soiree", "social"];

/** Les éléments d'une rubrique, dans l'ordre d'affichage (rubriques datées : les plus récents d'abord). */
export async function lireElements(rubrique: Rubrique, tous = false): Promise<ElementSite[]> {
  const defaut = ELEMENTS_DEFAUT.filter((e) => e.rubrique === rubrique);
  if (!supabaseActif) return defaut;
  const supabase = await creerClientServeur();
  let q = supabase.from("site_elements").select("id, rubrique, titre, sous_titre, texte, date_element, fichier, ordre, publie")
    .eq("rubrique", rubrique);
  if (!tous) q = q.eq("publie", true);
  q = PAR_DATE.includes(rubrique)
    ? q.order("date_element", { ascending: false, nullsFirst: false }).order("cree_le", { ascending: false })
    : q.order("ordre").order("cree_le");
  const { data, error } = await q;
  if (error) return defaut; // tables pas encore créées : contenu de départ
  return (data as Ligne[]).map(versElement);
}

export async function lireElement(id: string): Promise<ElementSite | null> {
  if (!supabaseActif || !/^[0-9a-f-]{36}$/i.test(id)) return ELEMENTS_DEFAUT.find((e) => e.id === id) ?? null;
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("site_elements")
    .select("id, rubrique, titre, sous_titre, texte, date_element, fichier, ordre, publie").eq("id", id).maybeSingle();
  return data ? versElement(data as Ligne) : null;
}

/** Vrai quand les tables du site existent dans la base (migration exécutée). */
export async function siteEnBase(): Promise<boolean> {
  if (!supabaseActif) return false;
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("site_reglages").select("cle").limit(1);
  return !error;
}

export async function lireReglages(): Promise<Reglages> {
  if (!supabaseActif) return REGLAGES_DEFAUT;
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("site_reglages").select("cle, valeur");
  if (error || !data) return REGLAGES_DEFAUT;
  const r = { ...REGLAGES_DEFAUT };
  for (const { cle, valeur } of data as { cle: CleReglage; valeur: string }[]) if (cle in r) r[cle] = valeur;
  return r;
}

export type MessageCauserie = { id: number; pseudo: string; texte: string; masque: boolean; creeLe: string };

/** Les derniers messages de la causerie, masqués compris (pour la modération). */
export async function lireCauserie(): Promise<MessageCauserie[]> {
  if (!supabaseActif) return [];
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("causerie_messages").select("id, pseudo, texte, masque, cree_le")
    .order("cree_le", { ascending: false }).limit(150);
  return (data ?? []).map((m) => ({ id: m.id, pseudo: m.pseudo, texte: m.texte, masque: m.masque, creeLe: m.cree_le }));
}

/** Adresse publique d'un fichier audio du site. */
export const urlFichier = (chemin: string) => `${SUPABASE_URL}/storage/v1/object/public/site/${chemin}`;

/** Numéro pour les liens tel: et WhatsApp (chiffres seulement, avec l'indicatif). */
export function contact(r: Reglages) {
  const chiffres = r.telephone.replace(/\D/g, "");
  return {
    affiche: r.telephone,
    tel: chiffres ? `+${chiffres}` : "",
    whatsapp: chiffres ? `https://wa.me/${chiffres}?text=${encodeURIComponent(r.whatsapp_message)}` : "",
  };
}

/** « 30 octobre 2026 » */
export const dateLongue = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Paragraphes d'un texte saisi (séparés par une ligne vide). */
export const paragraphes = (texte: string | null) =>
  (texte ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
