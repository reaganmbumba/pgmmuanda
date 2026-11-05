/* eslint-disable @next/next/no-img-element -- petites images fixes d'exemple */
import { Check } from "lucide-react";

/* Exemples de bonnes photos montrés avant d'ajouter la photo d'inscription (photos fournies par la PGM). */
const exemples = [
  { src: "/exemples-photo/homme-1.jpg", alt: "Bon exemple : homme de face, fond blanc" },
  { src: "/exemples-photo/homme-2.jpg", alt: "Bon exemple : homme de face, fond blanc" },
  { src: "/exemples-photo/femme-1.jpg", alt: "Bon exemple : femme de face avec foulard, fond clair" },
];

const consignes = ["Visage de face, bien visible", "Fond clair (mur blanc)", "Sans lunettes ni chapeau"];

export function ExemplesPhoto() {
  return (
    <div className="w-full rounded-2xl bg-white p-3 ring-1 ring-slate-200" data-exemples-photo>
      <p className="text-sm font-semibold text-marine-900">Exemples de bonne photo</p>
      <div className="mx-auto mt-2 grid max-w-60 grid-cols-3 gap-2">
          {exemples.map((e) => (
            <figure key={e.src} className="text-center">
              <div className="aspect-[4/5] overflow-hidden rounded-lg ring-2 ring-emerald-500">
                <img src={e.src} alt={e.alt} className="h-full w-full object-cover" />
              </div>
              <figcaption className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                <Check className="mr-0.5 inline size-3 align-[-1px]" aria-hidden />Bien
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
