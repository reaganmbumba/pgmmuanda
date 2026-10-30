import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EnregistrerApp } from "@/components/InstallerApp";

const SCRIPT_INSTALLATION = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__invitationPGM=e;window.dispatchEvent(new Event("pgm-installable"))});if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js").catch(function(){});`;

/** Adresse publique du site, pour les images de partage (WhatsApp, Facebook). */
const ADRESSE = process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(ADRESSE),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "PGM Antenne de Muanda",
    title: "PGM Antenne de Muanda — EBNM KCC",
    description: "Le site de la Présidence générale de la musique, Antenne de Muanda (Église Bon Nouveau Message, KCC).",
    images: [{ url: "/og-pgm.png", width: 1200, height: 630, alt: "PGM Antenne de Muanda" }],
  },
  title: {
    default: "PGM ANTENNE DE MUANDA — EBNM KCC",
    template: "%s · PGM Antenne de Muanda",
  },
  description:
    "Plateforme de gestion de la Présidence générale de la musique de Muanda (EBNM-KCC).",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "PGM Muanda",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1f4b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Le navigateur annonce très tôt que l'application peut être installée : on garde
            cette annonce avant même que la page soit prête, sinon le bouton ne marche pas. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_INSTALLATION }} />
      </head>
      <body className="antialiased">
        <EnregistrerApp />
        {children}
      </body>
    </html>
  );
}
