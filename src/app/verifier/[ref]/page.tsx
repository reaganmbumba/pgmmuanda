import { Logo } from "@/components/Logo";
import { ResultatVerification } from "@/components/carte/ResultatVerification";
import { BandeauDemo } from "@/components/ui/BandeauDemo";
import { trouverParReference } from "@/lib/demo-data";

export const metadata = { title: "Vérification d'une carte", robots: { index: false } };

export default async function PageVerifier({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const membre = trouverParReference(ref);
  return (
    <>
      <BandeauDemo />
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
