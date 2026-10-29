import { randomInt } from "node:crypto";

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
const tirer = (alphabet: string) => alphabet[randomInt(alphabet.length)];

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
