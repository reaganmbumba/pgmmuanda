import { Logo } from "@/components/Logo";
import { depuisMembreDemo, ResultatVerification, type CarteVerifiee } from "@/components/carte/ResultatVerification";
import { BandeauDemo } from "@/components/ui/BandeauDemo";
import { trouverParReference } from "@/lib/demo-data";
import { supabaseActif } from "@/lib/supabase/config";
import { verifierReference } from "@/lib/cartes/verification";

async function verifier(ref: string): Promise<CarteVerifiee | undefined> {
  if (!supabaseActif) return depuisMembreDemo(trouverParReference(ref));
  return verifierReference(decodeURIComponent(ref));
}

export const metadata = { title: "Vérification d'une carte", robots: { index: false } };

export default async function PageVerifier({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const membre = await verifier(ref);
  return (
    <>
      {!supabaseActif && <BandeauDemo />}
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-8">
        <div className="mb-6 flex justify-center">
          <Logo size={48} avecTexte />
        </div>
        <h1 className="mb-4 text-center text-lg font-semibold text-marine-900">
          Vérification d&apos;une carte de choriste
        </h1>
        <ResultatVerification membre={membre} />
        <p className="mt-6 text-center text-xs text-slate-400">
          Les informations personnelles ne sont jamais affichées sur cette page publique.
        </p>
      </main>
    </>
  );
}
