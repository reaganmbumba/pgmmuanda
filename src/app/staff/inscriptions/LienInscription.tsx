"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

/** Le lien à envoyer : copier, ou ouvrir WhatsApp avec un message prêt. */
export function LienInscription({ lien }: { lien: string }) {
  const [copie, setCopie] = useState(false);
  const message = `Paix ! Pour vous inscrire à la PGM Antenne de Muanda, ouvrez ce lien et remplissez vos informations avec votre photo :\n${lien}`;
  return (
    <div className="space-y-3">
      <p className="break-all rounded-xl bg-marine-50 px-3.5 py-3 font-mono text-sm text-marine-900">{lien}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
          <MessageCircle className="size-5" aria-hidden /> Envoyer sur WhatsApp
        </a>
        <button type="button"
          onClick={async () => {
            try { await navigator.clipboard.writeText(lien); setCopie(true); setTimeout(() => setCopie(false), 2500); } catch { /* copie impossible */ }
          }}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-marine-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
          {copie ? <Check className="size-5 text-emerald-600" aria-hidden /> : <Copy className="size-5" aria-hidden />}
          {copie ? "Lien copié" : "Copier le lien"}
        </button>
      </div>
    </div>
  );
}
