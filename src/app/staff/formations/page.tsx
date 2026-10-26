import Link from "next/link";
import { CalendarDays, ChevronRight, GraduationCap, MapPin, Plus, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EnTete } from "@/components/ui/Carte";
import { Vide } from "@/components/ui/Champ";
import { FormulaireRapide, Repliable } from "@/components/ui/FormulaireRapide";
import { estAdmin, peutGererCommission } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { formationsDemo } from "@/lib/demo-data";
import { formatDateHeure } from "@/lib/format";
import { listerFormations, type Formation } from "@/lib/organisation/depot";
import { lireCommissions } from "@/lib/programmes/depot";
import { supabaseActif } from "@/lib/supabase/config";
import { enregistrerFormation } from "./actions";
import { ChampsFormation } from "./ChampsFormation";

export const metadata = { title: "Formations" };

function Liste({ formations, lien }: { formations: Formation[]; lien: boolean }) {
  if (formations.length === 0) return <Vide>Aucune formation pour le moment.</Vide>;
  return (
    <ul className="space-y-3">
      {formations.map((f) => {
        const contenu = (
          <>
            <span className="hidden rounded-xl bg-marine-50 p-3 text-marine-800 sm:block"><GraduationCap className="size-6" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold text-marine-900">{f.titre}</p><Badge>{f.statut}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden />{formatDateHeure(f.debut)}</span>
                {f.lieu && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{f.lieu}</span>}
                {f.formateur && <span className="inline-flex items-center gap-1"><User className="size-3.5" aria-hidden />{f.formateur}</span>}
                <span className="inline-flex items-center gap-1"><Users className="size-3.5" aria-hidden />
                  {f.nbInscrits} inscrit{f.nbInscrits > 1 ? "s" : ""}{f.places ? ` / ${f.places} places` : ""}</span>
                {f.commission && <span>{f.commission}</span>}
              </div>
            </div>
            {lien && <ChevronRight className="size-5 shrink-0 self-center text-slate-300" aria-hidden />}
          </>
        );
        const cls = "flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm";
        return <li key={f.id} data-formation={f.titre}>{lien ? <Link href={`/staff/formations/${f.id}`} className={`${cls} hover:border-marine-300`}>{contenu}</Link> : <div className={cls}>{contenu}</div>}</li>;
      })}
    </ul>
  );
}

export default async function PageFormations() {
  const moi = await exigerAcces("/staff/formations");
  const description = "Solfège, technique vocale, direction : sessions, inscrits et évaluations.";
  if (!supabaseActif || !moi) {
    return (<><EnTete titre="Formations" description={description} /><Liste formations={formationsDemo} lien={false} /></>);
  }
  const [formations, commissions] = await Promise.all([listerFormations(), lireCommissions()]);
  return (
    <>
      <EnTete titre="Formations" description={description} />
      {peutGererCommission(moi.role) && (
        <div className="mb-6">
          <Repliable titre="Nouvelle formation">
            <FormulaireRapide action={enregistrerFormation} libelle="Créer la formation" icone={<Plus className="size-4" aria-hidden />}>
              <ChampsFormation commissions={commissions} commissionFixe={estAdmin(moi.role) ? undefined : moi.commissionId} />
            </FormulaireRapide>
          </Repliable>
        </div>
      )}
      <Liste formations={formations} lien />
    </>
  );
}
