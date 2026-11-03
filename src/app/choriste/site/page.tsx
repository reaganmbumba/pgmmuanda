/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CalendarDays, ChevronRight, Globe, House, MapPin, Play, TvMinimalPlay } from "lucide-react";
import { PUBLICATIONS, RUBRIQUES, type Publication } from "@/components/site/SitePublic";
import { dateLongue, lireElements, urlFichier, type ElementSite } from "@/lib/site/contenu";

export const metadata = { title: "Le site de la PGM" };

const aujourdhui = () => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10); // heure de Muanda

/*
 * Tout le contenu du site public (www.pgmmuanda.com), lisible sans quitter
 * l'espace membre : actualités, soirées, cas sociaux, pionniers, et toutes les rubriques.
 */
export default async function SiteDansEspace() {
  const [actualites, soirees, sociaux, pionniers] = await Promise.all([
    lireElements("actualite"), lireElements("soiree"), lireElements("social"), lireElements("pionnier"),
  ]);
  const aVenir = soirees.filter((s) => s.date && s.date >= aujourdhui()).reverse();
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-marine-900 p-5 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 size-36 rounded-full border-8 border-or-500/20" />
        <p className="flex items-center gap-2 text-sm text-or-400"><Globe className="size-4" aria-hidden /> www.pgmmuanda.com</p>
        <h1 className="mt-1 text-2xl font-bold">Le site de la PGM</h1>
        <p className="mt-1 text-sm text-marine-100/80">Tout ce qui est publié sur le site, ici dans votre espace.</p>
        <Link href="/" className="or-degrade mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl py-2.5 text-base font-semibold text-marine-950">
          <House className="size-5" aria-hidden /> Page d&apos;accueil du site
        </Link>
      </section>

      <Link href="/direct" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm active:bg-slate-50">
        <span className="rounded-xl bg-red-50 p-2.5 text-red-600"><TvMinimalPlay className="size-6" aria-hidden /></span>
        <span className="flex-1">
          <span className="block font-semibold text-marine-900">PGM Muanda TV</span>
          <span className="block text-xs text-slate-500">Nos vidéos et nos directs</span>
        </span>
        <Play className="size-5 text-red-600" aria-hidden />
      </Link>

      <Liste titre="Actualités et communiqués" liste={actualites} vide="Aucune actualité pour le moment." />
      {aVenir.length > 0 && <Liste titre="Soirées musicales à venir" liste={aVenir} />}

      <section>
        <h2 className="mb-3 font-semibold text-marine-900">Toutes les rubriques du site</h2>
        <div className="grid grid-cols-2 gap-3">
          {RUBRIQUES.filter((r) => r.href !== "/connexion").map(({ href, nom, Icone }) => (
            <Link key={href} href={href} className="flex min-h-16 items-center gap-3 rounded-2xl bg-white p-3 shadow-sm active:bg-slate-50">
              <span className="rounded-xl bg-marine-50 p-2.5 text-marine-800"><Icone className="size-6" aria-hidden /></span>
              <span className="text-sm font-semibold leading-tight text-marine-900">{nom}</span>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">Sur le site, le bouton « Mon espace » en haut vous ramène ici.</p>
      </section>

      {sociaux.length > 0 && <Liste titre="Cas sociaux" liste={sociaux.slice(0, 3)} tout="/cas-sociaux" />}
      {pionniers.length > 0 && <Liste titre="Les pionniers" liste={pionniers.slice(0, 3)} tout="/pionniers" />}
    </div>
  );
}

function Liste({ titre, liste, vide, tout }: { titre: string; liste: ElementSite[]; vide?: string; tout?: string }) {
  if (liste.length === 0 && !vide) return null;
  return (
    <section className="rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between p-4 pb-2">
        <h2 className="font-semibold text-marine-900">{titre}</h2>
        {tout && <Link href={tout} className="text-sm font-medium text-marine-700">Tout voir</Link>}
      </div>
      {liste.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-slate-500">{vide}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {liste.map((e) => <li key={e.id}><Ligne e={e} /></li>)}
        </ul>
      )}
    </section>
  );
}

function Ligne({ e }: { e: ElementSite }) {
  const etiquette = PUBLICATIONS[e.rubrique as Publication]?.etiquette;
  return (
    <Link href={`/choriste/site/${e.id}`} className="flex items-center gap-3 p-4 active:bg-slate-50">
      <img src={e.image ? urlFichier(e.image) : "/logo-pgm.png"} alt="" loading="lazy"
        className={`size-16 shrink-0 rounded-xl ${e.image ? "object-cover" : "bg-marine-50 object-contain p-2"}`} />
      <span className="min-w-0 flex-1">
        {etiquette && <span className="text-[11px] font-semibold uppercase tracking-wide text-or-600">{etiquette}</span>}
        <span className="block font-medium leading-snug text-marine-900">{e.titre}</span>
        {e.date && <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><CalendarDays className="size-3.5" aria-hidden />{dateLongue(e.date)}</span>}
        {e.rubrique === "soiree" && e.sousTitre && <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="size-3.5" aria-hidden />{e.sousTitre}</span>}
      </span>
      <ChevronRight className="size-4 shrink-0 text-slate-300" aria-hidden />
    </Link>
  );
}

