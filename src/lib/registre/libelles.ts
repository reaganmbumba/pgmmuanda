/** Registre de présence des chorales : jours habituels et séances. */

export const JOURS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

export const TYPES_SEANCE = { repetition: "Répétition", culte: "Culte", autre: "Autre séance" } as const;
export type CodeTypeSeance = keyof typeof TYPES_SEANCE;
export const estTypeSeance = (v: unknown): v is CodeTypeSeance => typeof v === "string" && v in TYPES_SEANCE;

export type Horaire = { id: string; choraleId: string; jour: number; type: CodeTypeSeance; heure: string };

/** Jour de la semaine d'une date AAAA-MM-JJ : 1 = lundi … 7 = dimanche. */
export function jourIso(date: string): number {
  const j = new Date(`${date}T12:00:00Z`).getUTCDay();
  return j === 0 ? 7 : j;
}

/** Date du jour à Muanda, au format AAAA-MM-JJ. */
export const aujourdhuiMuanda = (maintenant = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Kinshasa" }).format(maintenant);

/** « Lundi 27 octobre 2026 » */
export function libelleJour(date: string): string {
  const t = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${date}T12:00:00Z`));
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Le type de séance prévu ce jour-là (le premier jour habituel qui correspond), sinon une répétition. */
export function typePropose(horaires: Pick<Horaire, "jour" | "type">[], date: string): CodeTypeSeance {
  return horaires.find((h) => h.jour === jourIso(date))?.type ?? "repetition";
}

/** Les jours habituels triés de lundi à dimanche : « Lundi : répétition à 17 h 00 ». */
export function trierHoraires<T extends Pick<Horaire, "jour" | "heure">>(horaires: T[]): T[] {
  return [...horaires].sort((a, b) => a.jour - b.jour || a.heure.localeCompare(b.heure));
}

export const libelleHeure = (heure: string) => heure.slice(0, 5).replace(":", " h ");
