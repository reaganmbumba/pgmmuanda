import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FicheChant } from "@/components/chants/Chants";
import { ListeFichiers } from "@/components/documents/Fichiers";
import { listerDocuments } from "@/lib/documents/depot";
import { lireChant } from "@/lib/organisation/depot";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Chant" };

export default async function Chant({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseActif) redirect("/choriste/chants");
  const { id } = await params;
  const c = await lireChant(id);
  if (!c) notFound();
  const fichiers = await listerDocuments({ chantId: id });
  return (
    <div className="space-y-4">
      <Link href="/choriste/chants" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-marine-700"><ArrowLeft className="size-4" aria-hidden /> Mes chants</Link>
      <div>
        <h1 className="text-2xl font-bold text-marine-900">{c.titre}</h1>
        {c.auteur && <p className="text-sm text-slate-500">{c.auteur}</p>}
      </div>
      {fichiers.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Partitions et enregistrements</h2>
          <ListeFichiers documents={fichiers} grand />
        </section>
      )}
      <FicheChant chant={c} />
    </div>
  );
}
