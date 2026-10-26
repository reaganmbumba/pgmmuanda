import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_CLE_PUBLIQUE, SUPABASE_URL } from "./config";

export function creerClientNavigateur() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE);
}
