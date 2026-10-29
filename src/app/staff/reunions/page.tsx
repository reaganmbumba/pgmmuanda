import Link from "next/link";
import { CalendarClock, ChevronRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Carte, EnTete } from "@/components/ui/Carte";
import { Vide } from "@/components/ui/Champ";
import { Repliable } from "@/components/ui/FormulaireRapide";
import { estAdmin } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { listerReunions, type Reunion } from "@/lib/conseil/depot";
import { DELAI_AG_JOURS } from "@/lib/conseil/libelles";
import { formatDateHeure } from "@/lib/format";
import { dansJours, versSaisieLocale } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { FormulaireConvocation } from "./Formulaires";

export const metadata = { title: "Réunions et AG" };

const TON = { convoquee: "or", tenue: "vert", annulee: "gris" } as const;

function Ligne({ r }: { r: Reunion }) {
  return (
    <li data-reunion={r.titre}>
      <Link href={`/staff/reunions/${r.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-or-600">{r.type}</p>
          <p className="font-medium text-marine-900">{r.titre}</p>
          <p className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" aria-hidden />{formatDateHeure(r.debut)}</span>
            {r.lieu && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{r.lieu}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2"><Badge ton={TON[r.statutCode]}>{r.statut}</Badge><ChevronRight className="size-4 text-slate-400" aria-hidden /></div>
      </Link>
    </li>
  );
}

export default async function PageReunions() {
  const moi = await exigerAcces("/staff/reunions");
  const description = "Réunions du Conseil et Assemblées générales : convocation, ordre du jour, présence et compte rendu.";
  if (!supabaseActif || !moi) {
    return (
      <>
        <EnTete titre="Réunions et AG" description={description} />
        <Vide>En mode maquette, les réunions sont désactivées : elles fonctionnent une fois la base de données configurée.</Vide>
      </>
    );
  }
  const admin = estAdmin(moi.role);
  const reunions = await listerReunions();
  const maintenant = new Date().toISOString();
  const aVenir = reunions.filter((r) => r.debut >= maintenant && r.statutCode === "convoquee").reverse();
  const passees = reunions.filter((r) => !aVenir.includes(r));
  const derniereAg = reunions.find((r) => r.typeCode === "ag_ordinaire" && r.statutCode !== "annulee");

  return (
    <>
      <EnTete titre="Réunions et AG" description={description}
        actions={<Link href="/staff/conseil" className="text-sm font-semibold text-marine-900 hover:underline">Le Conseil →</Link>} />
      <p className="mb-4 rounded-xl border border-or-400/60 bg-or-100/50 p-3 text-sm text-marine-900">
        Cadre général, art. 21 : l&apos;Assemblée générale ordinaire se tient une fois par an, convoquée au moins {DELAI_AG_JOURS} jours
        avant, avec l&apos;ordre du jour. {derniereAg ? `Dernière AG ordinaire : ${formatDateHeure(derniereAg.debut)}.` : "Aucune AG ordinaire enregistrée pour l'instant."}
      </p>
      {admin && (
        <div className="mb-4">
          <Repliable titre="Convoquer une réunion">
            <FormulaireConvocation minAg={versSaisieLocale(dansJours(DELAI_AG_JOURS + 0.01))} />
          </Repliable>
        </div>
      )}
      <div className="space-y-4">
        <Carte titre={`À venir (${aVenir.length})`}>
          {aVenir.length === 0 ? <p className="text-sm text-slate-500">Aucune réunion convoquée.</p>
            : <ul className="divide-y divide-slate-100">{aVenir.map((r) => <Ligne key={r.id} r={r} />)}</ul>}
        </Carte>
        {passees.length > 0 && (
          <Carte titre="Passées ou annulées">
            <ul className="divide-y divide-slate-100">{passees.map((r) => <Ligne key={r.id} r={r} />)}</ul>
          </Carte>
        )}
      </div>
    </>
  );
}
