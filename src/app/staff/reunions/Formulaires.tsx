"use client";

import { useState } from "react";
import { Megaphone, Save } from "lucide-react";
import { Champ } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import { FormulaireRapide } from "@/components/ui/FormulaireRapide";
import { DELAI_AG_JOURS, estAssemblee, STATUTS_REUNION, TYPES_REUNION, type CodeStatutReunion, type CodeTypeReunion } from "@/lib/conseil/libelles";
import { STATUTS_PRESENCE } from "@/lib/programmes/libelles";
import { convoquerReunion, enregistrerCompteRendu, enregistrerPresencesReunion } from "./actions";

export function FormulaireConvocation({ minAg }: { minAg: string }) {
  const [type, setType] = useState<CodeTypeReunion>("conseil");
  return (
    <FormulaireRapide action={convoquerReunion} libelle="Convoquer" icone={<Megaphone className="size-4" aria-hidden />}>
      <Champ libelle="Type de réunion *">
        <select name="type" value={type} onChange={(e) => setType(e.target.value as CodeTypeReunion)} className={classeChamp}>
          {Object.entries(TYPES_REUNION).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Champ>
      <Champ libelle="Titre *"><input name="titre" required maxLength={150} className={classeChamp} placeholder="Ex. Réunion ordinaire du Conseil" /></Champ>
      <Champ libelle="Date et heure *" aide={estAssemblee(type) ? `Art. 21 : au moins ${DELAI_AG_JOURS} jours à l'avance.` : undefined}>
        <input key={type} type="datetime-local" name="debut" required min={estAssemblee(type) ? minAg : undefined} className={classeChamp} />
      </Champ>
      <Champ libelle="Lieu" aide="Fixé par le Président ou son bureau (art. 22).">
        <input name="lieu" maxLength={150} className={classeChamp} />
      </Champ>
      <Champ libelle="Ordre du jour *" aide="Obligatoire. Seuls ces points pourront être décidés, et il ne se change plus après la convocation (art. 21)." className="sm:col-span-2">
        <textarea name="ordreDuJour" required rows={5} maxLength={4000} className={classeChamp} placeholder={"1. …\n2. …\n3. Divers"} />
      </Champ>
    </FormulaireRapide>
  );
}

export function FormulaireCompteRendu({ id, statut, compteRendu, passee }: {
  id: string; statut: CodeStatutReunion; compteRendu: string; passee: boolean;
}) {
  return (
    <FormulaireRapide action={enregistrerCompteRendu} champs={{ id }} libelle="Enregistrer" icone={<Save className="size-4" aria-hidden />} garder grille={false}>
      <Champ libelle="La réunion">
        <select name="statut" defaultValue={statut} className={classeChamp}>
          {Object.entries(STATUTS_REUNION).filter(([v]) => passee || v !== "tenue")
            .map(([v, l]) => <option key={v} value={v}>{l === "Tenue" ? "A eu lieu" : l === "Convoquée" ? "Prévue (convoquée)" : l}</option>)}
        </select>
      </Champ>
      <Champ libelle="Compte rendu" aide="Signé par le Président et le Secrétaire (art. 23).">
        <textarea name="compteRendu" defaultValue={compteRendu} rows={8} maxLength={20000} className={classeChamp} />
      </Champ>
    </FormulaireRapide>
  );
}

export function FeuillePresence({ id, membres }: { id: string; membres: { membreId: string; nom: string; fonction: string; statut: string | null }[] }) {
  return (
    <FormulaireRapide action={enregistrerPresencesReunion} champs={{ id }} libelle="Enregistrer la feuille de présence"
      icone={<Save className="size-4" aria-hidden />} garder grille={false}>
      <ul className="divide-y divide-slate-100">
        {membres.map((m) => (
          <li key={m.membreId} className="flex flex-wrap items-center justify-between gap-2 py-2" data-presence-conseil={m.nom}>
            <div className="min-w-0">
              <p className="text-sm font-medium text-marine-900">{m.nom}</p>
              <p className="text-xs text-slate-500">{m.fonction}</p>
            </div>
            <div className="inline-flex rounded-xl bg-slate-50 p-1 ring-1 ring-slate-200">
              {Object.entries(STATUTS_PRESENCE).map(([v, l]) => (
                <label key={v} className="cursor-pointer rounded-lg px-3 py-1.5 text-sm has-[:checked]:bg-marine-900 has-[:checked]:text-white">
                  <input type="radio" name={`p_${m.membreId}`} value={v} defaultChecked={m.statut === v} className="sr-only" /> {l}
                </label>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </FormulaireRapide>
  );
}
