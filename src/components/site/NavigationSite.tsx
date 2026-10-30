"use client";

import { useEffect, useState } from "react";
import { ArrowUp, Calendar, House, Music, Newspaper, Phone } from "lucide-react";

const ONGLETS = [
  { id: "accueil", nom: "Accueil", Icone: House },
  { id: "chorales", nom: "Chorales", Icone: Music },
  { id: "programme", nom: "Programme", Icone: Calendar },
  { id: "actualites", nom: "Actualités", Icone: Newspaper },
  { id: "contact", nom: "Contact", Icone: Phone },
];

/**
 * Barre d'onglets en bas de l'écran du site public. Sur la page d'accueil, l'onglet
 * de la partie visible s'allume ; sur une autre page (un article), on choisit l'onglet.
 */
export function NavigationSite({ fixe, prefixe = "" }: { fixe?: string; prefixe?: string }) {
  const [actif, setActif] = useState(fixe ?? "accueil");
  const [haut, setHaut] = useState(false);

  useEffect(() => {
    if (fixe) return;
    const suivre = () => {
      const y = window.scrollY + window.innerHeight * 0.35;
      let id = "accueil";
      for (const o of ONGLETS) {
        const s = document.getElementById(o.id);
        if (s && s.offsetTop <= y) id = o.id;
      }
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) id = "contact";
      setActif(id);
      setHaut(window.scrollY > 600);
    };
    suivre();
    window.addEventListener("scroll", suivre, { passive: true });
    return () => window.removeEventListener("scroll", suivre);
  }, [fixe]);

  return (
    <>
      {haut && (
        <a className="haut" href="#accueil" aria-label="Revenir en haut">
          <ArrowUp className="i" aria-hidden />
        </a>
      )}
      <nav className="onglets" aria-label="Menu principal">
        <div className="col">
          {ONGLETS.map(({ id, nom, Icone }) => (
            <a key={id} href={`${prefixe}#${id}`} className={actif === id ? "actif" : undefined}>
              <span className="pill"><Icone className="i" aria-hidden /></span>
              {nom}
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}
