"use client";

import { useActionState } from "react";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import { motDePasseOublie } from "../actions";

export function FormulaireOubli() {
  const [etat, action] = useActionState(motDePasseOublie, undefined);
  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-slate-700">Adresse e-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={classeChamp} />
      </div>
      <BoutonEnvoi>Envoyer le lien</BoutonEnvoi>
      <MessageFormulaire etat={etat} />
    </form>
  );
}
