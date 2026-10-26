import { MonCompte } from "@/components/compte/MonCompte";
import { EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";

export const metadata = { title: "Paramètres" };

export default async function ParametresStaff() {
  const moi = await exigerAcces("/staff/parametres");
  return (
    <>
      <EnTete titre="Paramètres" description="Votre compte et votre mot de passe." />
      <div className="max-w-xl">
        <MonCompte nom={moi?.nom ?? "Administrateur (démonstration)"} email={moi?.email ?? null} role={moi?.role ?? "super_admin"} />
      </div>
    </>
  );
}
