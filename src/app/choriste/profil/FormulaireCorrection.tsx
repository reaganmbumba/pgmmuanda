"use client";

import { useActionState, useState } from "react";
import { PencilLine, Send } from "lucide-react";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import { CHAMPS_CORRIGEABLES, VOIX } from "@/lib/membres/libelles";
import { demanderCorrection } from "./actions";

export function FormulaireCorrection() {
  const [etat, action] = useActionState(demanderCorrection, undefined);
  const [ouvert, setOuvert] = useState(false);
  const [champ, setChamp] = useState("");

  if (!ouvert && !etat?.succes) {
    return (
      <button type="button" onClick={() => setOuvert(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-marine-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
        <PencilLine className="size-4" aria-hidden /> Demander une correction
      </button>
    );
  }
  return (
    <form action={action} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <p className="font-semibold text-marine-900">Demander une correction</p>
      <label className="block text-sm font-medium text-marine-900">
        Information à corriger
        <select name="champ" required value={champ} onChange={(e) => setChamp(e.target.value)} className={classeChamp}>
          <option value="">Choisir…</option>
          {Object.entries(CHAMPS_CORRIGEABLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium text-marine-900">
        Valeur correcte
        {champ === "voix" ? (
          <select name="valeur" required className={classeChamp}>
            <option value="">Choisir…</option>
            {Object.entries(VOIX).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        ) : (
          <input name="valeur" required maxLength={500} type={champ === "email" ? "email" : champ === "telephone" ? "tel" : "text"} className={classeChamp} />
        )}
      </label>
      <label className="block text-sm font-medium text-marine-900">
        Motif (facultatif)
        <textarea name="motif" maxLength={500} rows={2} className={classeChamp} />
      </label>
      <MessageFormulaire etat={etat} />
      <BoutonEnvoi><Send className="size-4" aria-hidden /> Envoyer la demande</BoutonEnvoi>
    </form>
  );
}
