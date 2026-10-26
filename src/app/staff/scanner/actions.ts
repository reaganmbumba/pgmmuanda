"use server";

import type { CarteVerifiee } from "@/components/carte/ResultatVerification";
import { utilisateurCourant } from "@/lib/auth/session";
import { estStaff } from "@/lib/auth/roles";
import { extraireReference } from "@/lib/cartes/lien";
import { verifierParMatricule, verifierReference } from "@/lib/cartes/verification";

export type ResultatScan = { membre?: CarteVerifiee; erreur?: string; date: number };

export async function verifierScan(contenu: string, mode: "qr" | "matricule"): Promise<ResultatScan> {
  const date = Date.now();
  const moi = await utilisateurCourant();
  if (!moi || !estStaff(moi.role)) return { erreur: "Session expirée : reconnectez-vous.", date };
  if (mode === "matricule") {
    const m = contenu.trim().toUpperCase();
    if (!/^PGM-MUA-\d{4,}$/.test(m)) return { erreur: "Matricule invalide. Format attendu : PGM-MUA-0001.", date };
    return { membre: await verifierParMatricule(m), date };
  }
  const reference = extraireReference(contenu);
  if (!reference) return { erreur: "Ce QR code n'est pas une carte de la PGM Muanda.", date };
  return { membre: await verifierReference(reference), date };
}
