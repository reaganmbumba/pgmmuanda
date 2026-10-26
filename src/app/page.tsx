import { redirect } from "next/navigation";
import { utilisateurCourant } from "@/lib/auth/session";
import { accueilPourRole } from "@/lib/auth/roles";

export default async function Accueil() {
  const u = await utilisateurCourant();
  redirect(u ? accueilPourRole(u.role) : "/connexion");
}
