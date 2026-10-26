import type { Role } from "@/lib/auth/roles";
import { estAdmin } from "@/lib/auth/roles";
import type { Organisation } from "@/lib/membres/depot";

type Moi = { role: Role; paroisseId: string | null };

/** Portées proposées dans les formulaires (null = toute la PGM). La base refuse de toute façon les autres. */
export function porteesActivite(moi: Moi, org: Organisation): (string | null)[] {
  if (moi.role === "responsable_paroisse") return moi.paroisseId ? [moi.paroisseId] : [];
  return [null, ...org.paroisses.map((p) => p.id)];
}

export function porteesAnnonce(moi: Moi, org: Organisation): (string | null)[] {
  if (moi.role === "responsable_paroisse") return moi.paroisseId ? [moi.paroisseId] : [];
  return estAdmin(moi.role) ? [null, ...org.paroisses.map((p) => p.id)] : [];
}

/** Même règle que public.peut_gerer_activite, pour n'afficher que les boutons utiles. */
export function peutModifierActivite(
  moi: Moi & { commissionId: string | null },
  a: { ciblage: { portee: string | null }; commissionId: string | null },
) {
  return estAdmin(moi.role)
    || (moi.role === "responsable_paroisse" && !!a.ciblage.portee && a.ciblage.portee === moi.paroisseId)
    || (moi.role === "responsable_commission" && !!a.commissionId && a.commissionId === moi.commissionId);
}
