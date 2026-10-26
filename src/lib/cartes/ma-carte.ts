import "server-only";
import type { DonneesCarte } from "@/components/carte/CarteMembre";
import { utilisateurCourant } from "@/lib/auth/session";
import { choristeConnecte } from "@/lib/demo-data";
import { maFiche } from "@/lib/membres/depot";
import { supabaseActif } from "@/lib/supabase/config";
import { cartesDuMembre } from "./depot";

/** Carte active du choriste connecté (ou celle de la démonstration en mode maquette). */
export async function maCarte(): Promise<{ donnees: DonneesCarte | null; carteId: string | null; relie: boolean }> {
  if (!supabaseActif) return { donnees: choristeConnecte, carteId: null, relie: true };
  const u = await utilisateurCourant();
  const fiche = u ? await maFiche(u.id) : null;
  if (!fiche) return { donnees: null, carteId: null, relie: false };
  const active = (await cartesDuMembre(fiche.id)).find((c) => c.statutCode === "active");
  if (!active) return { donnees: null, carteId: null, relie: true };
  return { donnees: { ...fiche, carte: active }, carteId: active.id, relie: true };
}
