"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import { reinitialiserMotDePasse } from "../actions";

export function FormulaireReinit() {
  const [etat, action] = useActionState(reinitialiserMotDePasse, undefined);
  if (etat?.succes)
    return (
      <div className="mt-8 space-y-4">
        <MessageFormulaire etat={etat} />
        <Link href="/" className="block text-center text-sm font-semibold text-marine-700">Continuer</Link>
      </div>
    );
  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label htmlFor="motDePasse" className="text-sm font-medium text-slate-700">Nouveau mot de passe</label>
        <input id="motDePasse" name="motDePasse" type="password" autoComplete="new-password" required minLength={10} className={classeChamp} />
        <p className="mt-1 text-xs text-slate-500">Au moins 10 caractères, avec des lettres et des chiffres.</p>
      </div>
      <div>
        <label htmlFor="confirmation" className="text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
        <input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required className={classeChamp} />
      </div>
      <BoutonEnvoi>Enregistrer</BoutonEnvoi>
      <MessageFormulaire etat={etat} />
    </form>
  );
}
