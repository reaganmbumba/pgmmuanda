import "server-only";
import type { Metadata } from "next";
import { lireElement, urlFichier, type ElementSite } from "./contenu";

/* Titre, résumé et image affichés quand une page est partagée sur WhatsApp ou Facebook. */

const IMAGE_DEFAUT = { url: "/og-pgm.png", width: 1200, height: 630, alt: "PGM Antenne de Muanda" };

export function metaPartage({ titre, texte, image, chemin }: { titre: string; texte?: string | null; image?: string | null; chemin: string }): Metadata {
  const description = (texte ?? "").replace(/\s+/g, " ").slice(0, 200) || undefined;
  return {
    title: titre,
    description,
    alternates: { canonical: chemin },
    openGraph: {
      type: "article", locale: "fr_FR", siteName: "PGM Antenne de Muanda", url: chemin,
      title: titre, description, images: [image ? { url: image } : IMAGE_DEFAUT],
    },
  };
}

export async function metaPublication(id: string, chemin: string, defaut: string): Promise<Metadata> {
  const e: ElementSite | null = await lireElement(id);
  if (!e || !e.publie) return { title: defaut };
  return metaPartage({ titre: e.titre, texte: e.sousTitre ?? e.texte, image: e.image ? urlFichier(e.image) : null, chemin });
}
