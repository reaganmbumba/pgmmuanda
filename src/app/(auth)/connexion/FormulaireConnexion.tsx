"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import { connexion } from "../actions";

export function FormulaireConnexion({ suite, actif }: { suite?: string; actif: boolean }) {
  const [voir, setVoir] = useState(false);
  const [etat, action] = useActionState(connexion, undefined);
  const [messageMaquette, setMessageMaquette] = useState("");

  return (
    <form
      className="space-y-4"
      action={actif ? action : undefined}
      onSubmit={
        actif
          ? undefined
          : (e) => {
              e.preventDefault();
              setMessageMaquette(
                "Maquette : la base de données n'est pas configurée. Utilisez les accès de démonstration ci-dessous.",
              );
            }
      }
    >
      <input type="hidden" name="suite" value={suite ?? ""} />
      <div>
        <label htmlFor="identifiant" className="text-sm font-medium text-slate-700">
          Identifiant ou adresse e-mail
        </label>
        <input id="identifiant" name="identifiant" autoComplete="username" required className={classeChamp} />
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
            name="motDePasse"
            type={voir ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${classeChamp} pr-10`}
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
      <BoutonEnvoi>
        <LogIn className="size-4" aria-hidden /> Se connecter
      </BoutonEnvoi>
      <MessageFormulaire etat={actif ? etat : messageMaquette ? { erreur: messageMaquette } : undefined} />
    </form>
  );
}
