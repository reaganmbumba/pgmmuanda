import { jourLocal } from "@/lib/programmes/libelles";

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** Premier jour du mois en cours, heure de Muanda : « 2026-10-01 ». */
export const moisCourant = (maintenant = new Date()) => `${jourLocal(maintenant.toISOString()).slice(0, 7)}-01`;

/** « 2026-10 » (adresse de la page) → « 2026-10-01 », ou null si invalide. */
export function lireMois(valeur: string | undefined | null): string | null {
  const m = /^(\d{4})-(\d{2})$/.exec(valeur ?? "");
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return null;
  return `${m[1]}-${m[2]}-01`;
}

/** Mois décalé de n mois : decaler("2026-01-01", -1) → « 2025-12-01 ». */
export function decaler(mois: string, n: number): string {
  const total = Number(mois.slice(0, 4)) * 12 + Number(mois.slice(5, 7)) - 1 + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
}

/** « 2026-10-01 » → « octobre 2026 ». */
export const libelleMois = (mois: string) => `${MOIS[Number(mois.slice(5, 7)) - 1]} ${mois.slice(0, 4)}`;

/** Rappel du règlement, à envoyer par WhatsApp au membre qui n'a pas encore payé. */
export const messageRappel = (nom: string, mois: string) => [
  `Bonjour ${nom},`,
  `La PGM vous rappelle que votre cotisation de ${libelleMois(mois)} n'est pas encore payée.`,
  "Règlement intérieur, art. 2 et 3 : chaque membre « doit s'acquitter régulièrement de ses contributions ».",
  "Art. 27 : le refus de s'acquitter de ses contributions est un manquement qui ne peut pas être toléré.",
  "Merci de régulariser auprès de votre responsable.",
].join("\n");

/** Lien WhatsApp vers le numéro du membre (format RDC accepté : 081…, +243 81…). */
export function lienWhatsAppVers(telephone: string | null, texte: string) {
  let n = (telephone ?? "").replace(/\D/g, "");
  if (n.startsWith("0")) n = `243${n.slice(1)}`;
  return `https://wa.me/${n.length >= 9 ? n : ""}?text=${encodeURIComponent(texte)}`;
}
