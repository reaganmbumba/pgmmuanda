import Link from "next/link";
import type { Sanction } from "@/lib/discipline/depot";
import { formatJour } from "@/lib/organisation/libelles";
import { AnnulerSanction } from "./Formulaires";

const COULEURS: Record<Sanction["typeCode"], string> = {
  avertissement: "bg-amber-100 text-amber-800",
  blame: "bg-orange-100 text-orange-800",
  suspension: "bg-red-100 text-red-800",
  exclusion: "bg-red-700 text-white",
};

/** Sanctions décidées (visibles seulement par l'administration). */
export function ListeSanctions({ sanctions, avecMembre }: { sanctions: Sanction[]; avecMembre?: boolean }) {
  return (
    <ul className="divide-y divide-slate-100">
      {sanctions.map((s) => (
        <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 py-3" data-sanction={s.typeCode}>
          <div className="min-w-0 text-sm">
            <p className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COULEURS[s.typeCode]}`}>{s.type}</span>
              {avecMembre && <Link href={`/staff/membres/${s.membreId}`} className="font-medium text-marine-900 hover:underline">{s.membre}</Link>}
            </p>
            <p className="mt-1 text-marine-900">{s.manquement}</p>
            {s.details && <p className="text-slate-600">« {s.details} »</p>}
            <p className="text-xs text-slate-500">
              Faits du {formatJour(s.dateFaits)} · décidé le {formatJour(s.decideLe)}{s.decidePar && ` par ${s.decidePar}`}
              {s.finSuspension && ` · suspendu jusqu'au ${formatJour(s.finSuspension)}`}
            </p>
          </div>
          <AnnulerSanction id={s.id} />
        </li>
      ))}
    </ul>
  );
}
