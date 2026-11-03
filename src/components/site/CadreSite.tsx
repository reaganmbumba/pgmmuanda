/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BoutonEspace } from "./BoutonEspace";
import { NavigationSite } from "./NavigationSite";
import "./site-public.css";

/** En-tête, pied de page et barre d'onglets communs aux pages du site public. */
export function CadreSite({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-pgm">
      <header className="site cadre">
        <div className="col">
          <Link className="marque" href="/">
            <span className="logos">
              <img src="/logo-pgm.png" alt="PGM" />
              <img className="kcc" src="/logo-kcc.png" alt="KCC" />
            </span>
            <span>
              <b>PGM ANTENNE DE MUANDA</b>
              <span>EBNM KCC</span>
            </span>
          </Link>
          <BoutonEspace />
        </div>
      </header>
      {children}
      <footer className="pied cadre">
        <div className="col">
          <div className="logos-pied">
            <img src="/logo-pgm.png" alt="Logo de la PGM" />
            <img className="kcc" src="/logo-kcc.png" alt="Logo KCC" />
          </div>
          <b>PGM Antenne de Muanda</b>
          <span>Présidence générale de la musique, une branche de l&apos;Église Bon Nouveau Message (KCC)</span>
          <span className="concepteur">Application conçue par le <b>Prédicateur Reagan MBUMBA</b></span>
          <Link className="lien-pied" href="/confidentialite">Confidentialité</Link>
        </div>
      </footer>
      <NavigationSite />
    </div>
  );
}
