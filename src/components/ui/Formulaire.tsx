"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export const classeChamp =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-marine-700 focus:ring-4 focus:ring-marine-700/10";

export function BoutonEnvoi({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-marine-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-marine-800 disabled:opacity-60 ${className}`}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function MessageFormulaire({ etat }: { etat?: { erreur?: string; succes?: string } }) {
  if (!etat?.erreur && !etat?.succes) return null;
  return (
    <p
      role={etat.erreur ? "alert" : "status"}
      className={`rounded-xl p-3 text-sm ${etat.erreur ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
    >
      {etat.erreur ?? etat.succes}
    </p>
  );
}
