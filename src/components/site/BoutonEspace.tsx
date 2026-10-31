"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogIn } from "lucide-react";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { supabaseActif } from "@/lib/supabase/config";

/**
 * « Se connecter » pour un visiteur, « Mon espace » pour un membre déjà connecté.
 * La page /connexion envoie elle-même un membre connecté vers son espace.
 * La session est lue dans le navigateur pour que les pages du site restent statiques.
 */
export function BoutonEspace() {
  const [connecte, setConnecte] = useState(false);
  useEffect(() => {
    if (!supabaseActif) return;
    creerClientNavigateur().auth.getSession().then(({ data }) => setConnecte(Boolean(data.session)));
  }, []);
  const Icone = connecte ? LayoutDashboard : LogIn;
  return (
    <Link className="btn-connexion" href="/connexion">
      <Icone className="i" aria-hidden />
      {connecte ? "Mon espace" : "Se connecter"}
    </Link>
  );
}
