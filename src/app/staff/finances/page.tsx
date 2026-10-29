import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Download, Save } from "lucide-react";
import { Bouton } from "@/components/ui/Bouton";
import { Carte, EnTete } from "@/components/ui/Carte";
import { Vide } from "@/components/ui/Champ";
import { FormulaireRapide, Repliable } from "@/components/ui/FormulaireRapide";
import { estAdmin, peutSuivreFinances } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { operationsDemo } from "@/lib/demo-data";
import { listerDocuments, type Document } from "@/lib/documents/depot";
import { LigneOperation, recusParOperation } from "./LigneOperation";
import { listerOperations, listerProjets, type Operation } from "@/lib/organisation/depot";
import { bilan, formatMontant, type Devise } from "@/lib/organisation/libelles";
import { jourLocal } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { enregistrerOperation } from "./actions";
import { ChampsOperation } from "./ChampsOperation";

export const metadata = { title: "Finances" };

function Bilans({ operations }: { operations: Operation[] }) {
  const b = bilan(operations);
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2">
      {(["CDF", "USD"] as Devise[]).map((d) => (
        <section key={d} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm" data-bilan={d}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{d === "CDF" ? "Caisse en francs congolais" : "Caisse en dollars"}</h2>
          <p className={`mt-2 text-3xl font-bold ${b[d].solde < 0 ? "text-red-700" : "text-marine-900"}`}>{formatMontant(b[d].solde, d)}</p>
          <p className="text-xs text-slate-500">Solde de la période</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <p className="rounded-xl bg-emerald-50 p-3"><span className="flex items-center gap-1 text-xs text-emerald-700"><ArrowDownLeft className="size-3.5" aria-hidden />Entrées</span>
              <span className="font-semibold text-emerald-800">{formatMontant(b[d].recettes, d)}</span></p>
            <p className="rounded-xl bg-red-50 p-3"><span className="flex items-center gap-1 text-xs text-red-700"><ArrowUpRight className="size-3.5" aria-hidden />Sorties</span>
              <span className="font-semibold text-red-800">{formatMontant(b[d].depenses, d)}</span></p>
          </div>
        </section>
      ))}
    </div>
  );
}

function Tableau({ operations, supprimable, recus = new Map(), joindre }: {
  operations: Operation[]; supprimable: boolean; recus?: Map<string, Document[]>; joindre?: boolean;
}) {
  if (operations.length === 0) return <Vide>Aucune opération sur cette période.</Vide>;
  return (
    <Carte>
      <ul className="divide-y divide-slate-100">
        {operations.map((o) => (
          <LigneOperation key={o.id} o={o} recus={recus.get(o.id)} supprimable={supprimable} joindre={joindre} />
        ))}
      </ul>
    </Carte>
  );
}

export default async function PageFinances({ searchParams }: { searchParams: Promise<{ annee?: string }> }) {
  const moi = await exigerAcces("/staff/finances");
  const description = "Entrées et sorties d'argent. Les francs et les dollars sont comptés séparément.";
  if (!supabaseActif || !moi) {
    return (<><EnTete titre="Finances" description={description} /><Bilans operations={operationsDemo} /><Tableau operations={operationsDemo} supprimable={false} /></>);
  }
  const anneeCourante = Number(jourLocal(new Date().toISOString()).slice(0, 4));
  const { annee: a } = await searchParams;
  const annee = /^\d{4}$/.test(a ?? "") ? Number(a) : anneeCourante;
  const [operations, projets] = await Promise.all([
    listerOperations({ depuis: `${annee}-01-01`, avant: `${annee + 1}-01-01` }),
    listerProjets(),
  ]);
  const admin = estAdmin(moi.role);
  // Sans « Accès aux finances », un responsable de commission ne suit que l'argent de ses projets.
  const complet = peutSuivreFinances(moi.role, moi.accesFinances);
  const recus = recusParOperation(await listerDocuments({ operations: operations.map((o) => o.id) }));
  const ouverts = projets.filter((p) => p.statutCode !== "annule" && p.statutCode !== "termine");

  return (
    <>
      <EnTete titre="Finances" description={description}
        actions={
          <>
            <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
              {[anneeCourante - 1, anneeCourante].map((x) => (
                <Link key={x} href={`/staff/finances?annee=${x}`} aria-current={x === annee ? "page" : undefined}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${x === annee ? "bg-marine-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{x}</Link>
              ))}
            </div>
            <Bouton variante="secondaire" href={`/staff/finances/export?annee=${annee}`}><Download className="size-4" aria-hidden /> Exporter (Excel)</Bouton>
          </>
        } />
      <Bilans operations={operations} />
      <div className="mb-6">
        {complet || ouverts.length > 0 ? (
          <Repliable titre="Enregistrer une entrée ou une sortie d'argent">
            <FormulaireRapide action={enregistrerOperation} libelle="Enregistrer" icone={<Save className="size-4" aria-hidden />}>
              <ChampsOperation projets={ouverts} projetObligatoire={!complet} />
            </FormulaireRapide>
          </Repliable>
        ) : (
          <p className="text-sm text-slate-500">Créez d&apos;abord un projet pour votre commission pour y enregistrer des dépenses.</p>
        )}
      </div>
      <h2 className="mb-3 text-lg font-semibold text-marine-900">Opérations {annee}</h2>
      <Tableau operations={operations} supprimable={admin} recus={recus} joindre />
      {!admin && (
        <p className="mt-4 text-xs text-slate-500">
          {complet
            ? "L'administration vous a choisi(e) pour suivre les finances."
            : "Vous voyez seulement l'argent des projets de votre commission."}{" "}
          Pour corriger ou supprimer une erreur, contactez l&apos;administration.
        </p>
      )}
    </>
  );
}
