import { redirect } from "next/navigation";
import { utilisateurCourant } from "@/lib/auth/session";
import { accueilPourRole } from "@/lib/auth/roles";
import { AccueilSite } from "@/components/site/SitePublic";

// Un membre connecté va directement à son espace, comme avant ;
// les visiteurs voient le site public de l'antenne.
export default async function Accueil() {
  const u = await utilisateurCourant();
  if (u) redirect(accueilPourRole(u.role));
  return <AccueilSite />;
}
