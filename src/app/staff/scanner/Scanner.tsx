"use client";

import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { LecteurQR } from "@/components/carte/LecteurQR";
import { depuisMembreDemo, ResultatVerification, type CarteVerifiee } from "@/components/carte/ResultatVerification";
import { Bouton } from "@/components/ui/Bouton";
import { trouverParMatricule, trouverParReference } from "@/lib/demo-data";
import { extraireReference } from "@/lib/cartes/lien";
import { verifierScan } from "./actions";

type Resultat = { membre?: CarteVerifiee; erreur?: string } | null;

/** Vérification d'une carte par la caméra ou par matricule. */
export function Scanner({ maquette = false }: { maquette?: boolean }) {
  const [matricule, setMatricule] = useState("");
  const [resultat, setResultat] = useState<Resultat>(null);
  const [enCours, demarrer] = useTransition();

  function verifier(contenu: string, mode: "qr" | "matricule") {
    if (maquette) {
      const ref = mode === "qr" ? extraireReference(contenu) : null;
      setResultat({ membre: depuisMembreDemo(mode === "qr" ? (ref ? trouverParReference(ref) : undefined) : trouverParMatricule(contenu)) });
      return;
    }
    demarrer(async () => setResultat(await verifierScan(contenu, mode)));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <LecteurQR surCode={(texte) => verifier(texte, "qr")} />

      <div className="space-y-6">
        <form
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            verifier(matricule, "matricule");
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
            <Bouton type="submit" disabled={enCours}>
              {enCours ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />} Vérifier
            </Bouton>
          </div>
        </form>
        <div aria-live="polite">
          {enCours && <p className="text-sm text-slate-500">Vérification…</p>}
          {!enCours && resultat?.erreur && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{resultat.erreur}</p>}
          {!enCours && resultat && !resultat.erreur && <ResultatVerification membre={resultat.membre} />}
        </div>
      </div>
    </div>
  );
}
