import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { FormulaireInscription, type Choix } from "./FormulaireInscription";

export const metadata = { title: "Inscription", robots: { index: false, follow: false } };

export default async function PageInscription({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  let choix: Choix | null = null;
  if (supabaseActif && /^[a-z0-9]{12,40}$/.test(code)) {
    const supabase = await creerClientServeur();
    const { data } = await supabase.rpc("inscription_formulaire", { p_code: code });
    choix = (data as Choix | null) ?? null;
  }

  if (!choix) {
    return (
      <>
        <h1 className="text-2xl font-bold text-marine-900">Lien non valable</h1>
        <p className="mt-3 text-slate-600">
          Ce lien d&apos;inscription ne marche plus. Demandez un nouveau lien à votre responsable de chorale ou de paroisse.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-marine-900">Inscription à la PGM</h1>
      <p className="mt-1 text-slate-600">
        Paix ! Remplissez vos informations et ajoutez votre photo. Le responsable vérifiera puis validera votre inscription.
      </p>
      <div className="mt-6"><FormulaireInscription code={code} choix={choix} /></div>
    </>
  );
}
