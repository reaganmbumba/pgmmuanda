
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

/** Message prêt à partager sur WhatsApp avec la personne concernée. */
export function messageAcces(nom: string, identifiant: string, motDePasse: string, site: string) {
  return [
    `Bonjour ${nom}, voici votre accès à PGM MUANDA DIGITAL :`,
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
