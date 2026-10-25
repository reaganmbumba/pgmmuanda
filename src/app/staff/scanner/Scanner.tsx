"use client";

import { useState } from "react";
import { Camera, Search } from "lucide-react";
import { ResultatVerification } from "@/components/carte/ResultatVerification";
import { Bouton } from "@/components/ui/Bouton";
import { trouverParMatricule } from "@/lib/demo-data";
import type { Membre } from "@/lib/types";

export function Scanner() {
  const [matricule, setMatricule] = useState("");
  const [resultat, setResultat] = useState<{ membre?: Membre } | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="relative flex aspect-square max-h-[420px] w-full items-center justify-center overflow-hidden rounded-2xl bg-marine-950">
          <div className="absolute inset-[18%] rounded-3xl border-4 border-or-400/80" />
          <div className="relative px-8 text-center text-marine-100">
            <Camera className="mx-auto size-10 text-or-400" aria-hidden />
            <p className="mt-3 font-medium text-white">Placez le QR code dans le cadre</p>
            <p className="mt-1 text-sm text-marine-100/70">
              La lecture par caméra sera activée à l&apos;Étape 4.
            </p>
          </div>
        </div>
        <Bouton variante="or" className="w-full" disabled>
          <Camera className="size-4" aria-hidden /> Activer la caméra
        </Bouton>
      </div>

      <div className="space-y-6">
        <form
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            setResultat({ membre: trouverParMatricule(matricule) });
          }}
        >
          <label htmlFor="matricule" className="text-sm font-semibold text-marine-900">
            Recherche manuelle par matricule
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Si le scan échoue, saisissez le matricule imprimé sur la carte.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              id="matricule"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              placeholder="PGM-MUA-0001"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-marine-700"
            />
            <Bouton type="submit">
              <Search className="size-4" aria-hidden /> Vérifier
            </Bouton>
          </div>
        </form>
        {resultat && <ResultatVerification membre={resultat.membre} />}
      </div>
    </div>
  );
}
