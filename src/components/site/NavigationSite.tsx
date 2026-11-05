"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUp, Headphones, House, Newspaper, Phone, Radio } from "lucide-react";

const ONGLETS = [
  { href: "/", nom: "Accueil", Icone: House },
  { href: "/direct", nom: "Direct", Icone: Radio },
  { href: "/ecouter", nom: "Écouter", Icone: Headphones },
  { href: "/actualites", nom: "Actualités", Icone: Newspaper },
  { href: "/contact", nom: "Contact", Icone: Phone },
];

/** Barre d'onglets en bas de l'écran du site public, et bouton pour remonter en haut. */
export function NavigationSite() {
  const chemin = usePathname();
  const [haut, setHaut] = useState(false);

  useEffect(() => {
    const suivre = () => {
      setHaut(window.scrollY > 600);
      // En-tête plus marqué (ombre) dès qu'on fait défiler la page.
      document.documentElement.toggleAttribute("data-defile", window.scrollY > 8);
    };
    suivre();
    window.addEventListener("scroll", suivre, { passive: true });
    return () => {
      window.removeEventListener("scroll", suivre);
      document.documentElement.removeAttribute("data-defile");
    };
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

/** Menu de l'en-tête sur ordinateur, avec la rubrique ouverte soulignée en or. */
export function MenuHaut({ liens }: { liens: { href: string; nom: string }[] }) {
  const chemin = usePathname();
  return (
    <nav className="menu-haut" aria-label="Menu du site">
      {liens.map(({ href, nom }) => {
        const actif = chemin.startsWith(href);
        return <Link key={href} href={href} className={actif ? "actif" : undefined} aria-current={actif ? "page" : undefined}>{nom}</Link>;
      })}
    </nav>
  );
}
