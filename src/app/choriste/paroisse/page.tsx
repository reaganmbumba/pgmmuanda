import { Building2, MapPin, Music, UsersRound } from "lucide-react";
import { FicheNonReliee } from "@/components/ui/FicheNonReliee";
import { utilisateurCourant } from "@/lib/auth/session";
import { choristeConnecte } from "@/lib/demo-data";
import { libelleParoisse } from "@/lib/format";
import { lireOrganisation, maFiche } from "@/lib/membres/depot";
import { mesCommissions } from "@/lib/organisation/depot";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Ma paroisse" };

type Vue = {
  paroisse: string; ville: string; chorale: string; chorales: string[]; voix: string; fonction: string;
  commissions: { commission: string; description: string; fonction: string }[];
};

async function vue(): Promise<Vue | null> {
  if (!supabaseActif) {
    const m = choristeConnecte;
    return { paroisse: m.paroisse, ville: "Muanda", chorale: m.chorale, chorales: [m.chorale], voix: m.voix, fonction: m.fonction,
      commissions: [{ commission: "Commission artistique (démo)", description: "Répertoire et répétitions", fonction: "Membre" }] };
  }
  const u = await utilisateurCourant();
  const fiche = u ? await maFiche(u.id) : null;
  if (!fiche) return null;
  const [org, commissions] = await Promise.all([lireOrganisation(), mesCommissions(fiche.id)]);
  return {
    commissions,
    paroisse: fiche.paroisse,
    ville: org.paroisses.find((p) => p.id === fiche.paroisseId)?.ville ?? "",
    chorale: fiche.chorale,
    chorales: org.chorales.filter((c) => c.paroisseId === fiche.paroisseId).map((c) => c.nom),
    voix: fiche.voix,
    fonction: fiche.fonction,
  };
}

export default async function MaParoisse() {
  const v = await vue();
  if (!v) return <FicheNonReliee />;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-marine-900">Ma paroisse</h1>
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-marine-50 p-3 text-marine-800"><Building2 className="size-6" aria-hidden /></span>
          <div>
            <p className="text-lg font-semibold text-marine-900">{libelleParoisse(v.paroisse)}</p>
            {v.ville && <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin className="size-3.5" aria-hidden /> {v.ville}</p>}
          </div>
        </div>
        <dl className="mt-4 divide-y divide-slate-100 text-sm">
          <div className="flex justify-between py-2"><dt className="text-slate-500">Ma chorale</dt><dd className="font-medium text-marine-900">{v.chorale || "Non précisée"}</dd></div>
          <div className="flex justify-between py-2"><dt className="text-slate-500">Ma voix</dt><dd className="font-medium text-marine-900">{v.voix || "Non précisée"}</dd></div>
          <div className="flex justify-between py-2"><dt className="text-slate-500">Ma fonction</dt><dd className="font-medium text-marine-900">{v.fonction}</dd></div>
        </dl>
      </section>
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-marine-900">Chorales de la paroisse</h2>
        {v.chorales.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucune chorale enregistrée pour cette paroisse.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {v.chorales.map((c) => (
              <li key={c} className="flex items-center gap-2 text-sm text-slate-700"><Music className="size-4 text-or-500" aria-hidden /> {c}</li>
            ))}
          </ul>
        )}
      </section>
      {v.commissions.length > 0 && (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-marine-900">Mes commissions</h2>
          <ul className="mt-3 space-y-3">
            {v.commissions.map((c) => (
              <li key={c.commission} className="flex items-start gap-3" data-commission={c.commission}>
                <span className="rounded-lg bg-or-100/70 p-2 text-or-600"><UsersRound className="size-4" aria-hidden /></span>
                <div>
                  <p className="font-medium text-marine-900">{c.commission} <span className="text-sm font-normal text-slate-500">· {c.fonction}</span></p>
                  {c.description && <p className="text-sm text-slate-500">{c.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-center text-xs text-slate-400">Pour toute correction, utilisez « Mon profil » ou contactez le responsable de votre paroisse.</p>
    </div>
  );
}
