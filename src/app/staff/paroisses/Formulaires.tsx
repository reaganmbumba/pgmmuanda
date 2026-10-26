"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import { ajouterChorale, ajouterParoisse } from "./actions";

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

export function FormulaireChorale({ paroisses }: { paroisses: { id: string; nom: string }[] }) {
  const [etat, action] = useActionState(ajouterChorale, undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[14rem_1fr_auto] sm:items-start">
      <select name="paroisseId" required aria-label="Paroisse" defaultValue={paroisses.length === 1 ? paroisses[0].id : ""} className={classeChamp}>
        <option value="">Paroisse…</option>
        {paroisses.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
      </select>
      <input name="nom" required minLength={2} maxLength={120} placeholder="Nom de la chorale" aria-label="Nom de la chorale" className={classeChamp} />
      <BoutonEnvoi className="mt-1.5 sm:w-auto"><Plus className="size-4" aria-hidden /> Ajouter</BoutonEnvoi>
      <div className="sm:col-span-3"><MessageFormulaire etat={etat} /></div>
    </form>
  );
}
