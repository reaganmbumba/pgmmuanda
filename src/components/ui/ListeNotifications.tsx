import { CheckCheck } from "lucide-react";
import { ouvrirNotification, toutMarquerLu } from "@/app/notifications/actions";
import { formatDateHeure } from "@/lib/format";
import type { Notification } from "@/lib/notifications";

export function ListeNotifications({ liste, nonLues }: { liste: Notification[]; nonLues: number }) {
  return (
    <div>
      {nonLues > 0 && (
        <form action={toutMarquerLu} className="mb-2 flex justify-end px-3">
          <button type="submit" className="inline-flex items-center gap-1.5 text-xs font-medium text-marine-700 hover:underline">
            <CheckCheck className="size-3.5" aria-hidden /> Tout marquer comme lu
          </button>
        </form>
      )}
      {liste.length === 0 ? (
        <p className="p-4 text-center text-sm text-slate-500">Aucune notification.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {liste.map((n) => (
            <li key={n.id}>
              <form action={ouvrirNotification}>
                <input type="hidden" name="id" value={n.id} />
                <input type="hidden" name="lien" value={n.lien ?? ""} />
                <button type="submit" className={`flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-slate-50 ${n.lue ? "" : "bg-or-100/30"}`}>
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.lue ? "bg-transparent" : "bg-or-500"}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${n.lue ? "text-slate-600" : "font-semibold text-marine-900"}`}>{n.titre}</span>
                    <span className="block text-xs text-slate-400">{formatDateHeure(n.date)}</span>
                  </span>
                  {!n.lue && <span className="sr-only">non lue</span>}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
