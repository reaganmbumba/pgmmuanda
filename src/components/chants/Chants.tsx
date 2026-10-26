import Link from "next/link";
import { ChevronRight, ExternalLink, FileMusic, Headphones, Music } from "lucide-react";
import type { Chant } from "@/lib/organisation/depot";

/** Liste du répertoire (commune au staff et aux choristes). */
export function ListeChants({ chants, base }: { chants: Pick<Chant, "id" | "titre" | "auteur" | "langue" | "voix" | "lienPartition" | "lienAudio">[]; base?: string }) {
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {chants.map((c) => {
        const contenu = (
          <>
            <span className="rounded-xl bg-or-100/70 p-2.5 text-or-600"><Music className="size-5" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-marine-900">{c.titre}</p>
              <p className="text-xs text-slate-500">{[c.langue, c.auteur, c.voix].filter(Boolean).join(" · ")}</p>
            </div>
            <span className="flex gap-1.5 text-slate-400">
              {c.lienPartition && <FileMusic className="size-4" aria-label="Partition disponible" />}
              {c.lienAudio && <Headphones className="size-4" aria-label="Enregistrement disponible" />}
            </span>
            {base && <ChevronRight className="size-5 text-slate-300" aria-hidden />}
          </>
        );
        return (
          <li key={c.id} data-chant={c.titre}>
            {base ? <Link href={`${base}/${c.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-slate-50">{contenu}</Link>
              : <div className="flex min-h-16 items-center gap-3 px-4 py-3">{contenu}</div>}
          </li>
        );
      })}
    </ul>
  );
}

/** Paroles et liens d'un chant, en grand pour être lus pendant la répétition. */
export function FicheChant({ chant }: { chant: Chant }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        {[chant.langue, chant.categorie, chant.voix].filter(Boolean).map((t) => (
          <span key={t} className="rounded-full bg-marine-50 px-2.5 py-1 font-medium text-marine-800">{t}</span>
        ))}
      </div>
      {(chant.lienPartition || chant.lienAudio) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {chant.lienPartition && (
            <a href={chant.lienPartition} target="_blank" rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-marine-900 px-4 font-semibold text-white hover:bg-marine-800">
              <FileMusic className="size-5" aria-hidden /> Ouvrir la partition <ExternalLink className="size-3.5 opacity-70" aria-hidden />
            </a>
          )}
          {chant.lienAudio && (
            <a href={chant.lienAudio} target="_blank" rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 font-semibold text-marine-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
              <Headphones className="size-5" aria-hidden /> Écouter <ExternalLink className="size-3.5 opacity-70" aria-hidden />
            </a>
          )}
        </div>
      )}
      {chant.paroles ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Paroles</h2>
          <p className="whitespace-pre-line text-lg leading-relaxed text-marine-950">{chant.paroles}</p>
        </section>
      ) : <p className="text-sm text-slate-500">Les paroles n&apos;ont pas encore été saisies.</p>}
    </div>
  );
}
