import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EnregistrerApp } from "@/components/InstallerApp";

const SCRIPT_INSTALLATION = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__invitationPGM=e;window.dispatchEvent(new Event("pgm-installable"))});if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js").catch(function(){});`;

export const metadata: Metadata = {
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
