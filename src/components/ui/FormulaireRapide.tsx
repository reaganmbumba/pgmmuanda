"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import type { Etat } from "@/lib/etat-action";
import { MessageFormulaire } from "./Formulaire";

/**
 * Formulaire envoyé au serveur sans quitter la page.
 * Les champs restent remplis en cas d'erreur et sont vidés après un succès.
 */
export function FormulaireRapide({ action, champs = {}, libelle, icone, children, className = "", grille = true, garder, sansBouton }: {
  action: (etat: Etat, form: FormData) => Promise<Etat>;
  champs?: Record<string, string>;
  libelle: string;
  icone?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Champs sur deux colonnes à partir de la tablette. */
  grille?: boolean;
  /** Ne pas vider les champs après succès (formulaire de modification). */
  garder?: boolean;
  /** Plus rien à envoyer : le bouton est masqué, mais le dernier message reste affiché. */
  sansBouton?: boolean;
}) {
  const [etat, envoyer, enCours] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (etat?.succes && !garder) ref.current?.reset();
  }, [etat, garder]);
  return (
    <form ref={ref} className={`space-y-4 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        startTransition(() => envoyer(f));
      }}>
      {Object.entries(champs).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <div className={grille ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>{children}</div>
      <MessageFormulaire etat={etat} />
      {!sansBouton && <button type="submit" disabled={enCours}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-marine-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-marine-800 disabled:opacity-60 sm:w-auto">
        {enCours ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icone}
        {libelle}
      </button>}
    </form>
  );
}

/** Bloc repliable « + Ajouter … » : l'écran reste simple tant qu'on n'en a pas besoin. */
export function Repliable({ titre, children, ouvert }: { titre: string; children: React.ReactNode; ouvert?: boolean }) {
  return (
    <details open={ouvert} className="group rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-5 py-3 font-semibold text-marine-900 marker:hidden">
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-or-100 text-lg leading-none text-or-600 transition group-open:rotate-45">+</span>
        {titre}
      </summary>
      <div className="border-t border-slate-100 p-5">{children}</div>
    </details>
  );
}
