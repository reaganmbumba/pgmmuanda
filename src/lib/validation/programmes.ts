import { z } from "zod";
import { VOIX, type CodeVoix } from "@/lib/membres/libelles";
import { depuisSaisieLocale, STATUTS_ACTIVITE, TYPES_ANNONCE, type Ciblage } from "@/lib/programmes/libelles";

const texte = (max: number) => z.string().trim().max(max, `${max} caractères maximum.`);
const uuid = z.string().uuid();
const saisieDate = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Date et heure invalides.");

/** Lit le ciblage commun aux activités et aux annonces (cases à cocher multiples). */
export function lireCiblage(form: FormData): Ciblage | string {
  const portee = String(form.get("portee") ?? "") || null;
  if (portee && !uuid.safeParse(portee).success) return "Portée invalide.";
  const pourTous = form.get("ciblage") !== "cibles";
  const liste = (nom: string) => form.getAll(nom).map(String).filter(Boolean);
  const paroisses = pourTous ? [] : liste("cibleParoisses");
  const chorales = pourTous ? [] : liste("cibleChorales");
  const voix = pourTous ? [] : liste("cibleVoix");
  if ([...paroisses, ...chorales].some((x) => !uuid.safeParse(x).success)) return "Cible invalide.";
  if (voix.some((v) => !(v in VOIX))) return "Voix invalide.";
  if (!pourTous && paroisses.length + chorales.length + voix.length === 0)
    return "Choisissez au moins une paroisse, une chorale ou une voix, ou bien « Tous les membres ».";
  return { portee, pourTous, paroisses, chorales, voix: voix as CodeVoix[] };
}

export const colonnesCiblage = (c: Ciblage) => ({
  portee_paroisse: c.portee,
  pour_tous: c.pourTous,
  cible_paroisses: c.paroisses,
  cible_chorales: c.chorales,
  cible_voix: c.voix,
});

export const schemaActivite = z
  .object({
    titre: texte(150).min(2, "Indiquez le titre de l'activité."),
    description: texte(2000),
    debut: saisieDate,
    fin: z.string().trim().transform((v) => v || null).pipe(saisieDate.nullable()),
    lieu: texte(150),
    responsable: texte(120),
    commissionId: z.string().trim().transform((v) => v || null).pipe(uuid.nullable()),
    statut: z.enum(Object.keys(STATUTS_ACTIVITE) as [keyof typeof STATUTS_ACTIVITE], { message: "Statut invalide." }),
  })
  .refine((d) => !d.fin || d.fin >= d.debut, { message: "La fin doit être après le début.", path: ["fin"] });
export type DonneesActivite = z.infer<typeof schemaActivite>;

export const versLigneActivite = (d: DonneesActivite) => ({
  titre: d.titre,
  description: d.description,
  debut: depuisSaisieLocale(d.debut),
  fin: d.fin ? depuisSaisieLocale(d.fin) : null,
  lieu: d.lieu,
  responsable: d.responsable,
  commission_id: d.commissionId,
  statut: d.statut,
});

export const schemaAnnonce = z.object({
  titre: texte(150).min(2, "Indiquez le titre de l'annonce."),
  contenu: texte(5000).min(1, "Écrivez le texte de l'annonce."),
  type: z.enum(Object.keys(TYPES_ANNONCE) as [keyof typeof TYPES_ANNONCE], { message: "Type d'annonce invalide." }),
});
