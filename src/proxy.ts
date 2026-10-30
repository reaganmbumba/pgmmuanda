import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { accueilPourRole, peutOuvrir, type Role } from "@/lib/auth/roles";
import { SUPABASE_CLE_PUBLIQUE, SUPABASE_URL, supabaseActif } from "@/lib/supabase/config";

/**
 * Rafraîchit la session Supabase à chaque requête (y compris les navigations
 * internes), renvoie vers la connexion toute personne non connectée qui ouvre
 * un espace protégé, et vers son propre espace celle dont le rôle ne le permet pas.
 * Les données restent de toute façon protégées par la base (RLS).
 */
export async function proxy(request: NextRequest) {
  if (!supabaseActif) return NextResponse.next();

  let reponse = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (aEcrire, entetes) => {
        aEcrire.forEach(({ name, value }) => request.cookies.set(name, value));
        reponse = NextResponse.next({ request });
        aEcrire.forEach(({ name, value, options }) => reponse.cookies.set(name, value, options));
        Object.entries(entetes ?? {}).forEach(([k, v]) => reponse.headers.set(k, v));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const chemin = request.nextUrl.pathname;
  const protege = chemin.startsWith("/staff") || chemin.startsWith("/choriste") || chemin === "/reinitialiser";
  if (!protege || chemin === "/reinitialiser") {
    return !user && protege ? rediriger(request, reponse, "/connexion", chemin) : reponse;
  }
  if (!user) return rediriger(request, reponse, "/connexion", chemin);

  const { data: profil } = await supabase.from("profils").select("role, actif, acces_finances").eq("id", user.id).single();
  if (!profil?.actif) {
    await supabase.auth.signOut();
    return rediriger(request, reponse, "/connexion", chemin);
  }
  const role = profil.role as Role;
  if (!peutOuvrir(role, chemin, profil.acces_finances)) {
    return rediriger(request, reponse, accueilPourRole(role));
  }
  return reponse;
}

function rediriger(request: NextRequest, reponse: NextResponse, vers: string, suite?: string) {
  const url = request.nextUrl.clone();
  url.pathname = vers;
  url.search = suite ? `?suite=${encodeURIComponent(suite)}` : "";
  const redirection = NextResponse.redirect(url);
  // Conserver les cookies de session éventuellement rafraîchis
  reponse.cookies.getAll().forEach((c) => redirection.cookies.set(c));
  return redirection;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icons/|textes/|fonts/|logo-pgm.png|icon.png|apple-icon.png|manifest.webmanifest|sw.js).*)"],
};
