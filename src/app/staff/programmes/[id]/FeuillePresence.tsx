"use client";

import { useActionState, useState } from "react";
import { useLectureSeule } from "@/components/LectureSeule";
import { Save } from "lucide-react";
import { BoutonEnvoi, MessageFormulaire } from "@/components/ui/Formulaire";
import { STATUTS_PRESENCE, type CodeStatutPresence } from "@/lib/programmes/libelles";
import { enregistrerPresences } from "../actions";

export type LignePresence = {
  id: string; matricule: string; nom: string; paroisse: string; voix: string;
  statut: CodeStatutPresence | ""; parQr: boolean;
};

const couleurs: Record<string, string> = {
  present: "bg-emerald-600 text-white", absent: "bg-red-600 text-white", excuse: "bg-amber-500 text-white",
};

export function FeuillePresence({ activite, lignes, lectureSeule: figee }: { activite: string; lignes: LignePresence[]; lectureSeule?: boolean }) {
  const [etat, action] = useActionState(enregistrerPresences, undefined);
  const compteLecture = useLectureSeule();
  const lectureSeule = figee || compteLecture;
  const [valeurs, setValeurs] = useState(() => Object.fromEntries(lignes.map((l) => [l.id, l.statut])));
  const nonSaisis = lignes.filter((l) => !valeurs[l.id]).length;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="activite" value={activite} />
      {!lectureSeule && nonSaisis > 0 && (
        <button type="button" className="text-sm font-medium text-marine-700 hover:underline"
          onClick={() => setValeurs((v) => Object.fromEntries(Object.entries(v).map(([k, s]) => [k, s || "absent"])))}>
          Marquer les {nonSaisis} non saisi{nonSaisis > 1 ? "s" : ""} comme absent{nonSaisis > 1 ? "s" : ""}
        </button>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="py-2 pr-3">Membre</th><th className="hidden py-2 pr-3 sm:table-cell">Paroisse</th><th className="py-2">Présence</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lignes.map((l) => (
              <tr key={l.id} data-membre={l.matricule}>
                <td className="py-2 pr-3">
                  <span className="font-medium text-marine-900">{l.nom}</span>
                  <span className="block font-mono text-xs text-slate-400">{l.matricule}{l.voix ? ` · ${l.voix}` : ""}</span>
                </td>
                <td className="hidden py-2 pr-3 text-slate-600 sm:table-cell">{l.paroisse}</td>
                <td className="py-2">
                  <input type="hidden" name={`o_${l.id}`} value={l.statut} />
                  <input type="hidden" name={`p_${l.id}`} value={valeurs[l.id]} />
                  <div className="inline-flex rounded-lg ring-1 ring-slate-200" role="radiogroup" aria-label={`Présence de ${l.nom}`}>
                    {(Object.keys(STATUTS_PRESENCE) as CodeStatutPresence[]).map((s) => (
                      <button key={s} type="button" role="radio" aria-checked={valeurs[l.id] === s} disabled={lectureSeule}
                        onClick={() => setValeurs((v) => ({ ...v, [l.id]: v[l.id] === s ? "" : s }))}
                        className={`px-2.5 py-1 text-xs font-medium first:rounded-l-lg last:rounded-r-lg ${valeurs[l.id] === s ? couleurs[s] : "text-slate-600 hover:bg-slate-50"}`}>
                        {STATUTS_PRESENCE[s]}
                      </button>
                    ))}
                  </div>
                  {l.parQr && valeurs[l.id] === "present" && <span className="ml-2 text-xs text-slate-400">par QR</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MessageFormulaire etat={etat} />
      {!lectureSeule && (
        <div className="flex justify-end">
          <BoutonEnvoi className="sm:w-auto"><Save className="size-4" aria-hidden /> Enregistrer la feuille de présence</BoutonEnvoi>
        </div>
      )}
    </form>
  );
}
