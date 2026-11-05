"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { supabaseActif } from "@/lib/supabase/config";

/**
 * Bandeau du site public pour un membre connecté : il voit qu'il reste connecté
 * et rejoint son espace d'un toucher. La session est lue dans le navigateur.
 */
export function BandeauConnecte() {
  const [nom, setNom] = useState<string | null>(null);
  useEffect(() => {
    if (!supabaseActif) return;
    const supabase = creerClientNavigateur();
    const lire = (id: string | undefined, meta?: { nom_affiche?: string }) => {
      if (!id) return setNom(null);
      supabase.from("profils").select("nom_affiche").eq("id", id).maybeSingle()
        .then(({ data }) => setNom(data?.nom_affiche || meta?.nom_affiche || "membre"));
    };
    supabase.auth.getSession().then(({ data }) => lire(data.session?.user.id, data.session?.user.user_metadata));
    const { data: abonnement } = supabase.auth.onAuthStateChange((_, session) => lire(session?.user.id, session?.user.user_metadata));
    return () => abonnement.subscription.unsubscribe();
  }, []);
  if (!nom) return null;
  const prenom = nom.split(" ")[0];
  return (
    <div className="bandeau-connecte" data-connecte>
      <div className="col large">
        <span><UserRound className="i" aria-hidden />Paix {prenom}, vous êtes connecté.</span>
        <Link href="/connexion">Ouvrir mon espace</Link>
      </div>
    </div>
  );
}
