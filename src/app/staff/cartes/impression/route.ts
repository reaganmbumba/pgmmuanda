import { NextResponse, type NextRequest } from "next/server";
import { utilisateurCourant } from "@/lib/auth/session";
import { peutGererMembres } from "@/lib/auth/roles";
import { cartesActivesImprimables } from "@/lib/cartes/depot";
import { pdfPlanche } from "@/lib/cartes/pdf";
import { supabaseActif } from "@/lib/supabase/config";

/** Planches A4 des cartes actives visibles (toutes, ou celles d'une paroisse). */
export async function GET(request: NextRequest) {
  if (!supabaseActif) return new NextResponse("Indisponible en mode maquette.", { status: 404 });
  const moi = await utilisateurCourant();
  if (!moi || !peutGererMembres(moi.role)) return new NextResponse("Accès refusé.", { status: 403 });
  const paroisse = request.nextUrl.searchParams.get("paroisse");
  const cartes = await cartesActivesImprimables(paroisse && /^[0-9a-f-]{36}$/i.test(paroisse) ? paroisse : undefined);
  if (cartes.length === 0) return new NextResponse("Aucune carte active à imprimer.", { status: 404 });
  const pdf = await pdfPlanche(cartes);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="cartes-pgm-muanda-${date}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
