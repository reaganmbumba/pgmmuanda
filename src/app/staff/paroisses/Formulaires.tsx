"use client";

import { useActionState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useLectureSeule } from "@/components/LectureSeule";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import { ajouterChorale, ajouterParoisse, renommerOrganisation } from "./actions";

export function FormulaireParoisse() {
  const [etat, action] = useActionState(ajouterParoisse, undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-start">
      <input name="nom" required minLength={2} maxLength={120} placeholder="Nom de la paroisse" aria-label="Nom de la paroisse" className={classeChamp} />
      <input name="ville" required defaultValue="Muanda" aria-label="Ville" className={classeChamp} />
      <BoutonEnvoi className="mt-1.5 sm:w-auto"><Plus className="size-4" aria-hidden /> Ajouter</BoutonEnvoi>
      <div className="sm:col-span-3"><MessageFormulaire etat={etat} /></div>
    </form>
  );
}

export function FormulaireChorale({ paroisses, urbaine = false }: { paroisses: { id: string; nom: string }[]; urbaine?: boolean }) {
  const [etat, action] = useActionState(ajouterChorale, undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[14rem_1fr_auto] sm:items-start">
      <select name="paroisseId" required aria-label="Paroisse" defaultValue={paroisses.length === 1 ? paroisses[0].id : ""} className={classeChamp}>
        <option value="">Paroisse…</option>
        {paroisses.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
        {urbaine && <option value="urbaine">Urbain (toutes paroisses)</option>}
      </select>
      <input name="nom" required minLength={2} maxLength={120} placeholder="Nom de la chorale" aria-label="Nom de la chorale" className={classeChamp} />
      <BoutonEnvoi className="mt-1.5 sm:w-auto"><Plus className="size-4" aria-hidden /> Ajouter</BoutonEnvoi>
      <div className="sm:col-span-3"><MessageFormulaire etat={etat} /></div>
    </form>
  );
}

/** Petit formulaire « Corriger le nom », replié tant qu'on n'en a pas besoin. */
export function Renommer({ type, id, nom }: { type: "paroisse" | "chorale"; id: string; nom: string }) {
  const [etat, action] = useActionState(renommerOrganisation, undefined);
  if (useLectureSeule()) return null;
  return (
    <details className="text-xs">
      <summary className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 font-medium text-marine-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
        <Pencil className="size-3.5" aria-hidden /> Corriger le nom
      </summary>
      <form action={action} className="mt-2 flex flex-wrap items-start gap-2">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="id" value={id} />
        <input name="nom" required minLength={2} maxLength={120} defaultValue={nom} aria-label={`Nouveau nom de ${nom}`} className={`${classeChamp} min-w-48 flex-1`} />
        <BoutonEnvoi className="sm:w-auto">Enregistrer</BoutonEnvoi>
        <div className="w-full"><MessageFormulaire etat={etat} /></div>
      </form>
    </details>
  );
}
