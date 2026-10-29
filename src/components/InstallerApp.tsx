"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus } from "lucide-react";

type InvitationInstallation = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type Etat = "cache" | "bouton" | "iphone" | "menu";

/** Enregistre le service worker (nécessaire pour que le navigateur propose l'installation). */
export function EnregistrerApp() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

/**
 * « Installer l'application » : une icône PGM Muanda sur l'écran d'accueil du téléphone
 * ou sur le bureau de l'ordinateur. Caché quand l'application est déjà installée.
 */
export function InstallerApp({ clair = false, discret = false }: { clair?: boolean; /** Seulement le bouton, sans explications. */ discret?: boolean }) {
  const [etat, setEtat] = useState<Etat>("cache");
  const [invitation, setInvitation] = useState<InvitationInstallation | null>(null);

  useEffect(() => {
    const installee = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (installee) return;
    const iphone = /iphone|ipad|ipod/i.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    // Le navigateur peut proposer l'installation un peu après le chargement de la page
    const attente = setTimeout(() => setEtat((e) => (e === "cache" ? (iphone ? "iphone" : "menu") : e)), 1500);
    const surInvitation = (e: Event) => {
      e.preventDefault();
      setInvitation(e as InvitationInstallation);
      setEtat("bouton");
    };
    const surInstallee = () => setEtat("cache");
    window.addEventListener("beforeinstallprompt", surInvitation);
    window.addEventListener("appinstalled", surInstallee);
    return () => {
      clearTimeout(attente);
      window.removeEventListener("beforeinstallprompt", surInvitation);
      window.removeEventListener("appinstalled", surInstallee);
    };
  }, []);

  if (etat === "cache" || (discret && etat !== "bouton")) return null;
  const cadre = clair ? "border-white/15 bg-white/5 text-white" : "border-or-400/60 bg-or-100/60 text-marine-900";
  const petit = clair ? "text-white/70" : "text-slate-600";

  if (etat === "bouton") {
    return (
      <button type="button" data-installer
        onClick={async () => {
          if (!invitation) return;
          await invitation.prompt();
          const { outcome } = await invitation.userChoice;
          if (outcome === "accepted") setEtat("cache");
        }}
        className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-or-500 px-4 py-3 text-left font-semibold text-marine-950 shadow-sm hover:bg-or-400">
        <Download className="size-6 shrink-0" aria-hidden />
        <span>
          Installer l&apos;application
          <span className="block text-xs font-normal text-marine-900/80">Une icône PGM Muanda sur votre téléphone ou votre ordinateur</span>
        </span>
      </button>
    );
  }

  return (
    <div className={`rounded-2xl border p-4 text-sm ${cadre}`} data-installer-aide={etat}>
      <p className="flex items-center gap-2 font-semibold"><Download className="size-5" aria-hidden /> Installer l&apos;application</p>
      {etat === "iphone" ? (
        <p className={`mt-1 ${petit}`}>
          Dans Safari, touchez <Share className="inline size-4 align-text-bottom" aria-label="Partager" /> <b>Partager</b>,
          puis <SquarePlus className="inline size-4 align-text-bottom" aria-hidden /> <b>Sur l&apos;écran d&apos;accueil</b>.
        </p>
      ) : (
        <p className={`mt-1 ${petit}`}>
          Ouvrez le menu du navigateur (<b>⋮</b> en haut à droite), puis choisissez <b>Installer l&apos;application</b> ou
          <b> Ajouter à l&apos;écran d&apos;accueil</b>.
        </p>
      )}
    </div>
  );
}
