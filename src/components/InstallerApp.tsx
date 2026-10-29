"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus } from "lucide-react";

type InvitationInstallation = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type Etat = "cache" | "bouton" | "iphone" | "menu" | "ordinateur";

/** Enregistre le service worker (nécessaire pour que le navigateur propose l'installation). */
export function EnregistrerApp() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

declare global {
  interface Window { __invitationPGM?: InvitationInstallation | null }
}

/**
 * « Installer l'application » : une icône PGM Muanda sur l'écran d'accueil du téléphone
 * ou sur le bureau de l'ordinateur. Caché quand l'application est déjà installée.
 * Le bouton marche toujours : il ouvre la fenêtre d'installation du navigateur quand
 * celui-ci la propose, sinon il montre comment faire, étape par étape.
 */
export function InstallerApp({ clair = false, discret = false }: { clair?: boolean; /** Seulement le bouton, sans explications. */ discret?: boolean }) {
  const [etat, setEtat] = useState<Etat>("cache");
  const [invitation, setInvitation] = useState<InvitationInstallation | null>(null);
  const [aide, setAide] = useState(false);

  useEffect(() => {
    const installee = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (installee) return;
    const iphone = /iphone|ipad|ipod/i.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const prendre = () => {
      if (window.__invitationPGM) {
        setInvitation(window.__invitationPGM);
        setEtat("bouton");
      }
    };
    prendre();
    const telephone = /android|mobile/i.test(navigator.userAgent);
    const attente = setTimeout(() => setEtat((e) => (e === "cache" ? (iphone ? "iphone" : telephone ? "menu" : "ordinateur") : e)), 800);
    const surInstallee = () => { window.__invitationPGM = null; setEtat("cache"); };
    window.addEventListener("pgm-installable", prendre);
    window.addEventListener("appinstalled", surInstallee);
    return () => {
      clearTimeout(attente);
      window.removeEventListener("pgm-installable", prendre);
      window.removeEventListener("appinstalled", surInstallee);
    };
  }, []);

  if (etat === "cache" || (discret && etat !== "bouton")) return null;
  const petit = clair ? "text-white/80" : "text-slate-700";

  return (
    <div className="space-y-2">
      <button type="button" data-installer={etat}
        onClick={async () => {
          if (!invitation) { setAide((a) => !a); return; }
          await invitation.prompt();
          const { outcome } = await invitation.userChoice;
          window.__invitationPGM = null;
          if (outcome === "accepted") setEtat("cache");
        }}
        className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-or-500 px-4 py-3 text-left font-semibold text-marine-950 shadow-sm hover:bg-or-400">
        <Download className="size-6 shrink-0" aria-hidden />
        <span>
          Installer l&apos;application
          <span className="block text-xs font-normal text-marine-900/80">Une icône PGM Muanda sur votre téléphone ou votre ordinateur</span>
        </span>
      </button>
      {aide && (
        <ol className={`list-decimal space-y-1 rounded-2xl p-4 pl-8 text-sm ${clair ? "bg-white/5" : "bg-white ring-1 ring-slate-200"} ${petit}`} data-installer-aide={etat}>
          {etat === "iphone" ? (<>
            <li>Ouvrez ce site dans <b>Safari</b>.</li>
            <li>Touchez <Share className="inline size-4 align-text-bottom" aria-label="Partager" /> <b>Partager</b> (en bas de l&apos;écran).</li>
            <li>Touchez <SquarePlus className="inline size-4 align-text-bottom" aria-hidden /> <b>Sur l&apos;écran d&apos;accueil</b>, puis <b>Ajouter</b>.</li>
          </>) : etat === "menu" ? (<>
            <li>Ouvrez ce site dans <b>Chrome</b>.</li>
            <li>Touchez le menu <b>⋮</b> en haut à droite.</li>
            <li>Touchez <b>Installer l&apos;application</b> ou <b>Ajouter à l&apos;écran d&apos;accueil</b>, puis <b>Installer</b>.</li>
          </>) : (<>
            <li>Ouvrez ce site dans <b>Chrome</b> ou <b>Edge</b>.</li>
            <li>Cliquez sur l&apos;icône <b>Installer</b> <Download className="inline size-4 align-text-bottom" aria-hidden /> à droite de la barre d&apos;adresse,
              ou ouvrez le menu <b>⋮</b> puis <b>Caster, enregistrer et partager</b> → <b>Installer la page en tant qu&apos;application</b>.</li>
            <li>Cliquez sur <b>Installer</b> : l&apos;icône apparaît sur le bureau.</li>
          </>)}
        </ol>
      )}
    </div>
  );
}
