import { NextResponse, type NextRequest } from "next/server";
import { utilisateurCourant } from "@/lib/auth/session";
import { estStaff } from "@/lib/auth/roles";
import { listerMembres } from "@/lib/membres/depot";
import { supabaseActif } from "@/lib/supabase/config";

const cellule = (v: string) => {
  // Neutralise les formules (=, +, -, @) qu'Excel exécuterait à l'ouverture.
  const t = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

/** Export des membres visibles par l'utilisateur, au format CSV lisible par Excel. */
export async function GET(request: NextRequest) {
  if (!supabaseActif) return new NextResponse("Export indisponible en mode maquette.", { status: 404 });
  const moi = await utilisateurCourant();
  if (!moi || !estStaff(moi.role) || moi.role === "controleur") return new NextResponse("Accès refusé.", { status: 403 });

  const archives = request.nextUrl.searchParams.get("vue") === "archives";
  const membres = await listerMembres({ archives });
  const entete = ["Matricule", "Nom", "Postnom", "Prénom", "Sexe", "Téléphone", "E-mail", "Paroisse", "Chorale", "Voix", "Fonction", "Date d'adhésion", "Statut"];
  const lignes = membres.map((m) =>
    [m.matricule, m.nom, m.postnom, m.prenom, m.sexe ?? "", m.telephone, m.email, m.paroisse, m.chorale, m.voix, m.fonction, m.dateAdhesion, m.statut]
      .map(cellule).join(";"),
  );
  const csv = "﻿" + [entete.join(";"), ...lignes].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="membres-pgm-muanda-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
