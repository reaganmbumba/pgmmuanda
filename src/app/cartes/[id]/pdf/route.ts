import { NextResponse, type NextRequest } from "next/server";
import { utilisateurCourant } from "@/lib/auth/session";
import { carteImprimable } from "@/lib/cartes/depot";
import { pdfCarte } from "@/lib/cartes/pdf";
import { supabaseActif } from "@/lib/supabase/config";

/**
 * PDF d'une carte active (recto + verso).
 * Accessible au staff de la paroisse et au titulaire : la base filtre selon l'utilisateur.
 */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!supabaseActif || !/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Carte introuvable.", { status: 404 });
  const moi = await utilisateurCourant();
  if (!moi || moi.role === "controleur") return new NextResponse("Connexion requise.", { status: 401 });
  const carte = await carteImprimable(id);
  if (!carte) return new NextResponse("Carte introuvable.", { status: 404 });
  const pdf = await pdfCarte(carte);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="carte-${carte.matricule}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
