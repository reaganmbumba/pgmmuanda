"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { ChampsCiblage } from "@/components/programmes/ChampsCiblage";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import type { Organisation } from "@/lib/membres/depot";
import { TYPES_ANNONCE } from "@/lib/programmes/libelles";
import { publierAnnonce } from "./actions";

export function FormulaireAnnonce({ organisation, portees }: { organisation: Organisation; portees: (string | null)[] }) {
  const [etat, action] = useActionState(publierAnnonce, undefined);
  return (
    <form action={action} className="space-y-6">
      <fieldset className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:grid-cols-3">
        <legend className="px-1 text-sm font-semibold text-marine-900">Annonce</legend>
        <label className="block text-sm font-medium text-marine-900 md:col-span-2">
          Titre *
          <input name="titre" required maxLength={150} className={classeChamp} />
        </label>
        <label className="block text-sm font-medium text-marine-900">
          Type
          <select name="type" defaultValue="communique" className={classeChamp}>
            {Object.entries(TYPES_ANNONCE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-marine-900 md:col-span-3">
          Texte *
          <textarea name="contenu" required rows={6} maxLength={5000} className={classeChamp} />
        </label>
      </fieldset>
      <ChampsCiblage organisation={organisation} portees={portees} />
      <p className="text-sm text-slate-500">
        Les membres concernés qui ont un compte reçoivent une notification dans l&apos;application.
        Pour WhatsApp, utilisez ensuite le bouton « Partager sur WhatsApp » : vous choisissez le groupe et envoyez vous-même.
      </p>
      <MessageFormulaire etat={etat} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/staff/communication"
          className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-marine-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
          Annuler
        </Link>
        <BoutonEnvoi className="sm:w-auto"><Send className="size-4" aria-hidden /> Publier l&apos;annonce</BoutonEnvoi>
      </div>
    </form>
  );
}
