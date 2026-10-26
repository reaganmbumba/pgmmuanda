import Link from "next/link";
import { Archive, Inbox, UserPlus } from "lucide-react";
import { Bouton } from "@/components/ui/Bouton";
import { EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { peutGererMembres } from "@/lib/auth/roles";
import { listerMembres, lireDemandes } from "@/lib/membres/depot";
import { membres as membresDemo, paroisses as paroissesDemo } from "@/lib/demo-data";
import { supabaseActif } from "@/lib/supabase/config";
import { TableMembres } from "./TableMembres";

export const metadata = { title: "Membres" };

export default async function PageMembres({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  if (!supabaseActif) {
    return (
      <>
        <EnTete titre="Membres" description="Fiches des choristes de toutes les paroisses de Muanda."
          actions={<Bouton><UserPlus className="size-4" aria-hidden /> Nouveau membre</Bouton>} />
        <TableMembres membres={membresDemo} paroisses={paroissesDemo} />
      </>
    );
  }

  const moi = await exigerAcces("/staff/membres");
  const archives = (await searchParams).vue === "archives";
  const [membres, demandes] = await Promise.all([listerMembres({ archives }), lireDemandes({ enAttente: true })]);
  const paroisses = [...new Set(membres.map((m) => m.paroisse))].sort();
  const gestion = peutGererMembres(moi?.role);

  return (
    <>
      <EnTete
        titre={archives ? "Membres archivés" : "Membres"}
        description={archives ? "Fiches archivées : elles restent consultables et peuvent être restaurées." : "Fiches des choristes de votre périmètre."}
        actions={
          <div className="flex flex-wrap gap-2">
            <Bouton variante="secondaire" href={archives ? "/staff/membres" : "/staff/membres?vue=archives"}>
              <Archive className="size-4" aria-hidden /> {archives ? "Membres actuels" : "Archives"}
            </Bouton>
            {gestion && !archives && (
              <Bouton href="/staff/membres/nouveau"><UserPlus className="size-4" aria-hidden /> Nouveau membre</Bouton>
            )}
          </div>
        }
      />
      {gestion && demandes.length > 0 && (
        <section className="mb-5 rounded-2xl border border-or-400/40 bg-or-100/40 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-marine-900">
            <Inbox className="size-4" aria-hidden />
            {demandes.length} demande{demandes.length > 1 ? "s" : ""} de correction en attente
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {demandes.slice(0, 5).map((d) => (
              <li key={d.id}>
                <Link href={`/staff/membres/${d.membreId}#demandes`} className="text-marine-800 hover:underline">
                  {d.membre} ({d.matricule})
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {membres.length === 0 && !archives ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-marine-900">Aucun membre enregistré pour l&apos;instant.</p>
          <p className="mt-1 text-sm text-slate-500">
            Commencez par créer les paroisses et leurs chorales, puis inscrivez les membres.
          </p>
          {gestion && (
            <div className="mt-4 flex justify-center gap-2">
              <Bouton variante="secondaire" href="/staff/paroisses">Paroisses et chorales</Bouton>
              <Bouton href="/staff/membres/nouveau"><UserPlus className="size-4" aria-hidden /> Nouveau membre</Bouton>
            </div>
          )}
        </div>
      ) : (
        <TableMembres membres={membres} paroisses={paroisses} lienExport={`/staff/membres/export${archives ? "?vue=archives" : ""}`} />
      )}
    </>
  );
}
