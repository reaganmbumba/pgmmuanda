import { redirect } from "next/navigation";
import { Bouton } from "@/components/ui/Bouton";
import { utilisateurCourant } from "@/lib/auth/session";
import { accueilPourRole } from "@/lib/auth/roles";
import { supabaseActif } from "@/lib/supabase/config";
import { FormulaireConnexion } from "./FormulaireConnexion";

export const metadata = { title: "Connexion" };

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string; erreur?: string }>;
}) {
  const { suite, erreur } = await searchParams;
  const u = await utilisateurCourant();
  if (u) redirect(accueilPourRole(u.role));

  return (
    <>
      <h1 className="text-2xl font-bold text-marine-900">Connexion</h1>
      <p className="mt-1 text-sm text-slate-500">
        Accédez à votre espace staff ou à votre espace choriste.
      </p>
      {erreur === "lien" && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          Ce lien n&apos;est plus valable. Demandez-en un nouveau.
        </p>
      )}
      <div className="mt-8">
        <FormulaireConnexion suite={suite} actif={supabaseActif} />
      </div>
      {!supabaseActif && (
        <div className="mt-10 rounded-2xl border border-dashed border-or-500/50 bg-or-100/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-or-600">
            Accès de démonstration (maquette)
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Bouton variante="secondaire" href="/staff" className="text-xs">
              Espace staff
            </Bouton>
            <Bouton variante="secondaire" href="/choriste" className="text-xs">
              Espace choriste
            </Bouton>
          </div>
        </div>
      )}
    </>
  );
}
