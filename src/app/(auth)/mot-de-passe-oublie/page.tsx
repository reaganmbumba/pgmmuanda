import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormulaireOubli } from "./FormulaireOubli";

export const metadata = { title: "Mot de passe oublié" };

export default function MotDePasseOublie() {
  return (
    <>
      <Link href="/connexion" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-marine-900">
        <ArrowLeft className="size-4" aria-hidden /> Retour à la connexion
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-marine-900">Mot de passe oublié</h1>
      <p className="mt-1 text-sm text-slate-500">
        Saisissez votre adresse e-mail : vous recevrez un lien pour choisir un nouveau mot de passe.
      </p>
      <FormulaireOubli />
    </>
  );
}
