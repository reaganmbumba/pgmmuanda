import "server-only";
import type { Ciblage } from "@/lib/programmes/libelles";
import { creerClientServeur } from "@/lib/supabase/server";
import type { TypeFichier } from "./fichiers";

export type Document = {
  id: string; titre: string; nomFichier: string; type: TypeFichier; taille: number; date: string;
  chantId: string | null; operationId: string | null; ciblage: Ciblage;
};

// Jamais le contenu dans les listes : il n'est lu qu'au téléchargement.
const COLONNES = "id, titre, nom_fichier, type_mime, taille, cree_le, chant_id, operation_id, portee_paroisse, pour_tous, cible_paroisses, cible_chorales, cible_voix";
type Ligne = {
  id: string; titre: string; nom_fichier: string; type_mime: TypeFichier; taille: number; cree_le: string;
  chant_id: string | null; operation_id: string | null; portee_paroisse: string | null; pour_tous: boolean;
  cible_paroisses: string[]; cible_chorales: string[]; cible_voix: Ciblage["voix"];
};
const versDocument = (l: Ligne): Document => ({
  id: l.id, titre: l.titre, nomFichier: l.nom_fichier, type: l.type_mime, taille: l.taille, date: l.cree_le,
  chantId: l.chant_id, operationId: l.operation_id,
  ciblage: { portee: l.portee_paroisse, pourTous: l.pour_tous, paroisses: l.cible_paroisses, chorales: l.cible_chorales, voix: l.cible_voix },
});

/** Documents visibles par l'utilisateur (la base applique les règles d'accès). */
export async function listerDocuments(f: { chantId?: string; operations?: string[]; generaux?: boolean }): Promise<Document[]> {
  const supabase = await creerClientServeur();
  let q = supabase.from("documents").select(COLONNES).order("cree_le", { ascending: false });
  if (f.chantId) q = q.eq("chant_id", f.chantId);
  if (f.operations) q = q.in("operation_id", f.operations.length ? f.operations : ["00000000-0000-0000-0000-000000000000"]);
  if (f.generaux) q = q.is("chant_id", null).is("operation_id", null);
  const { data, error } = await q;
  if (error) throw new Error("Lecture des documents impossible.");
  return (data as unknown as Ligne[]).map(versDocument);
}
