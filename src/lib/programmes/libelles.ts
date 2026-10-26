import type { CodeVoix } from "@/lib/membres/libelles";

export const STATUTS_ACTIVITE = {
  prevue: "Prévue",
  confirmee: "Confirmée",
  realisee: "Réalisée",
  reportee: "Reportée",
  annulee: "Annulée",
} as const;
export type CodeStatutActivite = keyof typeof STATUTS_ACTIVITE;

export const TYPES_ANNONCE = {
  officielle: "Officielle",
  communique: "Communiqué",
  invitation: "Invitation",
  changement: "Changement",
  urgente: "Urgente",
} as const;
export type CodeTypeAnnonce = keyof typeof TYPES_ANNONCE;

export const STATUTS_PRESENCE = { present: "Présent", absent: "Absent", excuse: "Excusé" } as const;
export type CodeStatutPresence = keyof typeof STATUTS_PRESENCE;

/** Fuseau de Muanda (heure d'Afrique de l'Ouest, UTC+1, sans heure d'été). */
export const FUSEAU = "Africa/Kinshasa";

/** « 2026-11-02T16:00 » saisi à Muanda → instant ISO. */
export const depuisSaisieLocale = (valeur: string) => `${valeur}:00+01:00`;

/** Instant ISO → valeur d'un champ datetime-local, à l'heure de Muanda. */
export function versSaisieLocale(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 3600_000);
  return d.toISOString().slice(0, 16);
}

/** Jour (AAAA-MM-JJ) d'un instant, à l'heure de Muanda. */
export const jourLocal = (iso: string) => versSaisieLocale(iso).slice(0, 10);

export type Ciblage = {
  portee: string | null;
  pourTous: boolean;
  paroisses: string[];
  chorales: string[];
  voix: CodeVoix[];
};

/** Même règle que la fonction SQL public.concerne : la base reste l'arbitre. */
export function concerne(c: Ciblage, m: { paroisseId: string; choraleId: string | null; voixCode: CodeVoix | null }) {
  if (c.portee && m.paroisseId !== c.portee) return false;
  return (
    c.pourTous ||
    c.paroisses.includes(m.paroisseId) ||
    (!!m.choraleId && c.chorales.includes(m.choraleId)) ||
    (!!m.voixCode && c.voix.includes(m.voixCode))
  );
}

/** Lien qui ouvre WhatsApp avec un message prérempli : c'est l'utilisateur qui choisit le destinataire et envoie. */
export const lienWhatsApp = (texte: string) => `https://wa.me/?text=${encodeURIComponent(texte)}`;

/** Instant ISO décalé de `jours` jours par rapport à maintenant (négatif = passé). */
export const dansJours = (jours: number) => new Date(Date.now() + jours * 86400_000).toISOString();
