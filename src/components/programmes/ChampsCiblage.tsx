"use client";

import { useState } from "react";
import { classeChamp } from "@/components/ui/Formulaire";
import { VOIX } from "@/lib/membres/libelles";
import type { Organisation } from "@/lib/membres/depot";
import type { Ciblage } from "@/lib/programmes/libelles";

function Case({ nom, valeur, libelle, coche }: { nom: string; valeur: string; libelle: string; coche: boolean }) {
  return (
    <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
      <input type="checkbox" name={nom} value={valeur} defaultChecked={coche} className="size-4 accent-marine-900" />
      {libelle}
    </label>
  );
}

/**
 * Portée (toute la PGM ou une paroisse) et cibles d'une activité ou d'une annonce.
 * `portees` : les portées autorisées pour l'utilisateur (null = toute la PGM).
 */
export function ChampsCiblage({ organisation, portees, valeur }: {
  organisation: Organisation;
  portees: (string | null)[];
  valeur?: Ciblage;
}) {
  const [portee, setPortee] = useState<string>(valeur?.portee ?? (portees[0] ?? ""));
  const [tous, setTous] = useState(valeur?.pourTous ?? true);
  const chorales = organisation.chorales.filter((c) => !portee || c.paroisseId === portee);
  const nomParoisse = (id: string | null) => (id ? organisation.paroisses.find((p) => p.id === id)?.nom ?? "" : "Urbain");

  return (
    <fieldset className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <legend className="px-1 text-sm font-semibold text-marine-900">Qui est concerné ?</legend>
      <label className="block text-sm font-medium text-marine-900">
        Portée
        <select name="portee" value={portee} onChange={(e) => setPortee(e.target.value)} className={classeChamp}
          disabled={portees.length === 1}>
          {portees.map((p) => <option key={p ?? "pgm"} value={p ?? ""}>{p ? nomParoisse(p) : "Toute la PGM"}</option>)}
        </select>
        {portees.length === 1 && <input type="hidden" name="portee" value={portee} />}
      </label>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="ciblage" value="tous" checked={tous} onChange={() => setTous(true)} className="accent-marine-900" />
          Tous les membres {portee ? "de la paroisse" : "de la PGM"}
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="ciblage" value="cibles" checked={!tous} onChange={() => setTous(false)} className="accent-marine-900" />
          Seulement certains groupes
        </label>
      </div>

      {!tous && (
        <div key={portee} className="grid gap-4 md:grid-cols-3">
          {!portee && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paroisses</p>
              {organisation.paroisses.map((p) => (
                <Case key={p.id} nom="cibleParoisses" valeur={p.id} libelle={p.nom} coche={!!valeur?.paroisses.includes(p.id)} />
              ))}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chorales</p>
            {chorales.length === 0 && <p className="px-2 py-1.5 text-sm text-slate-400">Aucune chorale.</p>}
            {chorales.map((c) => (
              <Case key={c.id} nom="cibleChorales" valeur={c.id}
                libelle={portee ? c.nom : `${c.nom} (${nomParoisse(c.paroisseId)})`} coche={!!valeur?.chorales.includes(c.id)} />
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Voix</p>
            {Object.entries(VOIX).map(([k, v]) => (
              <Case key={k} nom="cibleVoix" valeur={k} libelle={v} coche={!!valeur?.voix.includes(k as keyof typeof VOIX)} />
            ))}
          </div>
          <p className="text-xs text-slate-500 md:col-span-3">
            Un membre est concerné s&apos;il fait partie d&apos;au moins un des groupes cochés.
          </p>
        </div>
      )}
    </fieldset>
  );
}
