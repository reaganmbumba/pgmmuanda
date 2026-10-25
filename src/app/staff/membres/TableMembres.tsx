"use client";

import { useMemo, useState } from "react";
import { Archive, Download, Pencil, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import type { Membre } from "@/lib/types";

const champ =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-marine-700";

export function TableMembres({
  membres,
  paroisses,
}: {
  membres: Membre[];
  paroisses: string[];
}) {
  const [q, setQ] = useState("");
  const [paroisse, setParoisse] = useState("");
  const [voix, setVoix] = useState("");
  const [statut, setStatut] = useState("");

  const resultats = useMemo(() => {
    const t = q.trim().toLowerCase();
    return membres.filter(
      (m) =>
        (!t ||
          `${m.prenom} ${m.nom} ${m.postnom} ${m.matricule} ${m.telephone}`
            .toLowerCase()
            .includes(t)) &&
        (!paroisse || m.paroisse === paroisse) &&
        (!voix || m.voix === voix) &&
        (!statut || m.statut === statut),
    );
  }, [membres, q, paroisse, voix, statut]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Rechercher</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Nom, matricule ou téléphone"
            className={`${champ} w-full pl-9`}
          />
        </label>
        <div className="grid grid-cols-3 gap-2 lg:flex">
          <select aria-label="Paroisse" value={paroisse} onChange={(e) => setParoisse(e.target.value)} className={champ}>
            <option value="">Toutes les paroisses</option>
            {paroisses.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select aria-label="Voix" value={voix} onChange={(e) => setVoix(e.target.value)} className={champ}>
            <option value="">Toutes les voix</option>
            {["Soprano", "Alto", "Ténor", "Basse"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select aria-label="Statut" value={statut} onChange={(e) => setStatut(e.target.value)} className={champ}>
            <option value="">Tous les statuts</option>
            {["En attente", "Actif", "Inactif", "Suspendu"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-marine-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
          <Download className="size-4" aria-hidden /> Exporter
        </button>
      </div>

      {/* Tableau sur ordinateur */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Membre</th>
              <th className="px-4 py-3 font-medium">Matricule</th>
              <th className="px-4 py-3 font-medium">Paroisse</th>
              <th className="px-4 py-3 font-medium">Voix</th>
              <th className="px-4 py-3 font-medium">Adhésion</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resultats.map((m) => (
              <tr key={m.matricule} className="hover:bg-marine-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar membre={m} taille="sm" />
                    <div>
                      <p className="font-medium text-marine-900">
                        {m.prenom} {m.nom} {m.postnom}
                      </p>
                      <p className="text-xs text-slate-500">{m.fonction}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-marine-800">{m.matricule}</td>
                <td className="px-4 py-3 text-slate-600">{m.paroisse}</td>
                <td className="px-4 py-3 text-slate-600">{m.voix}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(m.dateAdhesion)}</td>
                <td className="px-4 py-3"><Badge>{m.statut}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-marine-900" aria-label={`Modifier ${m.prenom} ${m.nom}`}>
                      <Pencil className="size-4" />
                    </button>
                    <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-marine-900" aria-label={`Archiver ${m.prenom} ${m.nom}`}>
                      <Archive className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartes sur téléphone */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {resultats.map((m) => (
          <li key={m.matricule} className="flex items-center gap-3 p-4">
            <Avatar membre={m} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-marine-900">
                {m.prenom} {m.nom} {m.postnom}
              </p>
              <p className="font-mono text-xs text-marine-700">{m.matricule}</p>
              <p className="text-xs text-slate-500">{m.paroisse} · {m.voix}</p>
            </div>
            <Badge>{m.statut}</Badge>
          </li>
        ))}
      </ul>

      {resultats.length === 0 && (
        <p className="p-8 text-center text-sm text-slate-500">
          Aucun membre ne correspond à ces critères.
        </p>
      )}
      <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        {resultats.length} membre{resultats.length > 1 ? "s" : ""} sur {membres.length}
      </p>
    </div>
  );
}
