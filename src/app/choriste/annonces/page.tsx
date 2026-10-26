import { Share2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { annonces as annoncesDemo } from "@/lib/demo-data";
import { formatDate } from "@/lib/format";
import { listerAnnonces } from "@/lib/programmes/depot";
import { lienWhatsApp } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Mes annonces" };

type Vue = { id: string; titre: string; type: string; texte: string; date: string };

function Annonce({ a }: { a: Vue }) {
  return (
    <article id={a.id} className={`rounded-2xl bg-white p-4 shadow-sm ${a.type === "Urgente" ? "ring-2 ring-red-200" : ""}`} data-annonce={a.titre}>
      <div className="flex items-center justify-between">
        <Badge>{a.type}</Badge>
        <span className="text-xs text-slate-400">{formatDate(a.date)}</span>
      </div>
      <h2 className="mt-2 font-semibold text-marine-900">{a.titre}</h2>
      <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{a.texte}</p>
      <a href={lienWhatsApp(`*${a.titre}*\n${a.texte}`)} target="_blank" rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-marine-700">
        <Share2 className="size-4" aria-hidden /> Partager sur WhatsApp
      </a>
    </article>
  );
}

export default async function MesAnnonces() {
  // La base ne renvoie que les annonces qui concernent ce choriste, non archivées.
  const liste: Vue[] = supabaseActif
    ? (await listerAnnonces({ limite: 50 })).map((a) => ({ id: a.id, titre: a.titre, type: a.type, texte: a.contenu, date: a.date }))
    : annoncesDemo.map((a) => ({ id: a.id, titre: a.titre, type: a.type, texte: a.extrait, date: a.date }));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-marine-900">Mes annonces</h1>
      {liste.length === 0
        ? <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">Aucune annonce pour le moment.</p>
        : liste.map((a) => <Annonce key={a.id} a={a} />)}
    </div>
  );
}
