"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";

/** Le « f » de Facebook (lucide n'a plus de logos de marques). */
function Facebook() {
  return (
    <svg className="i" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" stroke="none" d="M13.5 21v-7.5H16l.5-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z" />
    </svg>
  );
}

/** L'image de la publication en fichier joint, si le téléphone sait la partager. */
async function fichierImage(image: string): Promise<File | null> {
  try {
    const reponse = await fetch(image);
    if (!reponse.ok) return null;
    const blob = await reponse.blob();
    const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const fichier = new File([blob], `pgm-muanda.${extension}`, { type: blob.type || "image/jpeg" });
    return navigator.canShare?.({ files: [fichier] }) ? fichier : null;
  } catch {
    return null;
  }
}

/**
 * Partager une page sur WhatsApp ou Facebook. L'image de la page (photo de la
 * publication, miniature de la vidéo ou logo) est jointe au message WhatsApp
 * avec le texte complet ; sur Facebook, elle s'affiche dans l'aperçu du lien.
 */
export function Partage({ texte, chemin, image, compact = false }: { texte: string; chemin?: string; image?: string | null; compact?: boolean }) {
  const adresse = () => (chemin ? new URL(chemin, window.location.origin).toString() : window.location.href.split("#")[0]);
  const ouvrir = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  // le lien juste après le titre : WhatsApp en tire l'aperçu avec l'image
  const message = () => {
    const [titre, ...suite] = texte.split("\n\n");
    return [titre, adresse(), ...suite].join("\n\n");
  };
  const [copie, setCopie] = useState(false);
  // l'image est préparée à l'avance : le partage s'ouvre tout de suite au toucher
  const imagePrete = useRef<Promise<File | null> | null>(null);
  useEffect(() => {
    imagePrete.current = image ? fichierImage(image) : null;
  }, [image]);

  // Lien wa.me : le texte complet ; le lien fait apparaître l'aperçu de l'image.
  function whatsappTexte() {
    setCopie(false);
    ouvrir(`https://wa.me/?text=${encodeURIComponent(message())}`);
  }

  // WhatsApp : l'image de la publication part en pièce jointe, avec le texte
  // complet en légende. Certains téléphones ne gardent que l'image : le texte
  // est donc aussi copié, prêt à être collé. Sans image ou si le téléphone ne
  // sait pas partager de fichier, on envoie le texte avec le lien.
  async function whatsapp() {
    const texteComplet = message();
    const fichier = image ? await (imagePrete.current ?? fichierImage(image)) : null;
    if (!fichier) return whatsappTexte();
    let copieOk = false;
    try {
      await navigator.clipboard?.writeText(texteComplet);
      copieOk = true;
    } catch { /* presse-papiers refusé : on partage quand même */ }
    setCopie(copieOk);
    try {
      await navigator.share({ files: [fichier], text: texteComplet, title: texte.split("\n")[0] });
    } catch (e) {
      if ((e as Error).name !== "AbortError") whatsappTexte();
    }
  }

  return (
    <div className={`partage${compact ? " compact" : ""}`}>
      {!compact && <span className="partage-titre">Partager</span>}
      <button type="button" className="p-wa" onClick={whatsapp}>
        <MessageCircle className="i" aria-hidden />WhatsApp
      </button>
      <button type="button" className="p-fb" onClick={() => ouvrir(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(adresse())}`)}>
        <Facebook />Facebook
      </button>
      {copie && <span className="partage-note">L’image part avec le texte. Si le texte n’apparaît pas sous l’image, appuyez longtemps dans la zone de message puis « Coller » : il est déjà copié.</span>}
    </div>
  );
}
