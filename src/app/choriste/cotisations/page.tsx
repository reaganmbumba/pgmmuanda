import { CircleCheck, CircleX, Landmark } from "lucide-react";
import { FicheNonReliee } from "@/components/ui/FicheNonReliee";
import { utilisateurCourant } from "@/lib/auth/session";
import { cotisationsMembre } from "@/lib/cotisations/depot";
import { decaler, libelleMois, moisCourant } from "@/lib/cotisations/mois";
import { construireReleve, parAnnee, type Versement } from "@/lib/cotisations/releve";
import { choristeConnecte, mesCotisationsDemo } from "@/lib/demo-data";
import { maFiche } from "@/lib/membres/depot";
import { formatJour, formatMontant } from "@/lib/organisation/libelles";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Mes cotisations" };

const jourDuMois = (jour: string) => Number(jour.slice(8, 10));
const moisCourt = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });

export default async function MesCotisations() {
  let versements: Versement[] = mesCotisationsDemo;
  let titulaire = { nom: `${choristeConnecte.prenom} ${choristeConnecte.nom}`, matricule: choristeConnecte.matricule };
  let depuis: string | null = choristeConnecte.dateAdhesion;
  if (supabaseActif) {
    const u = await utilisateurCourant();
    const fiche = u ? await maFiche(u.id) : null;
    if (!fiche) return <FicheNonReliee />;
    versements = await cotisationsMembre(fiche.id);
    titulaire = { nom: `${fiche.prenom} ${fiche.nom}`.trim(), matricule: fiche.matricule };
    depuis = fiche.dateAdhesion ?? null;
  }
  const releve = construireReleve(versements);

  // Mois non payés : les 12 derniers mois, sans remonter avant l'adhésion
  const courant = moisCourant();
  const payes = new Set(versements.map((v) => v.mois));
  const nonPayes = Array.from({ length: 12 }, (_, i) => decaler(courant, -i))
    .filter((m) => (!depuis || m >= `${depuis.slice(0, 7)}-01`) && !payes.has(m));

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-marine-900">Mes cotisations</h1>

      {/* En-tête du relevé */}
      <section className="rounded-2xl bg-marine-900 p-5 text-white" aria-label="Total versé">
        <div className="flex items-center gap-2 text-sm text-white/80">
          <Landmark className="size-5" aria-hidden />
          <span>Relevé de cotisations</span>
        </div>
        <p className="mt-2 font-semibold">{titulaire.nom}</p>
        <p className="text-xs text-white/70">{titulaire.matricule}</p>
        <p className="mt-4 text-sm text-white/80">Total versé</p>
        {releve.totaux.length ? releve.totaux.map((t) => (
          <p key={t.devise} className="text-3xl font-bold" data-total={t.devise}>{formatMontant(t.montant, t.devise)}</p>
        )) : <p className="text-3xl font-bold" data-total="aucun">0 FC</p>}
        <p className="mt-2 text-xs text-white/70">
          {releve.lignes.length
            ? `${releve.lignes.length} versement${releve.lignes.length > 1 ? "s" : ""} depuis le ${formatJour(releve.premier!)}`
            : "Aucun versement pour le moment"}
        </p>
      </section>

      {/* État : à jour ou mois manquants */}
      {nonPayes.length ? (
        <details className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800" data-retard={nonPayes.length}>
          <summary className="flex cursor-pointer items-center gap-2 font-semibold">
            <CircleX className="size-5 shrink-0" aria-hidden />
            {nonPayes.length} mois pas encore payé{nonPayes.length > 1 ? "s" : ""}
          </summary>
          <ul className="mt-2 space-y-1 pl-7 text-sm capitalize">
            {nonPayes.map((m) => <li key={m}>{libelleMois(m)}</li>)}
          </ul>
        </details>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800" data-retard={0}>
          <CircleCheck className="size-5 shrink-0" aria-hidden /> Vous êtes à jour
        </p>
      )}

      {/* Liste des versements, comme un relevé de banque */}
      <section aria-label="Mes versements">
        <h2 className="mb-2 font-semibold text-marine-900">Mes versements</h2>
        {releve.lignes.length === 0 ? (
          <p className="rounded-2xl bg-white p-5 text-center text-sm text-slate-500 shadow-sm">
            Vos versements apparaîtront ici dès que la trésorerie les aura enregistrés.
          </p>
        ) : (
          <div className="space-y-4">
            {parAnnee(releve.lignes).map((g) => (
              <div key={g.annee}>
                <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.annee}</p>
                <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm">
                  {g.lignes.map((l) => (
                    <li key={l.id} className="flex items-center gap-3 px-4 py-3" data-versement={l.mois}>
                      <div className="w-11 shrink-0 rounded-xl bg-marine-100 py-1 text-center text-marine-900" aria-label={formatJour(l.payeLe)}>
                        <p className="text-lg font-bold leading-tight">{jourDuMois(l.payeLe)}</p>
                        <p className="text-[11px] leading-tight">{moisCourt.format(new Date(`${l.payeLe}T00:00:00Z`))}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-marine-900">{l.motif}</p>
                        {l.saisiPar && <p className="truncate text-xs text-slate-500">Reçu par {l.saisiPar}</p>}
                      </div>
                      <div className="text-right">
                        <p className="whitespace-nowrap font-semibold text-emerald-700">+ {formatMontant(l.montant, l.devise)}</p>
                        <p className="whitespace-nowrap text-xs text-slate-500">Total {formatMontant(l.cumul, l.devise)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-or-400/60 bg-or-100/60 p-4 text-sm text-marine-900">
        <p className="font-semibold">Ce que dit le Règlement intérieur</p>
        <p className="mt-1">Art. 2 et 3 : chaque membre « doit s&apos;acquitter régulièrement de ses contributions ».</p>
        <p className="mt-1">Art. 27 : le refus de s&apos;acquitter de ses contributions est un manquement.</p>
      </div>
    </div>
  );
}
