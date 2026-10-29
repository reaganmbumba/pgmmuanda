import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EnregistrerApp } from "@/components/InstallerApp";

export const metadata: Metadata = {
  title: {
    default: "PGM MUANDA DIGITAL — EBNM KCC",
    template: "%s · PGM MUANDA DIGITAL",
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
      <body className="antialiased">
        <EnregistrerApp />
        {children}
      </body>
    </html>
  );
}
