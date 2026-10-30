"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUp, Calendar, House, Music, Newspaper, Phone } from "lucide-react";

const ONGLETS = [
  { href: "/", nom: "Accueil", Icone: House },
  { href: "/chorales", nom: "Chorales", Icone: Music },
  { href: "/programme", nom: "Programme", Icone: Calendar },
  { href: "/actualites", nom: "Actualités", Icone: Newspaper },
  { href: "/contact", nom: "Contact", Icone: Phone },
];

/** Barre d'onglets en bas de l'écran du site public, et bouton pour remonter en haut. */
export function NavigationSite() {
  const chemin = usePathname();
  const [haut, setHaut] = useState(false);

  useEffect(() => {
    const suivre = () => setHaut(window.scrollY > 600);
    suivre();
    window.addEventListener("scroll", suivre, { passive: true });
    return () => window.removeEventListener("scroll", suivre);
  }, []);

  return (
    <>
      {haut && (
        <button type="button" className="haut" aria-label="Revenir en haut" onClick={() => window.scrollTo({ top: 0 })}>
          <ArrowUp className="i" aria-hidden />
        </button>
      )}
      <nav className="onglets" aria-label="Menu principal">
        <div className="col">
          {ONGLETS.map(({ href, nom, Icone }) => {
            const actif = href === "/" ? chemin === "/" : chemin.startsWith(href);
            return (
              <Link key={href} href={href} className={actif ? "actif" : undefined} aria-current={actif ? "page" : undefined}>
                <span className="pill"><Icone className="i" aria-hidden /></span>
                {nom}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
