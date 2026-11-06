
/**
 * Comptes créés par l'administration, sans e-mail d'invitation : beaucoup de
 * choristes n'ont pas d'adresse e-mail, et l'envoi gratuit de Supabase est très
 * limité. La personne se connecte avec son identifiant et un mot de passe
 * provisoire, puis le change dans « Paramètres ».
 */

// Adresse interne d'un compte sans e-mail : jamais affichée, jamais utilisée pour écrire.
const DOMAINE_TECHNIQUE = "sans-email.pgmmuanda.vercel.app";

export const emailTechnique = (identifiant: string) => `${identifiant}@${DOMAINE_TECHNIQUE}`;
export const estEmailTechnique = (email: string | null | undefined) => Boolean(email?.endsWith(`@${DOMAINE_TECHNIQUE}`));

// Sans lettres ni chiffres qui se confondent (l/1, o/0, i) : facile à recopier depuis WhatsApp.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

const MAJUSCULES = "ABCDEFGHJKMNPQRSTUVWXYZ";
const CHIFFRES = "23456789";
// Tirage au sort sûr, dans le navigateur comme sur le serveur (le léger biais du modulo est négligeable ici)
const tirer = (alphabet: string) => alphabet[globalThis.crypto.getRandomValues(new Uint32Array(1))[0] % alphabet.length];

/**
 * Mot de passe provisoire du type « Km7p-4rxa-9q2d » (environ 57 bits) : toujours une
 * majuscule, des minuscules, un chiffre et un tiret, pour passer les règles de mot de
 * passe que Supabase peut exiger.
 */
export function motDePasseProvisoire() {
  const groupe = () => Array.from({ length: 4 }, () => tirer(ALPHABET)).join("");
  const debut = tirer(MAJUSCULES) + groupe().slice(1);
  const fin = groupe().slice(0, 3) + tirer(CHIFFRES);
  return [debut, groupe(), fin].join("-");
}

/**
 * Mot de passe facile à retenir, proposé à l'inscription : le nom + 123456
 * (ex. « DIZOLELE » → « Dizolele123456 »). Pour un nom très court, on complète
 * les chiffres afin d'avoir au moins 10 caractères. Chaîne vide si le nom n'a pas de lettre.
 */
export function motDePasseDuNom(nom: string) {
  const lettres = nom.normalize("NFD").replace(/[^A-Za-z]/g, "");
  if (!lettres) return "";
  const debut = lettres[0].toUpperCase() + lettres.slice(1).toLowerCase();
  let chiffres = "123456";
  while (debut.length + chiffres.length < 10) chiffres += String((chiffres.length + 1) % 10);
  return debut + chiffres;
}

/** Message prêt à partager sur WhatsApp avec la personne concernée. */
export function messageAcces(nom: string, identifiant: string, motDePasse: string, site: string) {
  return [
    `Paix ${nom}, voici votre accès à l'application PGM Antenne de Muanda :`,
    `Site : ${site}`,
    `Identifiant : ${identifiant}`,
    `Mot de passe provisoire : ${motDePasse}`,
    "À la première connexion, changez votre mot de passe dans « Paramètres ».",
  ].join("\n");
}

/** Règles d'un mot de passe choisi à la main (les mêmes que celles que Supabase peut exiger). */
export function problemeMotDePasse(m: string): string | null {
  if (m.length < 10) return "Le mot de passe doit avoir au moins 10 caractères.";
  if (!/[A-Z]/.test(m) || !/[a-z]/.test(m) || !/[0-9]/.test(m)) return "Le mot de passe doit avoir une majuscule, une minuscule et un chiffre.";
  return null;
}

/** « Grâce Mavungu » → « grace.mavungu » : lettres sans accents, chiffres et points seulement. */
export function baseIdentifiant(prenom: string, nom: string) {
  const propre = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const base = [propre(prenom), propre(nom)].filter(Boolean).join(".").slice(0, 34);
  return base.length >= 3 ? base : `membre.${base}`.replace(/\.$/, "");
}

/** Nom ramené à ses lettres, sans accents ni majuscules, mots triés : « Reagan MBUMBA » = « mbumba reagan ». */
export function cleNom(...parties: (string | null | undefined)[]) {
  return parties.join(" ").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .split(/[^a-z0-9]+/).filter(Boolean).sort().join(" ");
}

/** Mot de passe donné au compte d'un membre : le nom + 123456, ou un mot de passe tiré au sort si le nom n'a pas de lettre. */
export const motDePasseMembre = (nom: string) => motDePasseDuNom(nom) || motDePasseProvisoire();
