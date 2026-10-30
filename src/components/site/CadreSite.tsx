/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { LogIn } from "lucide-react";
import { NavigationSite } from "./NavigationSite";
import "./site-public.css";

/** En-tête, pied de page et barre d'onglets communs aux pages du site public. */
export function CadreSite({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-pgm">
      <header className="site cadre">
        <div className="col">
          <Link className="marque" href="/">
            <img src="/logo-pgm.png" alt="" />
            <span>
              <b>PGM ANTENNE DE MUANDA</b>
              <span>EBNM KCC</span>
            </span>
          </Link>
          <Link className="btn-connexion" href="/connexion">
            <LogIn className="i" aria-hidden />
            Se connecter
          </Link>
        </div>
      </header>
      {children}
      <footer className="pied cadre">
        <div className="col">
          <img src="/logo-pgm.png" alt="" />
          <b>PGM Antenne de Muanda</b>
          <span>Présidence générale de la musique · EBNM KCC</span>
        </div>
      </footer>
      <NavigationSite />
    </div>
  );
}
