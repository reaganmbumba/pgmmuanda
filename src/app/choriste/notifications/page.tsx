import { ListeNotifications } from "@/components/ui/ListeNotifications";
import { formatDateHeure } from "@/lib/format";
import { mesNotifications } from "@/lib/notifications";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Notifications" };

// Exemples affichés uniquement en mode maquette : aucune action n'y est possible.
const EXEMPLES = [
  { titre: "Votre carte de choriste est disponible", date: "2026-10-20T09:30:00Z", lue: false },
  { titre: "Votre demande de correction a été acceptée", date: "2026-10-18T15:10:00Z", lue: false },
  { titre: "Votre statut de membre est maintenant : actif", date: "2026-10-12T11:00:00Z", lue: true },
];

export default async function MesNotifications() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-marine-900">Notifications</h1>
      <div className="rounded-2xl bg-white p-2 shadow-sm">
        {supabaseActif ? (
          <ListeNotifications {...await mesNotifications(50)} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {EXEMPLES.map((n) => (
              <li key={n.titre} className="flex items-start gap-3 px-3 py-3">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.lue ? "bg-transparent" : "bg-or-500"}`} aria-hidden />
                <span>
                  <span className={`block text-sm ${n.lue ? "text-slate-600" : "font-semibold text-marine-900"}`}>{n.titre}</span>
                  <span className="block text-xs text-slate-400">{formatDateHeure(n.date)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-center text-xs text-slate-400">
        Les notifications sont affichées dans l&apos;application. Aucun message WhatsApp ni SMS n&apos;est envoyé automatiquement.
      </p>
    </div>
  );
}
