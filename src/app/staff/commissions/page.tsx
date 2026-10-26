import Link from "next/link";
import { ChevronRight, Plus, UsersRound } from "lucide-react";
import { EnTete } from "@/components/ui/Carte";
import { Champ, Vide } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import { FormulaireRapide, Repliable } from "@/components/ui/FormulaireRapide";
import { estAdmin } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { commissionsDemo } from "@/lib/demo-data";
import { listerCommissions, type Commission } from "@/lib/organisation/depot";
import { supabaseActif } from "@/lib/supabase/config";
import { creerCommission } from "./actions";

export const metadata = { title: "Commissions" };

function Liste({ commissions, lien }: { commissions: Commission[]; lien: boolean }) {
  if (commissions.length === 0) return <Vide>Aucune commission pour le moment.</Vide>;
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {commissions.map((c) => {
        const contenu = (
          <>
            <span className="rounded-xl bg-marine-50 p-3 text-marine-800"><UsersRound className="size-6" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-marine-900">{c.nom}</p>
              {c.description && <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{c.description}</p>}
              <p className="mt-2 text-xs font-medium text-or-600">{c.nbMembres} membre{c.nbMembres > 1 ? "s" : ""}</p>
            </div>
            {lien && <ChevronRight className="size-5 shrink-0 text-slate-300" aria-hidden />}
          </>
        );
        const cls = "flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm";
        return (
          <li key={c.id} data-commission={c.nom}>
            {lien ? <Link href={`/staff/commissions/${c.id}`} className={`${cls} hover:border-marine-300`}>{contenu}</Link> : <div className={cls}>{contenu}</div>}
          </li>
        );
      })}
    </ul>
  );
}

export default async function PageCommissions() {
  const moi = await exigerAcces("/staff/commissions");
  const description = "Les équipes de travail de la PGM et leurs membres.";
  if (!supabaseActif || !moi) {
    return (<><EnTete titre="Commissions" description={description} /><Liste commissions={commissionsDemo} lien={false} /></>);
  }
  const commissions = await listerCommissions();
  return (
    <>
      <EnTete titre="Commissions" description={description} />
      {estAdmin(moi.role) && (
        <div className="mb-6">
          <Repliable titre="Créer une commission">
            <FormulaireRapide action={creerCommission} libelle="Créer la commission" icone={<Plus className="size-4" aria-hidden />}>
              <Champ libelle="Nom *"><input name="nom" required maxLength={120} className={classeChamp} placeholder="Ex. Commission artistique" /></Champ>
              <Champ libelle="Rôle de la commission"><input name="description" maxLength={500} className={classeChamp} placeholder="Ex. Répertoire et répétitions" /></Champ>
            </FormulaireRapide>
          </Repliable>
        </div>
      )}
      <Liste commissions={commissions} lien />
    </>
  );
}
