import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * Client « service_role » : contourne les règles RLS.
 * Uniquement côté serveur, et seulement après avoir vérifié les droits de l'appelant.
 * La clé n'est jamais préfixée NEXT_PUBLIC_, donc jamais envoyée au navigateur.
 */
export function creerClientAdmin() {
  // Un espace ou un retour à la ligne collé avec la clé la rend invalide
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!SUPABASE_URL || !cle) return null;
  return createClient(SUPABASE_URL, cle, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Explique, sans jamais afficher la clé, pourquoi Supabase refuse la clé serveur :
 * le plus souvent, c'est la clé « anon » (publique) qui a été collée à sa place.
 */
export function problemeCleServeur(): string | null {
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!cle) return "la clé SUPABASE_SERVICE_ROLE_KEY est vide dans Vercel";
  if (cle.startsWith("sb_publishable_")) return "la clé mise dans Vercel est la clé publique (« publishable »), pas la clé secrète";
  if (cle.startsWith("sb_secret_")) return null;
  const parties = cle.split(".");
  if (parties.length !== 3) return "la clé mise dans Vercel n'a pas le bon format (elle est peut-être incomplète)";
  try {
    const contenu = JSON.parse(Buffer.from(parties[1], "base64url").toString("utf8")) as { role?: string; ref?: string };
    if (contenu.role === "anon") return "la clé mise dans Vercel est la clé « anon » (publique), pas la clé « service_role »";
    if (contenu.role !== "service_role") return "la clé mise dans Vercel n'est pas la clé « service_role »";
    const projet = SUPABASE_URL?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
    if (projet && contenu.ref && contenu.ref !== projet) return "la clé mise dans Vercel vient d'un autre projet Supabase";
  } catch {
    return "la clé mise dans Vercel n'a pas le bon format (elle est peut-être incomplète)";
  }
  return null;
}
