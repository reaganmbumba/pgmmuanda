import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FicheChant } from "@/components/chants/Chants";
import { lireChant } from "@/lib/organisation/depot";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Chant" };

export default async function Chant({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseActif) redirect("/choriste/chants");
  const { id } = await params;
  const c = await lireChant(id);
  if (!c) notFound();
  return (
    <div className="space-y-4">
      <Link href="/choriste/chants" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-marine-700"><ArrowLeft className="size-4" aria-hidden /> Mes chants</Link>
      <div>
        <h1 className="text-2xl font-bold text-marine-900">{c.titre}</h1>
        {c.auteur && <p className="text-sm text-slate-500">{c.auteur}</p>}
      </div>
      <FicheChant chant={c} />
    </div>
  );
}
