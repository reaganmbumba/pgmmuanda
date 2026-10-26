import Link from "next/link";
import { ChevronRight, ScanLine } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Carte, EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { formatDateHeure } from "@/lib/format";
import { lireActivite, listerActivites } from "@/lib/programmes/depot";
import { dansJours } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { Pointage } from "./Pointage";

export const metadata = { title: "Présences" };

export default async function PagePresences({ searchParams }: { searchParams: Promise<{ activite?: string }> }) {
  const moi = await exigerAcces("/staff/presences");
  if (!supabaseActif || !moi) {
    return (
      <>
        <EnTete titre="Présences" description="Pointage des présences par QR code ou par matricule." />
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          En mode maquette, le pointage est désactivé : il fonctionne une fois la base de données configurée.
        </p>
      </>
    );
  }
  const { activite: id } = await searchParams;
  const activite = id && /^[0-9a-f-]{36}$/.test(id) ? await lireActivite(id) : null;

  if (activite) {
    return (
      <>
        <EnTete titre={`Pointage : ${activite.titre}`} description={formatDateHeure(activite.debut)}
          actions={moi.role !== "controleur" ? (
            <Link href={`/staff/programmes/${activite.id}`} className="text-sm font-medium text-marine-700 hover:underline">Voir la feuille de présence</Link>
          ) : undefined} />
        {activite.statutCode === "annulee"
          ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Cette activité est annulée : aucun pointage possible.</p>
          : <Pointage activite={activite.id} />}
        <p className="mt-6 text-sm"><Link href="/staff/presences" className="text-marine-700 hover:underline">← Choisir une autre activité</Link></p>
      </>
    );
  }

  // Activités de la semaine passée et des deux semaines à venir
  const proches = (await listerActivites({ depuis: dansJours(-7), avant: dansJours(14) })).filter((a) => a.statutCode !== "annulee");

  return (
    <>
      <EnTete titre="Présences" description="Choisissez l'activité, puis scannez les cartes des choristes à leur arrivée." />
      <Carte titre="Activités proches">
        {proches.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune activité entre la semaine passée et les deux semaines à venir.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {proches.map((a) => (
              <li key={a.id}>
                <Link href={`/staff/presences?activite=${a.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50">
                  <span className="rounded-lg bg-marine-50 p-2 text-marine-800"><ScanLine className="size-4" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-marine-900">{a.titre}</span>
                    <span className="block text-sm text-slate-500">{formatDateHeure(a.debut)}{a.lieu ? ` · ${a.lieu}` : ""}</span>
                  </span>
                  <Badge>{a.statut}</Badge>
                  <ChevronRight className="size-4 text-slate-300" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Carte>
    </>
  );
}
