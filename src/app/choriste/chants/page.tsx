import Link from "next/link";
import { Search } from "lucide-react";
import { ListeChants } from "@/components/chants/Chants";
import { utilisateurCourant } from "@/lib/auth/session";
import { chantsDemo } from "@/lib/demo-data";
import { maFiche } from "@/lib/membres/depot";
import { listerChants } from "@/lib/organisation/depot";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Mes chants et partitions" };

const simplifier = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default async function MesChants({ searchParams }: { searchParams: Promise<{ q?: string; tous?: string }> }) {
  if (!supabaseActif) {
    return (<div className="space-y-4"><h1 className="text-xl font-bold text-marine-900">Mes chants</h1><ListeChants chants={chantsDemo} /></div>);
  }
  const { q = "", tous } = await searchParams;
  const u = await utilisateurCourant();
  const fiche = u ? await maFiche(u.id) : null;
  const chants = await listerChants();
  // Par défaut : les chants de sa voix (et ceux pour toutes les voix)
  const maVoix = fiche?.voixCode;
  const filtres = chants
    .filter((c) => tous || !maVoix || c.voixCodes.length === 0 || c.voixCodes.includes(maVoix))
    .filter((c) => !q || simplifier(`${c.titre} ${c.auteur} ${c.paroles}`).includes(simplifier(q)));
  const onglet = (actif: boolean) => `flex-1 rounded-lg py-2 text-center text-sm font-medium ${actif ? "bg-marine-900 text-white" : "text-slate-600"}`;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-marine-900">Mes chants</h1>
      {maVoix && (
        <div className="flex rounded-xl bg-white p-1 shadow-sm">
          <Link href="/choriste/chants" className={onglet(!tous)}>Ma voix ({fiche!.voix})</Link>
          <Link href="/choriste/chants?tous=1" className={onglet(!!tous)}>Tous les chants</Link>
        </div>
      )}
      <form className="flex gap-2">
        {tous && <input type="hidden" name="tous" value="1" />}
        <label className="relative flex-1">
          <span className="sr-only">Rechercher un chant</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Chercher un chant…" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pr-3 pl-10 text-base" />
        </label>
        <button className="min-h-12 rounded-xl bg-marine-900 px-4 font-semibold text-white">OK</button>
      </form>
      {filtres.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          {q ? "Aucun chant trouvé." : "Aucun chant dans le répertoire pour le moment."}
        </p>
      ) : <ListeChants chants={filtres} base="/choriste/chants" />}
    </div>
  );
}
