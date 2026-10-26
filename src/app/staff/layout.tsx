import { redirect } from "next/navigation";
import { StaffShell } from "@/components/layout/StaffShell";
import { BandeauDemo } from "@/components/ui/BandeauDemo";
import { utilisateurCourant } from "@/lib/auth/session";
import { LIBELLES_ROLES, estStaff } from "@/lib/auth/roles";
import { supabaseActif } from "@/lib/supabase/config";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const u = await utilisateurCourant();
  if (supabaseActif && (!u || !estStaff(u.role))) redirect("/connexion");
  return (
    <>
      <BandeauDemo />
      <StaffShell
        utilisateur={
          u
            ? { nom: u.nom, libelleRole: LIBELLES_ROLES[u.role], role: u.role }
            : { nom: "Présidence PGM", libelleRole: "Administrateur (démo)", role: "super_admin" }
        }
      >
        {children}
      </StaffShell>
    </>
  );
}
