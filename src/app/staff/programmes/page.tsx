import { ModulePrevu } from "@/components/ui/ModulePrevu";
import { entreeMenu } from "@/lib/navigation";
import { supabaseActif } from "@/lib/supabase/config";
import { CalendarPlus, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Bouton } from "@/components/ui/Bouton";
import { EnTete } from "@/components/ui/Carte";
import { activites } from "@/lib/demo-data";
import { exigerAcces } from "@/lib/auth/session";

export const metadata = { title: "Programmes" };

const jour = new Intl.DateTimeFormat("fr-FR", { day: "2-digit" });
const mois = new Intl.DateTimeFormat("fr-FR", { month: "short" });
const heure = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default async function PageProgrammes() {
  await exigerAcces("/staff/programmes");
  if (supabaseActif) return <ModulePrevu entree={entreeMenu("/staff/programmes")} />;
  return (
    <>
      <EnTete
        titre="Programmes"
        description="Activités planifiées de la PGM et des paroisses."
        actions={
          <>
            <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
              {["Liste", "Calendrier", "Cartes"].map((v, i) => (
                <span
                  key={v}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${i === 0 ? "bg-marine-900 text-white" : "text-slate-600"}`}
                >
                  {v}
                </span>
              ))}
            </div>
            <Bouton>
              <CalendarPlus className="size-4" aria-hidden /> Nouvelle activité
            </Bouton>
          </>
        }
      />
      <ul className="space-y-3">
        {activites.map((a) => {
          const d = new Date(a.debut);
          return (
            <li
              key={a.id}
              className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
            >
              <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-marine-900 py-2 text-white">
                <span className="text-2xl font-bold leading-none">{jour.format(d)}</span>
                <span className="text-xs uppercase text-or-400">{mois.format(d)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-marine-900">{a.titre}</p>
                  <Badge>{a.statut}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">{a.description}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{heure.format(d)}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{a.lieu}</span>
                  <span className="inline-flex items-center gap-1"><User className="size-3.5" aria-hidden />{a.responsable}</span>
                  <span>{a.commission}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
