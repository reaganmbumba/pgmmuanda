/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BoutonEspace } from "./BoutonEspace";
import { NavigationSite } from "./NavigationSite";
import "./site-public.css";

/* Menu de l'en-tête sur ordinateur (sur téléphone, la barre d'onglets en bas le remplace). */
const MENU_HAUT = [
  { href: "/la-pgm", nom: "La PGM" },
  { href: "/chorales", nom: "Chorales" },
  { href: "/programme", nom: "Programme" },
  { href: "/direct", nom: "Direct" },
  { href: "/actualites", nom: "Actualités" },
  { href: "/contact", nom: "Contact" },
];

const LIENS_PIED = [
  { href: "/la-pgm", nom: "La PGM" },
  { href: "/chorales", nom: "Nos chorales" },
  { href: "/programme", nom: "Programme" },
  { href: "/commissions", nom: "Commissions" },
  { href: "/nous-rejoindre", nom: "Nous rejoindre" },
  { href: "/reglement", nom: "Règlement intérieur" },
];

const LIENS_SUIVRE = [
  { href: "/direct", nom: "PGM Muanda TV" },
  { href: "/ecouter", nom: "Écouter" },
  { href: "/soirees", nom: "Soirées musicales" },
  { href: "/actualites", nom: "Actualités" },
  { href: "/questions", nom: "Questions" },
  { href: "/contact", nom: "Contact" },
];

/** En-tête, pied de page et barre d'onglets communs aux pages du site public. */
export function CadreSite({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-pgm">
      <header className="site cadre">
        <div className="col large">
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
          <nav className="menu-haut" aria-label="Menu du site">
            {MENU_HAUT.map(({ href, nom }) => <Link key={href} href={href}>{nom}</Link>)}
          </nav>
          <BoutonEspace />
        </div>
      </header>
      {children}
      <footer className="pied cadre">
        <div className="col large">
          <div className="pied-grille">
            <div className="pied-marque">
              <div className="logos-pied">
                <img src="/logo-pgm.png" alt="Logo de la PGM" />
                <img className="kcc" src="/logo-kcc.png" alt="Logo KCC" />
              </div>
              <b>PGM Antenne de Muanda</b>
              <span>Présidence générale de la musique, une branche de l&apos;Église Bon Nouveau Message (KCC)</span>
              <span>Muanda, Kongo-Central, RD Congo</span>
            </div>
            <nav className="pied-liens" aria-label="La PGM">
              <b>La PGM</b>
              {LIENS_PIED.map(({ href, nom }) => <Link key={href} href={href}>{nom}</Link>)}
            </nav>
            <nav className="pied-liens" aria-label="Nous suivre">
              <b>Nous suivre</b>
              {LIENS_SUIVRE.map(({ href, nom }) => <Link key={href} href={href}>{nom}</Link>)}
            </nav>
          </div>
          <div className="pied-bas">
            <span className="concepteur">Application conçue par le <b>Prédicateur Reagan MBUMBA</b></span>
            <Link className="lien-pied" href="/confidentialite">Confidentialité</Link>
          </div>
        </div>
      </footer>
      <NavigationSite />
    </div>
  );
}
