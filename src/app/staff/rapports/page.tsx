import Link from "next/link";
import { Download } from "lucide-react";
import { Bouton } from "@/components/ui/Bouton";
import { Carte, EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { lireOrganisation } from "@/lib/membres/depot";
import { listerActivites, presencesPeriode, taux } from "@/lib/programmes/depot";
import { dansJours } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Rapports" };

const PERIODES = [30, 90, 365];

export default async function PageRapports({ searchParams }: { searchParams: Promise<{ jours?: string }> }) {
  const moi = await exigerAcces("/staff/rapports");
  if (!supabaseActif || !moi) {
    return (
      <>
        <EnTete titre="Rapports" description="Statistiques de présence et exports." />
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          En mode maquette, les rapports sont vides : ils sont calculés à partir des présences enregistrées dans la base.
        </p>
      </>
    );
  }
  const j = Number((await searchParams).jours);
  const jours = PERIODES.includes(j) ? j : 30;
  const depuis = dansJours(-jours);
  const [presences, activites, organisation] = await Promise.all([
    presencesPeriode(depuis), listerActivites({ depuis, avant: dansJours(0), decroissant: true }), lireOrganisation(),
  ]);

  const parActivite = activites.map((a) => {
    const lignes = presences.filter((p) => p.activiteId === a.id);
    const n = (s: string) => lignes.filter((p) => p.statutCode === s).length;
    return { a, present: n("present"), absent: n("absent"), excuse: n("excuse"), taux: taux(lignes) };
  });
  const parParoisse = organisation.paroisses
    .map((p) => {
      const lignes = presences.filter((x) => x.paroisseId === p.id);
      return { nom: p.nom, saisies: lignes.length, taux: taux(lignes) };
    })
    .filter((p) => p.saisies > 0);
  const global = taux(presences);

  return (
    <>
      <EnTete
        titre="Rapports"
        description="Présences saisies sur la période, dans votre périmètre."
        actions={
          <>
            <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
              {PERIODES.map((p) => (
                <Link key={p} href={`/staff/rapports?jours=${p}`} aria-current={p === jours ? "page" : undefined}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${p === jours ? "bg-marine-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
                  {p === 365 ? "12 mois" : `${p} jours`}
                </Link>
              ))}
            </div>
            <Bouton variante="secondaire" href={`/staff/rapports/presences?jours=${jours}`}>
              <Download className="size-4" aria-hidden /> Exporter les présences (Excel)
            </Bouton>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          ["Activités passées", activites.length],
          ["Activités avec présences", parActivite.filter((x) => x.present + x.absent + x.excuse > 0).length],
          ["Présences saisies", presences.length],
          ["Taux de présence", global === null ? "—" : `${global} %`],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm" data-indicateur={l}>
            <p className="text-sm text-slate-500">{l}</p>
            <p className="mt-2 text-3xl font-bold text-marine-900">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Carte titre="Par activité" className="xl:col-span-2">
          {parActivite.length === 0 ? <p className="text-sm text-slate-500">Aucune activité sur la période.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="py-2 pr-3">Activité</th><th className="py-2 pr-3">Présents</th><th className="py-2 pr-3">Absents</th><th className="py-2 pr-3">Excusés</th><th className="py-2">Taux</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parActivite.map(({ a, present, absent, excuse, taux: t }) => (
                    <tr key={a.id}>
                      <td className="py-2 pr-3">
                        <Link href={`/staff/programmes/${a.id}`} className="font-medium text-marine-900 hover:underline">{a.titre}</Link>
                        <span className="block text-xs text-slate-400">{formatDate(a.debut)} · {a.statut}</span>
                      </td>
                      <td className="py-2 pr-3">{present}</td><td className="py-2 pr-3">{absent}</td><td className="py-2 pr-3">{excuse}</td>
                      <td className="py-2 font-semibold text-marine-900">{t === null ? "—" : `${t} %`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Carte>
        <Carte titre="Par paroisse">
          {parParoisse.length === 0 ? <p className="text-sm text-slate-500">Aucune présence saisie.</p> : (
            <ul className="space-y-3">
              {parParoisse.map((p) => (
                <li key={p.nom} className="text-sm">
                  <div className="flex justify-between"><span className="text-slate-700">{p.nom}</span><span className="font-semibold text-marine-900">{p.taux} %</span></div>
                  <span className="mt-1 block h-2 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-marine-800" style={{ width: `${p.taux}%` }} />
                  </span>
                  <span className="text-xs text-slate-400">{p.saisies} présence{p.saisies > 1 ? "s" : ""} saisie{p.saisies > 1 ? "s" : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>
      <p className="mt-4 text-xs text-slate-400">Le taux de présence compte les « présents » parmi les présences saisies (présents, absents et excusés).</p>
    </>
  );
}
