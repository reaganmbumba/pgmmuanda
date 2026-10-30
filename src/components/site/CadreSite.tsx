/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { LogIn } from "lucide-react";
import { NavigationSite } from "./NavigationSite";
import "./site-public.css";

const POLICES =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Source+Sans+3:wght@400;600;700&display=swap";

/** En-tête, pied de page et barre d'onglets communs aux pages du site public. */
export function CadreSite({
  children,
  onglet,
  prefixe,
}: {
  children: React.ReactNode;
  onglet?: string;
  prefixe?: string;
}) {
  return (
    <div className="site-pgm">
      <link rel="stylesheet" href={POLICES} precedence="default" />
      <header className="site cadre">
        <div className="col">
          <img src="/logo-pgm.png" alt="Logo de la PGM" />
          <div className="marque">
            <b>PGM ANTENNE DE MUANDA</b>
            <span>EBNM KCC</span>
          </div>
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
      <NavigationSite fixe={onglet} prefixe={prefixe} />
    </div>
  );
}
