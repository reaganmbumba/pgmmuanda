/* eslint-disable @next/next/no-img-element -- petites images fixes d'exemple */
import { Check, X } from "lucide-react";

/* Exemples montrés avant d'ajouter la photo d'inscription.
   Les hommes : vraies photos fournies par la PGM. Les femmes : dessins neutres (pas de photo d'une inconnue). */

const PEAU = "#8a5a3c";

function Visage() {
  return (
    <>
      <rect x="51" y="84" width="18" height="20" fill={PEAU} />
      <ellipse cx="60" cy="66" rx="23" ry="28" fill={PEAU} />
      <path d="M47 58q5-3 10 0M63 58q5-3 10 0" stroke="#2a1a12" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="52" cy="65" rx="2.6" ry="2" fill="#1c120c" />
      <ellipse cx="68" cy="65" rx="2.6" ry="2" fill="#1c120c" />
      <path d="M58 70q2 6 4 0" stroke="#6b4129" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M53 81q7 3 14 0" stroke="#5a2e22" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  );
}

function FemmeCorrecte() {
  return (
    <svg viewBox="0 0 120 150" className="h-full w-full" role="img" aria-label="Dessin : femme de face, cheveux visibles, sans foulard">
      <rect width="120" height="150" fill="#f8fafc" />
      <path d="M14 150q4-40 46-44q42 4 46 44z" fill="#1e3a5f" />
      {/* Cheveux tirés en chignon */}
      <circle cx="60" cy="26" r="13" fill="#1f1410" />
      <ellipse cx="60" cy="58" rx="27" ry="30" fill="#1f1410" />
      <Visage />
      <path d="M37 60q2-24 23-26q21 2 23 26q-4-14-23-15q-19 1-23 15z" fill="#1f1410" />
    </svg>
  );
}

function FemmeFoulard() {
  return (
    <svg viewBox="0 0 120 150" className="h-full w-full" role="img" aria-label="Dessin : femme avec un foulard sur la tête, à ne pas faire">
      <rect width="120" height="150" fill="#f8fafc" />
      <path d="M14 150q4-40 46-44q42 4 46 44z" fill="#1e3a5f" />
      <Visage />
      {/* Foulard noué sur la tête */}
      <path d="M35 64q-6-40 25-42q31 2 25 42q-6-18-25-19q-19 1-25 19z" fill="#c2410c" />
      <path d="M38 50q22-14 44 0" stroke="#fdba74" strokeWidth="2" fill="none" strokeDasharray="3 4" />
      <ellipse cx="60" cy="20" rx="14" ry="8" fill="#ea580c" />
      <path d="M48 18q-12-10-6-14q6 4 12 10zM72 18q12-10 6-14q-6 4-12 10z" fill="#c2410c" />
    </svg>
  );
}

const exemples = [
  { bon: true, legende: "Bien", contenu: <img src="/exemples-photo/homme-1.jpg" alt="Bon exemple : homme de face, fond blanc" className="h-full w-full object-cover" /> },
  { bon: true, legende: "Bien", contenu: <img src="/exemples-photo/homme-2.jpg" alt="Bon exemple : homme de face, fond blanc" className="h-full w-full object-cover" /> },
  { bon: true, legende: "Bien", contenu: <FemmeCorrecte /> },
  { bon: false, legende: "Pas de foulard", contenu: <FemmeFoulard /> },
];

export function ExemplesPhoto() {
  return (
    <div className="w-full rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-exemples-photo>
      <p className="text-sm font-semibold text-marine-900">Exemples de photo</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {exemples.map((e, i) => (
          <figure key={i} className="text-center">
            <div className={`relative aspect-[4/5] overflow-hidden rounded-xl ring-2 ${e.bon ? "ring-emerald-500" : "ring-red-600"}`}>
              {e.contenu}
              {!e.bon && (
                <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none">
                  <path d="M16 16L84 84M84 16L16 84" stroke="#fff" strokeWidth="11" strokeLinecap="round" />
                  <path d="M16 16L84 84M84 16L16 84" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <figcaption className={`mt-1 text-[11px] font-semibold leading-tight ${e.bon ? "text-emerald-700" : "text-red-700"}`}>
              {e.bon ? <Check className="mr-0.5 inline size-3.5 align-[-2px]" aria-hidden /> : <X className="mr-0.5 inline size-3.5 align-[-2px]" aria-hidden />}
              {e.legende}
            </figcaption>
          </figure>
        ))}
      </div>
      <ul className="mt-3 space-y-1 text-sm text-slate-700">
        {["Visage de face, bien visible", "Fond clair (mur blanc)", "Sans lunettes ni chapeau", "Sans foulard sur la tête"].map((c) => (
          <li key={c} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />{c}</li>
        ))}
      </ul>
    </div>
  );
}
