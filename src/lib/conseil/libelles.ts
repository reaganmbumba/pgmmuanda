import { formatDateHeure } from "@/lib/format";

/** Fonctions du Conseil de la PGM, dans l'ordre du Cadre général (art. 28). */
export const FONCTIONS_CONSEIL = {
  president: "Président",
  administration: "Conseiller chargé de l'Administration (Vice-président)",
  secretaire: "Secrétaire",
  finances: "Conseiller chargé des Finances",
  caisse: "Caissier(e)",
  technique: "Conseiller chargé de la Technique et de la Culture",
  social: "Conseiller chargé du Social et de la Logistique",
  juridique: "Conseiller chargé des Questions Juridiques",
  discipline: "Conseiller chargé de la Discipline",
  relations: "Conseiller chargé des Relations Extérieures",
  presse: "Conseiller chargé de la Presse",
} as const;
export type CodeFonction = keyof typeof FONCTIONS_CONSEIL;

/** « Chaque conseiller est assisté d'un adjoint » ; le Président n'en a pas. */
export const aUnAdjoint = (f: CodeFonction) => f !== "president";

export function libelleFonction(f: CodeFonction, adjoint: boolean): string {
  if (!adjoint) return FONCTIONS_CONSEIL[f];
  if (f === "secretaire") return "Secrétaire adjoint";
  if (f === "caisse") return "Caissier(e) adjoint(e)";
  return `Adjoint du c${FONCTIONS_CONSEIL[f].slice(1)}`;
}

/** Nombre de sièges du Conseil : 11 fonctions, chacune avec un adjoint sauf le Président. */
export const SIEGES_CONSEIL = Object.keys(FONCTIONS_CONSEIL).length * 2 - 1;

/** Art. 29 : mandat de 4 ans renouvelable. Renvoie la date de fin (exclue). */
export function finMandat(debut: string): string {
  const [a, m, j] = debut.split("-").map(Number);
  const d = new Date(Date.UTC(a + 4, m - 1, j));
  // 29 février → 1er mars quatre ans plus tard si l'année n'est pas bissextile : on garde le 28
  if (d.getUTCMonth() !== m - 1) d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}

export const TYPES_REUNION = {
  conseil: "Réunion du Conseil",
  ag_ordinaire: "Assemblée générale ordinaire",
  ag_extraordinaire: "Assemblée générale extraordinaire",
} as const;
export type CodeTypeReunion = keyof typeof TYPES_REUNION;

export const STATUTS_REUNION = { convoquee: "Convoquée", tenue: "Tenue", annulee: "Annulée" } as const;
export type CodeStatutReunion = keyof typeof STATUTS_REUNION;

/** Art. 21 : une Assemblée générale se convoque au moins 15 jours avant. */
export const DELAI_AG_JOURS = 15;
export const estAssemblee = (t: CodeTypeReunion) => t !== "conseil";

/** Art. 30 : le Conseil ne délibère valablement que si au moins 50 % de ses membres sont présents. */
export const quorumAtteint = (presents: number, membres: number) => membres > 0 && presents * 2 >= membres;

/**
 * Art. 31 : trois réunions consécutives sans justification.
 * `statuts` : la présence du membre aux réunions du Conseil tenues, de la plus récente à la plus ancienne.
 */
export const absencesConsecutives = (statuts: string[]) => {
  let n = 0;
  for (const s of statuts) {
    if (s !== "absent") break;
    n++;
  }
  return n;
};
export const SEUIL_ART_31 = 3;

/** Texte de la convocation à partager sur WhatsApp (l'envoi reste fait par vous). */
export function messageConvocation(r: { typeCode: CodeTypeReunion; titre: string; debut: string; lieu: string; ordreDuJour: string }) {
  return [
    `CONVOCATION — ${TYPES_REUNION[r.typeCode]}`,
    r.titre,
    `Date : ${formatDateHeure(r.debut)}`,
    ...(r.lieu ? [`Lieu : ${r.lieu}`] : []),
    "",
    "Ordre du jour :",
    r.ordreDuJour,
    "",
    estAssemblee(r.typeCode)
      ? "Cadre général, art. 21 : seuls les points de l'ordre du jour peuvent faire l'objet d'une décision."
      : "Cadre général, art. 30 : le Conseil ne délibère valablement que si au moins la moitié de ses membres sont présents.",
    "Présidence générale de la musique — EBNM KCC",
  ].join("\n");
}
