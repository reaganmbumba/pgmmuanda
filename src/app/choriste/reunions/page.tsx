import { CalendarClock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { utilisateurCourant } from "@/lib/auth/session";
import { listerReunions, presencesReunion } from "@/lib/conseil/depot";
import { formatDateHeure } from "@/lib/format";
import { maFiche } from "@/lib/membres/depot";
import { STATUTS_PRESENCE, type CodeStatutPresence } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Mes réunions" };

/** Convocations du Conseil et des Assemblées générales, pour les membres du Conseil. */
export default async function MesReunions() {
  const u = supabaseActif ? await utilisateurCourant() : null;
  const fiche = u ? await maFiche(u.id) : null;
  const reunions = fiche ? await listerReunions() : [];
  const maintenant = new Date().toISOString();
  const presences = new Map(await Promise.all(
    reunions.filter((r) => r.typeCode === "conseil" && r.debut < maintenant)
      .map(async (r) => [r.id, (await presencesReunion(r.id)).get(fiche!.id)] as const),
  ));

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-marine-900">Mes réunions</h1>
      {reunions.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm">
          Les convocations du Conseil de la PGM apparaissent ici si vous êtes membre du Conseil.
        </p>
      ) : (
        <ul className="space-y-3">
          {reunions.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4 shadow-sm" data-ma-reunion={r.titre}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-or-600">{r.type}</p>
                  <p className="font-semibold text-marine-900">{r.titre}</p>
                </div>
                <Badge ton={r.statutCode === "tenue" ? "vert" : r.statutCode === "annulee" ? "gris" : "or"}>{r.statut}</Badge>
              </div>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-700"><CalendarClock className="size-4" aria-hidden />{formatDateHeure(r.debut)}</p>
              {r.lieu && <p className="mt-1 flex items-center gap-2 text-sm text-slate-700"><MapPin className="size-4" aria-hidden />{r.lieu}</p>}
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-marine-900">Ordre du jour</summary>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{r.ordreDuJour}</p>
              </details>
              {r.compteRendu && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-semibold text-marine-900">Compte rendu</summary>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{r.compteRendu}</p>
                </details>
              )}
              {presences.get(r.id) && (
                <p className="mt-2 text-xs text-slate-500">Votre présence : {STATUTS_PRESENCE[presences.get(r.id) as CodeStatutPresence]}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
