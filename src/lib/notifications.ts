import "server-only";
import { utilisateurCourant } from "@/lib/auth/session";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";

export type Notification = { id: string; titre: string; lien: string | null; lue: boolean; date: string };

/** Notifications de l'utilisateur connecté (la base ne renvoie que les siennes). */
export async function mesNotifications(limite = 30): Promise<{ liste: Notification[]; nonLues: number }> {
  if (!supabaseActif || !(await utilisateurCourant())) return { liste: [], nonLues: 0 };
  const supabase = await creerClientServeur();
  const [{ data }, { count }] = await Promise.all([
    supabase.from("notifications").select("id, titre, lien, lue, cree_le").order("cree_le", { ascending: false }).limit(limite),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("lue", false),
  ]);
  return {
    liste: (data ?? []).map((n) => ({ id: n.id, titre: n.titre, lien: n.lien, lue: n.lue, date: n.cree_le })),
    nonLues: count ?? 0,
  };
}
