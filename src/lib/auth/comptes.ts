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

/** Mot de passe provisoire du type « k7mp-4rxa-9q2d » (environ 59 bits). */
export function motDePasseProvisoire() {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(""),
  ).join("-");
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
