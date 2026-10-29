import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Carte, EnTete } from "@/components/ui/Carte";
import { Vide } from "@/components/ui/Champ";
import { Repliable } from "@/components/ui/FormulaireRapide";
import { estAdmin } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { conseilA, historiqueConseil } from "@/lib/conseil/depot";
import { absencesConsecutives, aUnAdjoint, FONCTIONS_CONSEIL, libelleFonction, SEUIL_ART_31, SIEGES_CONSEIL, type CodeFonction } from "@/lib/conseil/libelles";
import { formatDate, nomComplet } from "@/lib/format";
import { listerMembres } from "@/lib/membres/depot";
import { dansJours, jourLocal } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { FormulaireMandat, TerminerMandat } from "./Formulaires";

export const metadata = { title: "Conseil de la PGM" };

export default async function PageConseil() {
  const moi = await exigerAcces("/staff/conseil");
  const description = "Les membres du Conseil et leurs fonctions (Cadre général, art. 26 à 31).";
  if (!supabaseActif || !moi) {
    return (
      <>
        <EnTete titre="Conseil de la PGM" description={description} />
        <Vide>En mode maquette, le Conseil est désactivé : il fonctionne une fois la base de données configurée.</Vide>
      </>
    );
  }
  const admin = estAdmin(moi.role);
  const aujourdhui = jourLocal(dansJours(0));
  const bientot = jourLocal(dansJours(90));
  const [mandats, historique, membres] = await Promise.all([
    conseilA(), historiqueConseil(), admin ? listerMembres() : Promise.resolve([]),
  ]);
  const siege = (f: CodeFonction, adjoint: boolean) => mandats.find((m) => m.fonction === f && m.adjoint === adjoint);
  const absents = mandats
    .map((m) => ({ ...m, n: absencesConsecutives(historique.get(m.membreId) ?? []) }))
    .filter((m) => m.n >= SEUIL_ART_31);

  return (
    <>
      <EnTete titre="Conseil de la PGM" description={description}
        actions={<Link href="/staff/reunions" className="text-sm font-semibold text-marine-900 hover:underline">Réunions et AG →</Link>} />
      <p className="mb-4 text-sm text-slate-600" data-sieges>
        {mandats.length} siège{mandats.length > 1 ? "s" : ""} occupé{mandats.length > 1 ? "s" : ""} sur {SIEGES_CONSEIL}. Mandat de 4 ans renouvelable (art. 29).
      </p>
      {absents.length > 0 && (
        <div role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800" data-art31>
          <p className="flex items-center gap-2 font-semibold"><TriangleAlert className="size-4" aria-hidden /> Article 31</p>
          <p className="mt-1">Absent sans justification à {SEUIL_ART_31} réunions du Conseil de suite ou plus : {absents.map((m) => m.nom).join(", ")}.
            Le Cadre général dit qu&apos;il « pourra être considéré comme démissionnaire ». C&apos;est à la hiérarchie de décider.</p>
        </div>
      )}
      <Carte>
        <ul className="divide-y divide-slate-100">
          {(Object.keys(FONCTIONS_CONSEIL) as CodeFonction[]).flatMap((f) => (aUnAdjoint(f) ? [false, true] : [false]).map((adjoint) => {
            const m = siege(f, adjoint);
            return (
              <li key={f + adjoint} className={`flex flex-wrap items-center justify-between gap-3 py-3 ${adjoint ? "pl-5" : ""}`} data-siege={libelleFonction(f, adjoint)}>
                <div className="min-w-0">
                  <p className={`text-xs ${adjoint ? "text-slate-500" : "font-semibold uppercase tracking-wide text-or-600"}`}>{libelleFonction(f, adjoint)}</p>
                  {m ? (
                    <>
                      <p className="font-medium text-marine-900">{m.nom}</p>
                      <p className={`text-xs ${m.fin <= bientot ? "font-semibold text-amber-700" : "text-slate-500"}`}>
                        Depuis le {formatDate(m.debut)} · jusqu&apos;au {formatDate(m.fin)}{m.fin <= bientot ? " (bientôt la fin du mandat)" : ""}
                      </p>
                    </>
                  ) : <p className="text-sm italic text-slate-400">Personne pour l&apos;instant</p>}
                </div>
                {admin && m && <TerminerMandat id={m.id} nom={m.nom} />}
              </li>
            );
          }))}
        </ul>
      </Carte>
      {admin && (
        <div className="mt-4">
          <Repliable titre="Nommer quelqu'un au Conseil">
            <FormulaireMandat aujourdhui={aujourdhui}
              membres={membres.filter((m) => m.statutCode === "actif").map((m) => ({ id: m.id, nom: `${nomComplet(m).replace(/\s+/g, " ").trim()} (${m.matricule})` }))} />
          </Repliable>
        </div>
      )}
    </>
  );
}
