import { QRCodeSVG } from "qrcode.react";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/format";
import type { Membre } from "@/lib/types";

/** Carte de choriste au format portefeuille (ratio ISO 7810 ID-1 : 85,6 × 54 mm). */
export function CarteMembre({ membre }: { membre: Membre }) {
  const revoquee = membre.carte.statut !== "Active";
  // Le QR ne contient qu'un lien de vérification, jamais de données personnelles.
  const lien = `https://pgm-muanda.example/verifier/${membre.carte.reference}`;
  return (
    <div className="relative aspect-[85.6/54] w-full max-w-md overflow-hidden rounded-2xl bg-marine-900 text-white shadow-xl ring-1 ring-marine-950/40 @container">
      <div className="absolute -right-16 -top-16 size-48 rounded-full border-[10px] border-or-500/20" />
      <div className="absolute inset-x-0 bottom-0 h-1.5 or-degrade" />
      <div className="relative flex h-full flex-col p-[5cqw]">
        <div className="flex items-center justify-between">
          <Logo size={30} avecTexte clair />
          <span
            className={`rounded-full px-2 py-0.5 text-[2.6cqw] font-semibold uppercase tracking-wide ${
              revoquee ? "bg-red-500/90 text-white" : "bg-emerald-400/90 text-marine-950"
            }`}
          >
            {revoquee ? "Révoquée" : "Valide"}
          </span>
        </div>
        <div className="mt-auto flex items-end gap-[4cqw]">
          <div className="rounded-xl bg-white/10 p-1">
            <Avatar membre={membre} taille="lg" />
          </div>
          <div className="min-w-0 flex-1 space-y-[0.6cqw]">
            <p className="truncate text-[4.4cqw] font-bold leading-tight">
              {membre.prenom} {membre.nom}
            </p>
            <p className="truncate text-[3cqw] text-marine-100/80">{membre.postnom}</p>
            <p className="font-mono text-[3.4cqw] font-semibold tracking-wider text-or-400">
              {membre.matricule}
            </p>
            <p className="truncate text-[2.8cqw] text-marine-100/80">
              {membre.fonction} · Paroisse {membre.paroisse}
            </p>
            <p className="text-[2.4cqw] text-marine-100/60">
              Émise le {formatDate(membre.carte.dateEmission)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-[1.4cqw]">
            <QRCodeSVG value={lien} size={256} className="size-[20cqw]" level="M" />
          </div>
        </div>
      </div>
    </div>
  );
}
