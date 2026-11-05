"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

/** Copier le rapport, ou l'ouvrir directement dans WhatsApp. */
export function CopierRapport({ texte }: { texte: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button type="button"
        onClick={async () => {
          try { await navigator.clipboard.writeText(texte); setCopie(true); setTimeout(() => setCopie(false), 2500); } catch { /* copie impossible */ }
        }}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-marine-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-marine-800">
        {copie ? <Check className="size-5" aria-hidden /> : <Copy className="size-5" aria-hidden />}
        {copie ? "Rapport copié" : "Copier le rapport"}
      </button>
      <a href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
        <MessageCircle className="size-5" aria-hidden /> Envoyer sur WhatsApp
      </a>
    </div>
  );
}
