import { Carte, EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { listerInscriptions, lireLien } from "@/lib/inscriptions/depot";
import { listerMembres, lireOrganisation } from "@/lib/membres/depot";
import { construireRapport, texteRapport } from "@/lib/rapports/inscrits";
import { supabaseActif, URL_SITE } from "@/lib/supabase/config";
import { CopierRapport } from "./CopierRapport";

export const metadata = { title: "Rapport des inscrits" };

export default async function PageRapportInscrits() {
  const moi = await exigerAcces("/staff/rapports/inscrits");
  if (!supabaseActif || !moi) {
    return (
      <>
        <EnTete titre="Rapport des inscrits" />
        <Carte><p className="text-sm text-slate-600">Disponible quand Supabase est configuré.</p></Carte>
      </>
    );
  }
  const [membres, organisation, inscriptions, lien] = await Promise.all([
    listerMembres(), lireOrganisation(), listerInscriptions().catch(() => ({ enAttente: [], traitees: [] })),
    lireLien().catch(() => null),
  ]);
  const reels = membres.filter((m) => !m.estDemo);
  const chorales = organisation.chorales.filter((c) => !c.estDemo).map((c) => c.nom);
  const rapport = construireRapport(reels, chorales, inscriptions.enAttente.length);
  const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Kinshasa" }).format(new Date());
  const texte = texteRapport(rapport, date, lien?.ouvert ? `${URL_SITE}/inscription/${lien.code}` : null);

  return (
    <>
      <EnTete titre="Rapport des inscrits"
        description="Les membres enregistrés, regroupés par chorale, avec le total en chiffres. Toujours à jour : copiez-le et publiez-le." />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          ["Total des inscrits", rapport.total],
          ["Chorales avec inscrits", rapport.groupes.length],
          ["Chorales sans inscrit", rapport.vides.length],
          ["Inscriptions à valider", rapport.enAttente],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{l}</p>
            <p className="mt-2 text-3xl font-bold text-marine-900">{v}</p>
          </div>
        ))}
      </div>
      <Carte titre="Texte à publier" className="mt-6">
        <div className="space-y-4">
          <CopierRapport texte={texte} />
          <pre className="whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 font-sans text-sm leading-relaxed text-slate-800 ring-1 ring-slate-200">{texte}</pre>
        </div>
      </Carte>
      <p className="mt-4 text-xs text-slate-400">Les fiches archivées et les comptes sans chorale (administration) ne sont pas comptés. Les inscriptions par lien sont comptées dès qu&apos;elles sont acceptées.</p>
    </>
  );
}
