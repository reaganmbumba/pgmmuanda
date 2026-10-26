import { notFound, redirect } from "next/navigation";
import { EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { peutGererMembres } from "@/lib/auth/roles";
import { lireMembre, lireOrganisation } from "@/lib/membres/depot";
import { supabaseActif } from "@/lib/supabase/config";
import { FormulaireMembre } from "../../FormulaireMembre";

export const metadata = { title: "Modifier un membre" };

export default async function ModifierMembre({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseActif) redirect("/staff/membres");
  const { id } = await params;
  const moi = await exigerAcces("/staff/membres");
  if (!peutGererMembres(moi?.role)) redirect(`/staff/membres/${id}`);
  const [membre, organisation] = await Promise.all([lireMembre(id), lireOrganisation()]);
  if (!membre) notFound();
  if (moi?.role === "responsable_paroisse") {
    organisation.paroisses = organisation.paroisses.filter((p) => p.id === moi.paroisseId);
  }
  return (
    <>
      <EnTete titre={`Modifier ${membre.prenom} ${membre.nom}`} description={`Matricule ${membre.matricule} (non modifiable).`} />
      <FormulaireMembre membre={membre} organisation={organisation} />
    </>
  );
}
