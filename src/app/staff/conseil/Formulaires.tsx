"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { Champ } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import { FormulaireRapide } from "@/components/ui/FormulaireRapide";
import { aUnAdjoint, finMandat, FONCTIONS_CONSEIL, type CodeFonction } from "@/lib/conseil/libelles";
import { formatDate } from "@/lib/format";
import { nommerAuConseil, terminerMandat } from "./actions";

export function FormulaireMandat({ membres, aujourdhui }: { membres: { id: string; nom: string }[]; aujourdhui: string }) {
  const [fonction, setFonction] = useState<CodeFonction>("president");
  const [debut, setDebut] = useState(aujourdhui);
  return (
    <FormulaireRapide action={nommerAuConseil} libelle="Nommer au Conseil" icone={<UserPlus className="size-4" aria-hidden />}>
      <Champ libelle="Membre *" className="sm:col-span-2">
        <select name="membreId" required defaultValue="" className={classeChamp}>
          <option value="" disabled>Choisir un membre</option>
          {membres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </select>
      </Champ>
      <Champ libelle="Fonction (art. 28) *">
        <select name="fonction" value={fonction} onChange={(e) => setFonction(e.target.value as CodeFonction)} className={classeChamp}>
          {Object.entries(FONCTIONS_CONSEIL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Champ>
      <Champ libelle="Début du mandat *" aide={/^\d{4}-\d{2}-\d{2}$/.test(debut) ? `Fin : ${formatDate(finMandat(debut))} (4 ans, art. 29)` : undefined}>
        <input type="date" name="debut" required value={debut} onChange={(e) => setDebut(e.target.value)} className={classeChamp} />
      </Champ>
      {aUnAdjoint(fonction) && (
        <label className="flex min-h-11 items-center gap-3 text-sm text-marine-900 sm:col-span-2">
          <input type="checkbox" name="adjoint" className="size-5 accent-marine-900" /> C&apos;est l&apos;adjoint (et non le titulaire)
        </label>
      )}
    </FormulaireRapide>
  );
}

export function TerminerMandat({ id, nom }: { id: string; nom: string }) {
  return <ActionConfirmee action={terminerMandat} champs={{ id }} danger libelle="Fin du mandat"
    question={`Terminer aujourd'hui le mandat de ${nom} ?`} />;
}
