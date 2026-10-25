import { Badge } from "@/components/ui/Badge";
import { mesPresences } from "@/lib/demo-data";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Mes présences" };

export default function MesPresences() {
  const presents = mesPresences.filter((p) => p.statut === "Présent").length;
  const taux = Math.round((presents / mesPresences.length) * 100);
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-marine-900">Mes présences</h1>
      <div className="rounded-2xl bg-marine-900 p-5 text-white">
        <p className="text-sm text-marine-100/80">Taux de présence sur 30 jours</p>
        <p className="mt-1 text-4xl font-bold text-or-400">{taux} %</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="or-degrade h-full rounded-full" style={{ width: `${taux}%` }} />
        </div>
      </div>
      <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm">
        {mesPresences.map((p) => (
          <li key={p.date + p.activite} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-marine-900">{p.activite}</p>
              <p className="text-xs text-slate-400">{formatDate(p.date)}</p>
            </div>
            <Badge>{p.statut}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
