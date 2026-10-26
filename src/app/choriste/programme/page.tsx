import { ModulePrevu } from "@/components/ui/ModulePrevu";
import { entreeMenu } from "@/lib/navigation";
import { supabaseActif } from "@/lib/supabase/config";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { activites } from "@/lib/demo-data";
import { formatDateHeure } from "@/lib/format";

export const metadata = { title: "Mon programme" };

export default function MonProgramme() {
  // En mode réel, pas de données de démonstration : le module arrive à son étape.
  if (supabaseActif) return <ModulePrevu entree={entreeMenu("/choriste/programme")} />;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-marine-900">Mon programme</h1>
      {activites.map((a) => (
        <article key={a.id} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-semibold text-marine-900">{a.titre}</h2>
            <Badge>{a.statut}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">{a.description}</p>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
            <CalendarDays className="size-4 text-or-500" aria-hidden /> {formatDateHeure(a.debut)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin className="size-4 text-or-500" aria-hidden /> {a.lieu}
          </p>
        </article>
      ))}
    </div>
  );
}
