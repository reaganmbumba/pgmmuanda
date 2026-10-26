import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { DeposerFichier, Recus } from "@/components/documents/Fichiers";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import type { Document } from "@/lib/documents/depot";
import type { Operation } from "@/lib/organisation/depot";
import { formatJour, formatMontant, SENS_OPERATION } from "@/lib/organisation/libelles";
import { supprimerOperation } from "./actions";

/** Reçus joints, par opération. */
export function recusParOperation(documents: Document[]) {
  const m = new Map<string, Document[]>();
  for (const d of documents) if (d.operationId) m.set(d.operationId, [...(m.get(d.operationId) ?? []), d]);
  return m;
}

/** Ligne d'opération : montant, reçus joints et dépôt d'un reçu. */
export function LigneOperation({ o, recus = [], supprimable, joindre }: { o: Operation; recus?: Document[]; supprimable?: boolean; joindre?: boolean }) {
  return (
    <li className="py-3" data-operation={o.libelle}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`rounded-full p-2 ${o.sens === "recette" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {o.sens === "recette" ? <ArrowDownLeft className="size-4" aria-label={SENS_OPERATION.recette} /> : <ArrowUpRight className="size-4" aria-label={SENS_OPERATION.depense} />}
          </span>
          <div>
            <p className="font-medium text-marine-900">{o.libelle}</p>
            <p className="text-xs text-slate-500">{formatJour(o.date)} · {o.categorie}{o.projet && ` · ${o.projet}`}{o.piece && ` · Reçu n° ${o.piece}`}</p>
            <Recus documents={recus} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`whitespace-nowrap font-semibold ${o.sens === "recette" ? "text-emerald-700" : "text-red-700"}`}>
            {o.sens === "recette" ? "+" : "−"} {formatMontant(o.montant, o.devise)}
          </span>
          {supprimable && <ActionConfirmee action={supprimerOperation} champs={{ id: o.id }} danger libelle="Supprimer" question="Supprimer cette opération (erreur de saisie) ?" />}
        </div>
      </div>
      {joindre && (
        <details className="mt-2 pl-12">
          <summary className="cursor-pointer text-xs font-medium text-marine-700">Joindre la photo du reçu</summary>
          <div className="mt-2 rounded-xl bg-slate-50 p-3"><DeposerFichier champs={{ operationId: o.id, titre: `Reçu : ${o.libelle}` }} libelle="Joindre" titre={false} /></div>
        </details>
      )}
    </li>
  );
}
