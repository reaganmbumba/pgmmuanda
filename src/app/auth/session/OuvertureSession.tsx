"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { cheminSur } from "@/lib/auth/roles";
import { creerClientNavigateur } from "@/lib/supabase/client";

/** Ouvre la session à partir des jetons placés après le « # » par Supabase. */
export function OuvertureSession() {
  const params = useSearchParams();

  useEffect(() => {
    const suite = cheminSur(params.get("suite"), "/");
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const access_token = fragment.get("access_token");
    const refresh_token = fragment.get("refresh_token");
    // Efface les jetons de la barre d'adresse et de l'historique.
    window.history.replaceState(null, "", window.location.pathname);

    if (!access_token || !refresh_token) {
      window.location.replace("/connexion?erreur=lien");
      return;
    }
    creerClientNavigateur()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => window.location.replace(error ? "/connexion?erreur=lien" : suite));
  }, [params]);

  return <p className="text-marine-900">Connexion en cours…</p>;
}
