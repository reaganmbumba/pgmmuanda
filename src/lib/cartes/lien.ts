import { URL_SITE } from "@/lib/supabase/config";

/** Le QR code ne contient que ce lien : aucune donnée personnelle. */
export const lienVerification = (reference: string) => `${URL_SITE}/verifier/${reference}`;

const REFERENCE = /^[A-Za-z0-9_-]{10,64}$/;

/**
 * Lit le contenu d'un QR code scanné : un lien …/verifier/<référence> ou la référence seule.
 * Renvoie null si ce n'est pas une carte PGM.
 */
export function extraireReference(texte: string): string | null {
  const t = texte.trim();
  const m = t.match(/\/verifier\/([^/?#\s]+)\/?(?:[?#].*)?$/);
  const ref = m ? decodeURIComponent(m[1]) : t;
  return REFERENCE.test(ref) ? ref : null;
}

/** Les QR codes doivent pointer vers l'adresse publique du site, pas vers un ordinateur local. */
export const adresseLocale = /^https?:\/\/(localhost|127\.|192\.168\.|10\.)/.test(URL_SITE);
