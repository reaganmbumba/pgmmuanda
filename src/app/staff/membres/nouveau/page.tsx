import { redirect } from "next/navigation";
import { EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { peutGererMembres } from "@/lib/auth/roles";
import { lireOrganisation } from "@/lib/membres/depot";
import { supabaseActif } from "@/lib/supabase/config";
import { FormulaireMembre } from "../FormulaireMembre";

export const metadata = { title: "Nouveau membre" };

export default async function NouveauMembre() {
  if (!supabaseActif) redirect("/staff/membres");
  const moi = await exigerAcces("/staff/membres");
  if (!peutGererMembres(moi?.role)) redirect("/staff/membres");
  const organisation = await lireOrganisation();
  // Le responsable de paroisse n'inscrit que dans sa paroisse.
  if (moi?.role === "responsable_paroisse") {
    organisation.paroisses = organisation.paroisses.filter((p) => p.id === moi.paroisseId);
  }
  return (
    <>
      <EnTete titre="Nouveau membre" description="Inscription d'un choriste. Les champs marqués * sont obligatoires." />
      {organisation.paroisses.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm">
          Aucune paroisse n&apos;est enregistrée. Créez d&apos;abord les paroisses dans « Paroisses ».
        </p>
      ) : (
        <FormulaireMembre organisation={organisation} />
      )}
    </>
  );
}
