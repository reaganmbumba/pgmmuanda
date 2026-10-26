"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import type { Etat } from "@/lib/etat-action";

function Envoyer({ libelle }: { libelle: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-marine-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-60">
      {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}{libelle}
    </button>
  );
}

/** Petit bouton qui agit tout de suite (action sans risque, sans confirmation). */
export function ActionDirecte({ action, champs, libelle }: {
  action: (etat: Etat, form: FormData) => Promise<Etat>; champs: Record<string, string>; libelle: string;
}) {
  const [etat, envoyer] = useActionState(action, undefined);
  return (
    <form action={envoyer} className="inline-block">
      {Object.entries(champs).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <Envoyer libelle={libelle} />
      {etat?.erreur && <p role="alert" className="mt-1 text-xs text-red-700">{etat.erreur}</p>}
    </form>
  );
}
