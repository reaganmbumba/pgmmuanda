"use client";

import { Share2 } from "lucide-react";

/** Partage par le menu du téléphone, ou par WhatsApp quand ce menu n'existe pas. */
export function BoutonPartager({ texte, chemin }: { texte: string; chemin: string }) {
  function partager() {
    const url = new URL(chemin, window.location.origin).toString();
    if (navigator.share) {
      navigator.share({ text: texte, url }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${texte}\n${url}`)}`, "_blank", "noopener");
    }
  }
  return (
    <button type="button" className="partager" onClick={partager}>
      <Share2 className="i" aria-hidden />Partager
    </button>
  );
}
