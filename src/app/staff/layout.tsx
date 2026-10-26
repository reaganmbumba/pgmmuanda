import { redirect } from "next/navigation";
import { StaffShell } from "@/components/layout/StaffShell";
import { BandeauDemo } from "@/components/ui/BandeauDemo";
import { utilisateurCourant } from "@/lib/auth/session";
import { LIBELLES_ROLES, estStaff } from "@/lib/auth/roles";
import { supabaseActif } from "@/lib/supabase/config";
import { ListeNotifications } from "@/components/ui/ListeNotifications";
import { mesNotifications } from "@/lib/notifications";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const u = await utilisateurCourant();
  if (supabaseActif && (!u || !estStaff(u.role))) redirect("/connexion");
  const notifications = await mesNotifications(15);
  return (
    <>
      {!supabaseActif && <BandeauDemo />}
      <StaffShell
        nonLues={notifications.nonLues}
        panneauNotifications={supabaseActif ? <ListeNotifications {...notifications} /> : undefined}
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
