import { notFound, redirect } from "next/navigation";
import { EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { lireOrganisation } from "@/lib/membres/depot";
import { lireActivite, lireCommissions } from "@/lib/programmes/depot";
import { peutModifierActivite, porteesActivite } from "@/lib/programmes/droits";
import { supabaseActif } from "@/lib/supabase/config";
import { FormulaireActivite } from "../../FormulaireActivite";

export const metadata = { title: "Modifier l'activité" };

export default async function ModifierActivite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const moi = await exigerAcces("/staff/programmes");
  if (!supabaseActif || !moi) redirect("/staff/programmes");
  const activite = await lireActivite(id);
  if (!activite) notFound();
  if (!peutModifierActivite(moi, activite)) redirect(`/staff/programmes/${id}`);
  const [organisation, commissions] = await Promise.all([lireOrganisation(), lireCommissions()]);
  return (
    <>
      <EnTete titre="Modifier l'activité" description={activite.titre} />
      <FormulaireActivite activite={activite} organisation={organisation} commissions={commissions}
        portees={porteesActivite(moi, organisation)}
        commissionFixe={moi.role === "responsable_commission" ? moi.commissionId : undefined} />
    </>
  );
}
