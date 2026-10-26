import { redirect } from "next/navigation";
import { ChoristeShell } from "@/components/layout/ChoristeShell";
import { BandeauDemo } from "@/components/ui/BandeauDemo";
import { utilisateurCourant } from "@/lib/auth/session";
import { supabaseActif } from "@/lib/supabase/config";

export default async function ChoristeLayout({ children }: { children: React.ReactNode }) {
  if (supabaseActif) {
    const u = await utilisateurCourant();
    if (!u || u.role !== "choriste") redirect("/connexion");
  }
  return (
    <>
      <BandeauDemo />
      <ChoristeShell>{children}</ChoristeShell>
    </>
  );
}
