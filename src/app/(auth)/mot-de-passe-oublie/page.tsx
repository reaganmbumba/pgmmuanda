import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Bouton } from "@/components/ui/Bouton";

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
      <form className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-700">Adresse e-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-marine-700 focus:ring-4 focus:ring-marine-700/10"
          />
        </div>
        <Bouton type="submit" className="w-full">Envoyer le lien</Bouton>
      </form>
    </>
  );
}
