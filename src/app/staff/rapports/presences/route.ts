import { NextResponse, type NextRequest } from "next/server";
import { utilisateurCourant } from "@/lib/auth/session";
import { estStaff } from "@/lib/auth/roles";
import { fichierCsv } from "@/lib/csv";
import { STATUTS_PRESENCE, type CodeStatutPresence } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";

const fr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Kinshasa" });

/** Export des présences de la période, limitées par la base au périmètre de l'utilisateur. */
export async function GET(request: NextRequest) {
  if (!supabaseActif) return new NextResponse("Export indisponible en mode maquette.", { status: 404 });
  const moi = await utilisateurCourant();
  if (!moi || !estStaff(moi.role) || moi.role === "controleur") return new NextResponse("Accès refusé.", { status: 403 });
  const jours = Math.min(366, Math.max(1, Number(request.nextUrl.searchParams.get("jours")) || 30));
  const depuis = new Date(Date.now() - jours * 86400_000).toISOString();

  const supabase = await creerClientServeur();
  const { data, error } = await supabase.from("presences")
    .select("statut, methode, activites!inner(titre, debut), membres!inner(matricule, nom, prenom, paroisses(nom))")
    .gte("activites.debut", depuis);
  if (error) return new NextResponse("Export impossible.", { status: 500 });
  type L = {
    statut: CodeStatutPresence; methode: string; activites: { titre: string; debut: string };
    membres: { matricule: string; nom: string; prenom: string; paroisses: { nom: string } | null };
  };
  const lignes = (data as unknown as L[])
    .sort((a, b) => a.activites.debut.localeCompare(b.activites.debut) || a.membres.matricule.localeCompare(b.membres.matricule))
    .map((p) => [fr.format(new Date(p.activites.debut)), p.activites.titre, p.membres.matricule, p.membres.nom, p.membres.prenom,
      p.membres.paroisses?.nom ?? "", STATUTS_PRESENCE[p.statut], p.methode === "qr" ? "QR code" : "Manuel"]);
  const csv = fichierCsv(["Date", "Activité", "Matricule", "Nom", "Prénom", "Paroisse", "Présence", "Saisie"], lignes);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="presences-pgm-muanda-${jours}j.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
