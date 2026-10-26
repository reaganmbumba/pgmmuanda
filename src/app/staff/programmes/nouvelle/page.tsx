import { redirect } from "next/navigation";
import { EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { peutGererProgramme } from "@/lib/auth/roles";
import { lireOrganisation } from "@/lib/membres/depot";
import { lireCommissions } from "@/lib/programmes/depot";
import { porteesActivite } from "@/lib/programmes/droits";
import { supabaseActif } from "@/lib/supabase/config";
import { FormulaireActivite } from "../FormulaireActivite";

export const metadata = { title: "Nouvelle activité" };

export default async function NouvelleActivite() {
  const moi = await exigerAcces("/staff/programmes");
  if (!supabaseActif || !moi) redirect("/staff/programmes");
  if (!peutGererProgramme(moi.role)) redirect("/staff/programmes");
  const [organisation, commissions] = await Promise.all([lireOrganisation(), lireCommissions()]);
  return (
    <>
      <EnTete titre="Nouvelle activité" description="Répétition, réunion, culte, concert, formation…" />
      <FormulaireActivite organisation={organisation} commissions={commissions}
        portees={porteesActivite(moi, organisation)}
        commissionFixe={moi.role === "responsable_commission" ? moi.commissionId : undefined} />
    </>
  );
}
