import { redirect } from "next/navigation";
import { EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { peutPublier } from "@/lib/auth/roles";
import { lireOrganisation } from "@/lib/membres/depot";
import { porteesAnnonce } from "@/lib/programmes/droits";
import { supabaseActif } from "@/lib/supabase/config";
import { FormulaireAnnonce } from "../FormulaireAnnonce";

export const metadata = { title: "Nouvelle annonce" };

export default async function NouvelleAnnonce() {
  const moi = await exigerAcces("/staff/communication");
  if (!supabaseActif || !moi || !peutPublier(moi.role)) redirect("/staff/communication");
  const organisation = await lireOrganisation();
  return (
    <>
      <EnTete titre="Nouvelle annonce" description="Communiqué, invitation, changement de programme, message urgent…" />
      <FormulaireAnnonce organisation={organisation} portees={porteesAnnonce(moi, organisation)} />
    </>
  );
}
