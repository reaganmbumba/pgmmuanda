import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * Client « service_role » : contourne les règles RLS.
 * Uniquement côté serveur, et seulement après avoir vérifié les droits de l'appelant.
 * La clé n'est jamais préfixée NEXT_PUBLIC_, donc jamais envoyée au navigateur.
 */
export function creerClientAdmin() {
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !cle) return null;
  return createClient(SUPABASE_URL, cle, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
