import { MonCompte } from "@/components/compte/MonCompte";
import { utilisateurCourant } from "@/lib/auth/session";

export const metadata = { title: "Paramètres du compte" };

export default async function ParametresChoriste() {
  const moi = await utilisateurCourant();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-marine-900">Paramètres du compte</h1>
      <MonCompte nom={moi?.nom ?? "Grace Mavungu (démonstration)"} email={moi?.email ?? null} role={moi?.role ?? "choriste"} />
    </div>
  );
}
