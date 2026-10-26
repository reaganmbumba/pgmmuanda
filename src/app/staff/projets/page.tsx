import Link from "next/link";
import { ChevronRight, FolderPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EnTete } from "@/components/ui/Carte";
import { Progression, Vide } from "@/components/ui/Champ";
import { FormulaireRapide, Repliable } from "@/components/ui/FormulaireRapide";
import { estAdmin } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { projetsDemo } from "@/lib/demo-data";
import { listerProjets, type Projet } from "@/lib/organisation/depot";
import { formatJour, formatMontant } from "@/lib/organisation/libelles";
import { lireCommissions } from "@/lib/programmes/depot";
import { supabaseActif } from "@/lib/supabase/config";
import { enregistrerProjet } from "./actions";
import { ChampsProjet } from "./ChampsProjet";

export const metadata = { title: "Projets" };

const budget = (p: Projet) => [p.budgetCdf && formatMontant(p.budgetCdf, "CDF"), p.budgetUsd && formatMontant(p.budgetUsd, "USD")].filter(Boolean).join(" + ") || "Pas de budget";

function Liste({ projets, lien }: { projets: Projet[]; lien: boolean }) {
  if (projets.length === 0) return <Vide>Aucun projet pour le moment.</Vide>;
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {projets.map((p) => {
        const contenu = (
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-marine-900">{p.titre}</p>
                <p className="text-xs text-slate-500">{p.commission || "Présidence"}{p.responsable && ` · ${p.responsable}`}</p>
              </div>
              <Badge>{p.statut}</Badge>
            </div>
            <Progression valeur={p.avancement} />
            <p className="flex justify-between text-xs text-slate-500">
              <span>Budget : {budget(p)}</span>
              {p.finPrevue && <span>Fin prévue : {formatJour(p.finPrevue)}</span>}
            </p>
          </div>
        );
        const cls = "flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm";
        return (
          <li key={p.id} data-projet={p.titre}>
            {lien ? <Link href={`/staff/projets/${p.id}`} className={`${cls} hover:border-marine-300`}>{contenu}<ChevronRight className="size-5 shrink-0 text-slate-300" aria-hidden /></Link>
              : <div className={cls}>{contenu}</div>}
          </li>
        );
      })}
    </ul>
  );
}

export default async function PageProjets() {
  const moi = await exigerAcces("/staff/projets");
  const description = "Projets de la PGM et des commissions : tâches, budget et avancement.";
  if (!supabaseActif || !moi) return (<><EnTete titre="Projets" description={description} /><Liste projets={projetsDemo} lien={false} /></>);
  const [projets, commissions] = await Promise.all([listerProjets(), lireCommissions()]);
  return (
    <>
      <EnTete titre="Projets" description={description} />
      <div className="mb-6">
        <Repliable titre="Nouveau projet">
          <FormulaireRapide action={enregistrerProjet} libelle="Créer le projet" icone={<FolderPlus className="size-4" aria-hidden />}>
            <ChampsProjet commissions={commissions} commissionFixe={estAdmin(moi.role) ? undefined : moi.commissionId} />
          </FormulaireRapide>
        </Repliable>
      </div>
      <Liste projets={projets} lien />
    </>
  );
}
