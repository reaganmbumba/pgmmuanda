/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { Partage } from "@/components/site/Partage";
import { PUBLICATIONS, annonce, avecLiens, lienPublication, type Publication } from "@/components/site/SitePublic";
import { dateLongue, lireElement, paragraphes, urlFichier } from "@/lib/site/contenu";
import "@/components/site/site-public.css";

export const metadata = { title: "Le site de la PGM" };

/** Une publication du site (actualité, soirée, cas social, pionnier), lue dans l'espace membre. */
export default async function PublicationDansEspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await lireElement(id);
  if (!e || !e.publie || !(e.rubrique in PUBLICATIONS)) notFound();
  const pub = PUBLICATIONS[e.rubrique as Publication];
  const ps = paragraphes(e.texte);
  const milieu = Math.ceil(ps.length / 2);
  return (
    <article className="space-y-4">
      <Link href="/choriste/site" className="inline-flex items-center gap-1.5 text-sm font-medium text-marine-700">
        <ArrowLeft className="size-4" aria-hidden /> Le site de la PGM
      </Link>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-or-600">{pub.etiquette}</span>
        <h1 className="mt-1 text-xl font-bold leading-snug text-marine-900">{e.titre}</h1>
        {e.date && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <CalendarDays className="size-4" aria-hidden />{e.rubrique === "soiree" ? "" : "Muanda, le "}{dateLongue(e.date)}
          </p>
        )}
        {e.sousTitre && (e.rubrique === "soiree"
          ? <p className="flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="size-4" aria-hidden />{e.sousTitre}</p>
          : <p className="mt-3 font-medium text-marine-800">{e.sousTitre}</p>)}
        {e.image && <img src={urlFichier(e.image)} alt="" className="mt-4 w-full rounded-xl" />}
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-slate-700 [&_a]:font-medium [&_a]:text-marine-700 [&_a]:underline">
          {ps.map((p, i) => (
            <div key={i} className="space-y-3">
              <p>{avecLiens(p)}</p>
              {i === milieu - 1 && (e.photos ?? []).map((src) => <img key={src} src={urlFichier(src)} alt="" loading="lazy" className="w-full rounded-xl" />)}
            </div>
          ))}
        </div>
        {e.rubrique === "actualite" && (
          <p className="mt-5 border-t border-slate-100 pt-3 text-sm text-slate-500">
            <b className="block text-marine-900">La Présidence de la PGM Antenne de Muanda</b>EBNM KCC · Muanda
          </p>
        )}
      </div>
      <div className="site-pgm rounded-2xl bg-white p-4 shadow-sm" style={{ paddingBottom: 16, fontSize: 16, background: "#fff" }}>
        <Partage texte={annonce(e)} chemin={lienPublication(e)} image={e.image ? urlFichier(e.image) : null} />
      </div>
      <Link href={lienPublication(e)} className="flex items-center justify-center gap-2 text-sm font-medium text-marine-700">
        <ExternalLink className="size-4" aria-hidden /> Voir sur le site public
      </Link>
    </article>
  );
}
