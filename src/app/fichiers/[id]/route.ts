import { NextResponse } from "next/server";
import { utilisateurCourant } from "@/lib/auth/session";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";

/** Téléchargement d'un fichier : la base vérifie que l'utilisateur a le droit de le lire. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabaseActif) return new NextResponse("Indisponible en mode maquette.", { status: 404 });
  const moi = await utilisateurCourant();
  if (!moi) return new NextResponse("Connectez-vous pour ouvrir ce fichier.", { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse("Fichier introuvable.", { status: 404 });
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("documents").select("nom_fichier, type_mime, contenu").eq("id", id).maybeSingle();
  if (!data) return new NextResponse("Fichier introuvable ou accès refusé.", { status: 404 });
  const octets = Buffer.from(data.contenu, "base64");
  const affichable = data.type_mime !== "audio/mpeg";
  return new NextResponse(octets, {
    headers: {
      "Content-Type": data.type_mime,
      "Content-Length": String(octets.length),
      "Content-Disposition": `${affichable ? "inline" : "attachment"}; filename="${data.nom_fichier}"`,
      "X-Content-Type-Options": "nosniff",
      // Une image ouverte dans le navigateur ne peut exécuter aucun script.
      // (Pas pour les PDF : le lecteur PDF du navigateur ne s'affiche pas en mode « sandbox ».)
      ...(data.type_mime === "application/pdf" ? {} : { "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; media-src 'self'" }),
      "Cache-Control": "private, no-store",
    },
  });
}
