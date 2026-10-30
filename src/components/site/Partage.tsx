"use client";

import { Link2, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

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
  const [copie, setCopie] = useState(false);
  const adresse = () => (chemin ? new URL(chemin, window.location.origin).toString() : window.location.href.split("#")[0]);
  const ouvrir = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  async function autre() {
    const url = adresse();
    if (navigator.share) return navigator.share({ title: texte, text: texte, url }).catch(() => {});
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch { /* presse-papiers refusé */ }
  }

  return (
    <div className={`partage${compact ? " compact" : ""}`}>
      {!compact && <span className="partage-titre">Partager</span>}
      <button type="button" className="p-wa" onClick={() => ouvrir(`https://wa.me/?text=${encodeURIComponent(`${texte}\n${adresse()}`)}`)}>
        <MessageCircle className="i" aria-hidden />WhatsApp
      </button>
      <button type="button" className="p-fb" onClick={() => ouvrir(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(adresse())}`)}>
        <Facebook />Facebook
      </button>
      <button type="button" className="p-autre" onClick={autre} aria-label="Autres façons de partager">
        {copie ? <><Link2 className="i" aria-hidden />Lien copié</> : <Share2 className="i" aria-hidden />}
      </button>
    </div>
  );
}
