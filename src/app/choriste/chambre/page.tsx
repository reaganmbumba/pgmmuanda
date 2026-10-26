import { BedDouble, CalendarDays, MapPin } from "lucide-react";
import { FicheNonReliee } from "@/components/ui/FicheNonReliee";
import { utilisateurCourant } from "@/lib/auth/session";
import { affectationsDemo } from "@/lib/demo-data";
import { maFiche } from "@/lib/membres/depot";
import { listerAffectations } from "@/lib/organisation/depot";
import { formatPeriode, nuits } from "@/lib/organisation/libelles";
import { jourLocal } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Ma chambre" };

type Sejour = { id: string; chambre: string; site: string; du: string; au: string; notes: string };

export default async function MaChambre() {
  const aujourdhui = jourLocal(new Date().toISOString());
  let sejours: Sejour[];
  if (!supabaseActif) sejours = affectationsDemo.slice(0, 1);
  else {
    const u = await utilisateurCourant();
    const fiche = u ? await maFiche(u.id) : null;
    if (!fiche) return <FicheNonReliee />;
    // La base ne renvoie que l'hébergement de ce choriste (jamais les autres occupants).
    sejours = await listerAffectations({ membreId: fiche.id, depuis: aujourdhui });
  }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-marine-900">Ma chambre</h1>
      {sejours.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <BedDouble className="mx-auto size-10 text-or-500" aria-hidden />
          <p className="mt-3 font-medium text-marine-900">Aucun hébergement prévu pour vous.</p>
          <p className="mt-1 text-sm text-slate-500">Si la PGM vous loge lors d&apos;un événement, votre chambre apparaîtra ici.</p>
        </div>
      ) : sejours.map((s) => {
        const enCours = s.du <= aujourdhui;
        const n = nuits(s.du, s.au);
        return (
          <article key={s.id} className="overflow-hidden rounded-2xl bg-white shadow-sm" data-sejour={s.chambre}>
            <div className="bg-marine-900 px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-wide text-or-400">{enCours ? "Votre chambre en ce moment" : "Votre prochaine chambre"}</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-bold"><BedDouble className="size-6 text-or-400" aria-hidden />{s.chambre}</p>
            </div>
            <ul className="space-y-2 p-5 text-base text-slate-700">
              {s.site && <li className="flex items-center gap-2"><MapPin className="size-5 text-or-500" aria-hidden />{s.site}</li>}
              <li className="flex items-center gap-2"><CalendarDays className="size-5 text-or-500" aria-hidden />
                {formatPeriode(s.du, s.au)}{n > 0 && ` (${n} nuit${n > 1 ? "s" : ""})`}</li>
              {s.notes && <li className="rounded-xl bg-or-100/60 p-3 text-sm">{s.notes}</li>}
            </ul>
          </article>
        );
      })}
      <p className="text-center text-xs text-slate-400">Pour un changement, contactez la présidence de la PGM.</p>
    </div>
  );
}
