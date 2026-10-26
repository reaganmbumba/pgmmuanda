import { CalendarDays, GraduationCap, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { FicheNonReliee } from "@/components/ui/FicheNonReliee";
import { utilisateurCourant } from "@/lib/auth/session";
import { mesFormationsDemo } from "@/lib/demo-data";
import { formatDateHeure } from "@/lib/format";
import { maFiche } from "@/lib/membres/depot";
import { mesFormations, type MaFormation } from "@/lib/organisation/depot";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Mes formations" };

function Formation({ f }: { f: MaFormation }) {
  return (
    <article className={`rounded-2xl bg-white p-5 shadow-sm ${f.statutCode === "annulee" ? "opacity-70" : ""}`} data-formation={f.titre}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-marine-900">{f.titre}</h2>
        <Badge>{f.statut}</Badge>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
        <li className="flex items-center gap-2"><CalendarDays className="size-4 text-or-500" aria-hidden />{formatDateHeure(f.debut)}</li>
        {f.lieu && <li className="flex items-center gap-2"><MapPin className="size-4 text-or-500" aria-hidden />{f.lieu}</li>}
        {f.formateur && <li className="flex items-center gap-2"><User className="size-4 text-or-500" aria-hidden />{f.formateur}</li>}
      </ul>
      {f.description && <p className="mt-3 whitespace-pre-line text-sm text-slate-500">{f.description}</p>}
      {(f.note !== null || f.resultatCode !== "inscrit" || f.appreciation) && (
        <div className="mt-4 rounded-xl bg-marine-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mon résultat</p>
          <div className="mt-1 flex items-center gap-3">
            {f.note !== null && <span className="text-2xl font-bold text-marine-900">{String(f.note).replace(".", ",")}<span className="text-base font-normal text-slate-500"> / 20</span></span>}
            <Badge>{f.resultat}</Badge>
          </div>
          {f.appreciation && <p className="mt-2 text-sm text-slate-700">« {f.appreciation} »</p>}
        </div>
      )}
    </article>
  );
}

export default async function MesFormations() {
  let formations: MaFormation[];
  if (!supabaseActif) formations = mesFormationsDemo;
  else {
    const u = await utilisateurCourant();
    const fiche = u ? await maFiche(u.id) : null;
    if (!fiche) return <FicheNonReliee />;
    formations = await mesFormations(fiche.id);
  }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-marine-900">Mes formations</h1>
      {formations.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <GraduationCap className="mx-auto size-10 text-or-500" aria-hidden />
          <p className="mt-3 font-medium text-marine-900">Vous n&apos;êtes inscrit à aucune formation.</p>
          <p className="mt-1 text-sm text-slate-500">Quand la PGM vous inscrira, la formation apparaîtra ici.</p>
        </div>
      ) : formations.map((f) => <Formation key={f.id} f={f} />)}
    </div>
  );
}
