import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { cheminSur } from "@/lib/auth/roles";
import { creerClientServeur } from "@/lib/supabase/server";

/** Point d'arrivée des liens envoyés par e-mail (invitation, réinitialisation). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const suite = cheminSur(params.get("suite"), "/");
  const supabase = await creerClientServeur();

  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");

  let ok = false;
  if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  } else if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  const url = request.nextUrl.clone();
  url.search = "";
  url.pathname = ok ? suite : "/connexion";
  if (!ok) url.searchParams.set("erreur", "lien");
  return NextResponse.redirect(url);
}
