export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_CLE_PUBLIQUE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Sans configuration Supabase, l'application tourne en mode maquette
 * (données de démonstration, sans connexion) : c'est le cas de la version
 * HTML et des applications mobiles de l'Étape 1.
 */
export const supabaseActif = Boolean(SUPABASE_URL && SUPABASE_CLE_PUBLIQUE);

export const URL_SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
