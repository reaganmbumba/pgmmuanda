import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { ListeChants } from "@/components/chants/Chants";
import { EnTete } from "@/components/ui/Carte";
import { Vide } from "@/components/ui/Champ";
import { FormulaireRapide, Repliable } from "@/components/ui/FormulaireRapide";
import { peutGererCommission } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { chantsDemo } from "@/lib/demo-data";
import { listerChants } from "@/lib/organisation/depot";
import { supabaseActif } from "@/lib/supabase/config";
import { enregistrerChant } from "./actions";
import { ChampsChant } from "./ChampsChant";

export const metadata = { title: "Chants et partitions" };

/** Recherche sans tenir compte des accents ni des majuscules. */
const simplifier = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default async function PageChants({ searchParams }: { searchParams: Promise<{ q?: string; vue?: string }> }) {
  const moi = await exigerAcces("/staff/chants");
  const description = "Répertoire de la PGM : paroles, partitions et enregistrements.";
  if (!supabaseActif || !moi) return (<><EnTete titre="Chants et partitions" description={description} /><ListeChants chants={chantsDemo} /></>);
  const { q = "", vue } = await searchParams;
  const archives = vue === "archives";
  const tous = await listerChants({ archives });
  const chants = q ? tous.filter((c) => simplifier(`${c.titre} ${c.auteur} ${c.paroles}`).includes(simplifier(q))) : tous;
  return (
    <>
      <EnTete titre="Chants et partitions" description={description}
        actions={
          <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
            {[["/staff/chants", "Répertoire", !archives], ["/staff/chants?vue=archives", "Retirés", archives]].map(([h, l, a]) => (
              <Link key={String(h)} href={String(h)} aria-current={a ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${a ? "bg-marine-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{l}</Link>
            ))}
          </div>
        } />
      {peutGererCommission(moi.role) && !archives && (
        <div className="mb-6">
          <Repliable titre="Ajouter un chant">
            <FormulaireRapide action={enregistrerChant} libelle="Ajouter au répertoire" icone={<Plus className="size-4" aria-hidden />}><ChampsChant /></FormulaireRapide>
          </Repliable>
        </div>
      )}
      <form className="mb-4 flex gap-2">
        <input type="hidden" name="vue" value={archives ? "archives" : ""} />
        <label className="relative flex-1">
          <span className="sr-only">Rechercher un chant</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Titre, auteur ou paroles…" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm" />
        </label>
        <button className="rounded-xl bg-marine-900 px-4 text-sm font-semibold text-white">Chercher</button>
      </form>
      {chants.length === 0 ? <Vide>{q ? "Aucun chant ne correspond à votre recherche." : archives ? "Aucun chant retiré." : "Le répertoire est vide."}</Vide>
        : <ListeChants chants={chants} base="/staff/chants" />}
    </>
  );
}
