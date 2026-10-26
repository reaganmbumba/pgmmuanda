import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { FicheNonReliee } from "@/components/ui/FicheNonReliee";
import { utilisateurCourant } from "@/lib/auth/session";
import { activites as activitesDemo } from "@/lib/demo-data";
import { formatDateHeure, formatHeure } from "@/lib/format";
import { maFiche } from "@/lib/membres/depot";
import { listerActivites, presencesMembre } from "@/lib/programmes/depot";
import { dansJours, depuisSaisieLocale, jourLocal } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Mon programme" };

type Vue = { id: string; titre: string; description: string; debut: string; fin?: string | null; lieu: string; statut: string; presence?: string };

function Activite({ a }: { a: Vue }) {
  return (
    <article className={`rounded-2xl bg-white p-4 shadow-sm ${a.statut === "Annulée" ? "opacity-70" : ""}`} data-activite={a.titre}>
      <div className="flex items-start justify-between gap-2">
        <h2 className={`font-semibold text-marine-900 ${a.statut === "Annulée" ? "line-through" : ""}`}>{a.titre}</h2>
        <Badge>{a.statut}</Badge>
      </div>
      {a.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{a.description}</p>}
      <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
        <CalendarDays className="size-4 text-or-500" aria-hidden /> {formatDateHeure(a.debut)}{a.fin && jourLocal(a.fin) === jourLocal(a.debut) ? ` – ${formatHeure(a.fin)}` : ""}
      </p>
      {a.lieu && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin className="size-4 text-or-500" aria-hidden /> {a.lieu}
        </p>
      )}
      {a.presence && <p className="mt-3 text-xs text-slate-500">Ma présence : <Badge>{a.presence}</Badge></p>}
    </article>
  );
}

export default async function MonProgramme() {
  if (!supabaseActif) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-marine-900">Mon programme</h1>
        {activitesDemo.map((a) => <Activite key={a.id} a={a} />)}
      </div>
    );
  }
  const u = await utilisateurCourant();
  const fiche = u ? await maFiche(u.id) : null;
  if (!fiche) return <FicheNonReliee />;
  const debutDuJour = depuisSaisieLocale(`${jourLocal(dansJours(0))}T00:00`);
  // La base ne renvoie que les activités qui concernent ce choriste.
  const [aVenir, passees, presences] = await Promise.all([
    listerActivites({ depuis: debutDuJour }),
    listerActivites({ depuis: dansJours(-30), avant: debutDuJour, decroissant: true, limite: 10 }),
    presencesMembre(fiche.id),
  ]);
  const presence = new Map(presences.map((p) => [p.activiteId, p.statut]));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-marine-900">Mon programme</h1>
      {aVenir.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">Aucune activité prévue pour vous pour le moment.</p>
      ) : aVenir.map((a) => <Activite key={a.id} a={{ ...a, presence: presence.get(a.id) }} />)}
      {passees.length > 0 && (
        <>
          <h2 className="pt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Ces 30 derniers jours</h2>
          {passees.map((a) => <Activite key={a.id} a={{ ...a, presence: presence.get(a.id) }} />)}
        </>
      )}
    </div>
  );
}
