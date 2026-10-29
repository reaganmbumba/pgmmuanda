import { CircleCheck, CircleX } from "lucide-react";
import { FicheNonReliee } from "@/components/ui/FicheNonReliee";
import { utilisateurCourant } from "@/lib/auth/session";
import { cotisationsMembre } from "@/lib/cotisations/depot";
import { decaler, libelleMois, moisCourant } from "@/lib/cotisations/mois";
import { maFiche } from "@/lib/membres/depot";
import { formatJour, formatMontant } from "@/lib/organisation/libelles";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Mes cotisations" };

export default async function MesCotisations() {
  let paiements: Awaited<ReturnType<typeof cotisationsMembre>> = [];
  let depuis: string | null = null;
  if (supabaseActif) {
    const u = await utilisateurCourant();
    const fiche = u ? await maFiche(u.id) : null;
    if (!fiche) return <FicheNonReliee />;
    paiements = await cotisationsMembre(fiche.id);
    depuis = fiche.dateAdhesion ?? null;
  }
  const courant = moisCourant();
  // Les 12 derniers mois, sans remonter avant l'adhésion
  const mois = Array.from({ length: 12 }, (_, i) => decaler(courant, -i))
    .filter((m) => !depuis || m >= `${depuis.slice(0, 7)}-01`);
  const parMois = new Map(paiements.map((p) => [p.mois, p]));
  const enRetard = mois.filter((m) => !parMois.has(m)).length;
  const avance = paiements.filter((p) => p.mois > courant);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-marine-900">Mes cotisations</h1>
      <div className={`rounded-2xl p-5 text-white ${enRetard ? "bg-red-700" : "bg-marine-900"}`}>
        <p className="text-sm text-white/80">{enRetard ? "Mois pas encore payés" : "Vous êtes à jour"}</p>
        <p className="mt-1 text-4xl font-bold" data-retard>{enRetard || "✓"}</p>
      </div>
      <div className="rounded-2xl border border-or-400/60 bg-or-100/60 p-4 text-sm text-marine-900">
        <p className="font-semibold">Ce que dit le Règlement intérieur</p>
        <p className="mt-1">Art. 2 et 3 : chaque membre « doit s&apos;acquitter régulièrement de ses contributions ».</p>
        <p className="mt-1">Art. 27 : le refus de s&apos;acquitter de ses contributions est un manquement.</p>
      </div>
      <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm">
        {[...avance.map((p) => p.mois).reverse(), ...mois].map((m) => {
          const p = parMois.get(m);
          return (
            <li key={m} className="flex items-center justify-between gap-3 px-4 py-3" data-mois={m}>
              <div className="flex items-center gap-3">
                {p ? <CircleCheck className="size-6 text-emerald-600" aria-label="Payé" /> : <CircleX className="size-6 text-red-600" aria-label="Pas payé" />}
                <div>
                  <p className="text-sm font-medium capitalize text-marine-900">{libelleMois(m)}</p>
                  <p className="text-xs text-slate-500">{p ? `Payé le ${formatJour(p.payeLe)}` : "Pas encore payé"}</p>
                </div>
              </div>
              {p && <span className="font-semibold text-emerald-700">{formatMontant(p.montant, p.devise)}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
