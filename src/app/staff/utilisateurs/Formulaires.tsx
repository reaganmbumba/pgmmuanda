"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import { LIBELLES_ROLES, type Role } from "@/lib/auth/roles";
import { inviterUtilisateur, modifierUtilisateur } from "./actions";

type Option = { id: string; nom: string };
type Listes = { roles: Role[]; paroisses: Option[]; commissions: Option[] };

function ChampsPerimetre({ role, paroisses, commissions, paroisseId, commissionId }: {
  role: Role; paroisses: Option[]; commissions: Option[]; paroisseId?: string | null; commissionId?: string | null;
}) {
  return (
    <>
      <select name="paroisseId" defaultValue={paroisseId ?? ""} aria-label="Paroisse"
        className={`${classeChamp} ${role === "responsable_paroisse" ? "" : "hidden"}`}>
        <option value="">Paroisse…</option>
        {paroisses.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
      </select>
      <select name="commissionId" defaultValue={commissionId ?? ""} aria-label="Commission"
        className={`${classeChamp} ${role === "responsable_commission" ? "" : "hidden"}`}>
        <option value="">Commission…</option>
        {commissions.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
      </select>
    </>
  );
}

export function FormulaireInvitation({ roles, paroisses, commissions }: Listes) {
  const [etat, action] = useActionState(inviterUtilisateur, undefined);
  const [role, setRole] = useState<Role>("choriste");
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <input name="nom" required placeholder="Nom complet" aria-label="Nom complet" className={classeChamp} />
      <input name="email" type="email" required placeholder="Adresse e-mail" aria-label="Adresse e-mail" className={classeChamp} />
      <input name="identifiant" placeholder="Identifiant (facultatif)" aria-label="Identifiant" className={classeChamp} />
      <select name="role" value={role} onChange={(e) => setRole(e.target.value as Role)} aria-label="Rôle" className={classeChamp}>
        {roles.map((r) => <option key={r} value={r}>{LIBELLES_ROLES[r]}</option>)}
      </select>
      <ChampsPerimetre role={role} paroisses={paroisses} commissions={commissions} />
      <div className="md:col-span-2 xl:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <BoutonEnvoi className="sm:w-auto">
          <UserPlus className="size-4" aria-hidden /> Envoyer l&apos;invitation
        </BoutonEnvoi>
        <MessageFormulaire etat={etat} />
      </div>
    </form>
  );
}

export function LigneUtilisateur({ u, roles, paroisses, commissions, estMoi }: Listes & {
  u: { id: string; nom: string; email: string | null; identifiant: string | null; role: Role; paroisseId: string | null; commissionId: string | null; actif: boolean };
  estMoi: boolean;
}) {
  const [etat, action] = useActionState(modifierUtilisateur, undefined);
  const [role, setRole] = useState<Role>(u.role);
  const modifiable = roles.includes(u.role) && !estMoi;
  return (
    <form action={action} className="grid items-center gap-3 border-b border-slate-100 p-4 last:border-0 lg:grid-cols-[1.4fr_1fr_1fr_auto_auto]">
      <input type="hidden" name="id" value={u.id} />
      <div className="min-w-0">
        <p className="truncate font-medium text-marine-900">{u.nom}{estMoi && " (vous)"}</p>
        <p className="truncate text-xs text-slate-500">{u.email ?? "—"}{u.identifiant && ` · ${u.identifiant}`}</p>
      </div>
      <select name="role" value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={!modifiable}
        aria-label={`Rôle de ${u.nom}`} className={classeChamp}>
        {(modifiable ? roles : [u.role]).map((r) => <option key={r} value={r}>{LIBELLES_ROLES[r]}</option>)}
      </select>
      <div>
        <ChampsPerimetre role={role} paroisses={paroisses} commissions={commissions} paroisseId={u.paroisseId} commissionId={u.commissionId} />
      </div>
      <select name="actif" defaultValue={u.actif ? "oui" : "non"} disabled={!modifiable} aria-label={`Statut de ${u.nom}`} className={classeChamp}>
        <option value="oui">Actif</option>
        <option value="non">Désactivé</option>
      </select>
      {modifiable ? (
        <BoutonEnvoi className="lg:w-auto">Enregistrer</BoutonEnvoi>
      ) : <span />}
      {etat && <div className="lg:col-span-5"><MessageFormulaire etat={etat} /></div>}
    </form>
  );
}
