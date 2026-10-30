"use client";

import { MessageCircle } from "lucide-react";

/** Le « f » de Facebook (lucide n'a plus de logos de marques). */
function Facebook() {
  return (
    <svg className="i" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" stroke="none" d="M13.5 21v-7.5H16l.5-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z" />
    </svg>
  );
}

/**
 * Partager une page sur WhatsApp ou Facebook. L'image de la page (photo de la
 * publication, miniature de la vidéo ou logo) s'affiche dans l'aperçu du partage.
 */
export function Partage({ texte, chemin, compact = false }: { texte: string; chemin?: string; compact?: boolean }) {
  const adresse = () => (chemin ? new URL(chemin, window.location.origin).toString() : window.location.href.split("#")[0]);
  const ouvrir = (url: string) => window.open(url, "_blank", "noopener,noreferrer");


  return (
    <div className={`partage${compact ? " compact" : ""}`}>
      {!compact && <span className="partage-titre">Partager</span>}
      <button type="button" className="p-wa" onClick={() => ouvrir(`https://wa.me/?text=${encodeURIComponent(`${texte}\n${adresse()}`)}`)}>
        <MessageCircle className="i" aria-hidden />WhatsApp
      </button>
      <button type="button" className="p-fb" onClick={() => ouvrir(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(adresse())}`)}>
        <Facebook />Facebook
      </button>
    </div>
  );
}
