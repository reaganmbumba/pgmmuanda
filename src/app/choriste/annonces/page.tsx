import { Share2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { annonces } from "@/lib/demo-data";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Mes annonces" };

export default function MesAnnonces() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-marine-900">Mes annonces</h1>
      {annonces.map((a) => (
        <article key={a.id} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Badge>{a.type}</Badge>
            <span className="text-xs text-slate-400">{formatDate(a.date)}</span>
          </div>
          <h2 className="mt-2 font-semibold text-marine-900">{a.titre}</h2>
          <p className="mt-1 text-sm text-slate-600">{a.extrait}</p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${a.titre} — ${a.extrait}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-marine-700"
          >
            <Share2 className="size-4" aria-hidden /> Partager sur WhatsApp
          </a>
        </article>
      ))}
    </div>
  );
}
