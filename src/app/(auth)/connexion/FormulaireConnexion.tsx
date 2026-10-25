"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Bouton } from "@/components/ui/Bouton";

const champ =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-marine-700 focus:ring-4 focus:ring-marine-700/10";

export function FormulaireConnexion() {
  const [voir, setVoir] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(
          "Maquette : la connexion réelle sera branchée à Supabase à l'Étape 2. Utilisez les accès de démonstration ci-dessous.",
        );
      }}
    >
      <div>
        <label htmlFor="identifiant" className="text-sm font-medium text-slate-700">
          Identifiant ou adresse e-mail
        </label>
        <input id="identifiant" name="identifiant" autoComplete="username" required className={champ} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="mdp" className="text-sm font-medium text-slate-700">
            Mot de passe
          </label>
          <Link href="/mot-de-passe-oublie" className="text-xs font-medium text-marine-700 hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <div className="relative">
          <input
            id="mdp"
            name="mdp"
            type={voir ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${champ} pr-10`}
          />
          <button
            type="button"
            onClick={() => setVoir(!voir)}
            className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
            aria-label={voir ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {voir ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <Bouton type="submit" className="w-full">
        <LogIn className="size-4" aria-hidden /> Se connecter
      </Bouton>
      {message && (
        <p role="status" className="rounded-xl bg-or-100 p-3 text-xs text-or-600">
          {message}
        </p>
      )}
    </form>
  );
}
