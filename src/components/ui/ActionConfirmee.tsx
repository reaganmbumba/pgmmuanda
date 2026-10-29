"use client";

import { useActionState, useState } from "react";
import { useLectureSeule } from "@/components/LectureSeule";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type Etat = { erreur?: string; succes?: string } | undefined;

function Valider({ libelle, danger }: { libelle: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-marine-900 hover:bg-marine-800"}`}>
      {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {libelle}
    </button>
  );
}

/**
 * Bouton d'action sensible : un premier clic demande confirmation,
 * le second envoie le formulaire au serveur.
 * `masquer` cache le bouton sans démonter le composant, pour garder
 * le message de résultat visible quand l'action ne s'applique plus.
 */
export function ActionConfirmee({
  action, champs, libelle, question, danger, icone, masquer, choix, className = "",
}: {
  action: (etat: Etat, form: FormData) => Promise<Etat>;
  champs: Record<string, string>;
  libelle: string;
  question: string;
  danger?: boolean;
  icone?: React.ReactNode;
  masquer?: boolean;
  /** Liste déroulante à remplir avant de confirmer (ex. motif d'une révocation). */
  choix?: { nom: string; libelle: string; options: string[] };
  className?: string;
}) {
  const [etat, envoyer] = useActionState(action, undefined);
  const [ouvert, setOuvert] = useState(false);
  if (useLectureSeule()) return null;
  return (
    <div className={className}>
      {masquer ? null : !ouvert ? (
        <button type="button" onClick={() => setOuvert(true)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset ${danger ? "text-red-700 ring-red-200 hover:bg-red-50" : "text-marine-800 ring-slate-300 hover:bg-slate-50"}`}>
          {icone}{libelle}
        </button>
      ) : (
        <form action={(f) => { setOuvert(false); envoyer(f); }} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2">
          {Object.entries(champs).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <span className="text-xs text-slate-700">{question}</span>
          {choix && (
            <select name={choix.nom} aria-label={choix.libelle} defaultValue={choix.options[0]}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs">
              {choix.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          )}
          <Valider libelle="Confirmer" danger={danger} />
          <button type="button" onClick={() => setOuvert(false)} className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100">Annuler</button>
        </form>
      )}
      {etat?.erreur && <p role="alert" className="mt-1 text-xs text-red-700">{etat.erreur}</p>}
      {etat?.succes && <p role="status" className="mt-1 text-xs text-emerald-700">{etat.succes}</p>}
    </div>
  );
}
