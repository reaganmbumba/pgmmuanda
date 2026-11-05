/* eslint-disable @next/next/no-img-element -- petites images fixes d'exemple */
import { Check, X } from "lucide-react";

/* Exemples montrés avant d'ajouter la photo d'inscription (photos fournies par la PGM). */
const exemples = [
  { src: "/exemples-photo/homme-1.jpg", alt: "Bon exemple : homme de face, fond blanc", bon: true },
  { src: "/exemples-photo/homme-2.jpg", alt: "Bon exemple : homme de face, fond blanc", bon: true },
  { src: "/exemples-photo/femme-1.jpg", alt: "Bon exemple : femme de face avec foulard, fond clair", bon: true },
  { src: "/exemples-photo/mauvais-1.jpg", alt: "Mauvais exemple : photo de loin, avec lunettes, fond sombre", bon: false },
];

const consignes = ["Visage de face, de près, bien visible", "Fond clair (mur blanc)", "Sans lunettes ni chapeau"];

export function ExemplesPhoto() {
  return (
    <div className="w-full rounded-2xl bg-white p-3 ring-1 ring-slate-200" data-exemples-photo>
      <p className="text-sm font-semibold text-marine-900">Exemples de photo</p>
      <div className="mx-auto mt-2 grid max-w-80 grid-cols-4 gap-2">
        {exemples.map((e) => (
          <figure key={e.src} className="text-center">
            <div className={`relative aspect-[4/5] overflow-hidden rounded-lg ring-2 ${e.bon ? "ring-emerald-500" : "ring-red-600"}`}>
              <img src={e.src} alt={e.alt} className="h-full w-full object-cover" />
              {!e.bon && (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                  <path d="M16 16L84 84M84 16L16 84" stroke="#fff" strokeWidth="11" strokeLinecap="round" />
                  <path d="M16 16L84 84M84 16L16 84" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <figcaption className={`mt-0.5 text-[11px] font-semibold ${e.bon ? "text-emerald-700" : "text-red-700"}`}>
              {e.bon ? <Check className="mr-0.5 inline size-3 align-[-1px]" aria-hidden /> : <X className="mr-0.5 inline size-3 align-[-1px]" aria-hidden />}
              {e.bon ? "Bien" : "Non"}
            </figcaption>
          </figure>
        ))}
      </div>
      <ul className="mt-2 space-y-0.5 text-sm text-slate-700">
        {consignes.map((c) => (
          <li key={c} className="flex items-start gap-1.5"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />{c}</li>
        ))}
      </ul>
    </div>
  );
}
