import { redirect } from "next/navigation";
import { ChoristeShell } from "@/components/layout/ChoristeShell";
import { BandeauDemo } from "@/components/ui/BandeauDemo";
import { utilisateurCourant } from "@/lib/auth/session";
import { mesNotifications } from "@/lib/notifications";
import { supabaseActif } from "@/lib/supabase/config";

// Nombre fictif de notifications non lues, affiché uniquement en mode maquette.
const NON_LUES_DEMO = 2;

export default async function ChoristeLayout({ children }: { children: React.ReactNode }) {
  let nonLues = NON_LUES_DEMO;
  if (supabaseActif) {
    const u = await utilisateurCourant();
    if (!u || u.role !== "choriste") redirect("/connexion");
    nonLues = (await mesNotifications(1)).nonLues;
  }
  return (
    <>
      {!supabaseActif && <BandeauDemo />}
      <ChoristeShell nonLues={nonLues}>{children}</ChoristeShell>
    </>
  );
}
