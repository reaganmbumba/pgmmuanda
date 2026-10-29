import { NextResponse, type NextRequest } from "next/server";
import { utilisateurCourant } from "@/lib/auth/session";
import { peutSuivreFinances } from "@/lib/auth/roles";
import { fichierCsv } from "@/lib/csv";
import { listerOperations } from "@/lib/organisation/depot";
import { SENS_OPERATION } from "@/lib/organisation/libelles";
import { supabaseActif } from "@/lib/supabase/config";

/** Export des opérations de l'année, limitées par la base à ce que l'utilisateur peut voir. */
export async function GET(request: NextRequest) {
  if (!supabaseActif) return new NextResponse("Export indisponible en mode maquette.", { status: 404 });
  const moi = await utilisateurCourant();
  if (!moi || !peutSuivreFinances(moi.role)) return new NextResponse("Accès refusé.", { status: 403 });
  const annee = Number(request.nextUrl.searchParams.get("annee"));
  if (!Number.isInteger(annee) || annee < 2000 || annee > 2100) return new NextResponse("Année invalide.", { status: 400 });
  const ops = await listerOperations({ depuis: `${annee}-01-01`, avant: `${annee + 1}-01-01` });
  // Montant avec virgule décimale, pour Excel en français
  const lignes = ops.reverse().map((o) => [o.date, SENS_OPERATION[o.sens], o.libelle, o.categorie,
    (o.sens === "depense" ? -o.montant : o.montant).toFixed(2).replace(".", ","), o.devise, o.projet, o.piece, o.saisiPar ?? ""]);
  const csv = fichierCsv(["Date", "Type", "Motif", "Catégorie", "Montant", "Monnaie", "Projet", "Reçu / facture", "Enregistré par"], lignes);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="finances-pgm-muanda-${annee}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
