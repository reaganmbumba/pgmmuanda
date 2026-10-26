"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Copy, KeyRound, MessageCircle, UserPlus } from "lucide-react";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import { LIBELLES_ROLES, type Role } from "@/lib/auth/roles";
import { lienWhatsApp } from "@/lib/programmes/libelles";
import { creerCompte, modifierUtilisateur, nouveauMotDePasse, type EtatAcces } from "./actions";

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

/** Proposition d'identifiant à partir du nom : « Daniel Nkanga » → « daniel.nkanga ». */
function identifiantPour(nom: string) {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40);
}

/** Identifiant et mot de passe provisoire, affichés une seule fois, avec partage WhatsApp. */
function BoiteAcces({ acces }: { acces: NonNullable<NonNullable<EtatAcces>["acces"]> }) {
  const [copie, setCopie] = useState(false);
  return (
    <div className="rounded-2xl border-2 border-or-500/60 bg-or-100/50 p-4" data-acces>
      <p className="font-semibold text-marine-900">Accès de {acces.nom}</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-white p-3">
          <dt className="text-xs text-slate-500">Identifiant</dt>
          <dd className="font-mono text-base font-semibold text-marine-900" data-identifiant>{acces.identifiant}</dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-xs text-slate-500">Mot de passe provisoire</dt>
          <dd className="font-mono text-base font-semibold text-marine-900" data-mot-de-passe>{acces.motDePasse}</dd>
        </div>
      </dl>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <a href={lienWhatsApp(acces.message)} target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
          <MessageCircle className="size-5" aria-hidden /> Envoyer sur WhatsApp
        </a>
        <button type="button"
          onClick={() => navigator.clipboard?.writeText(acces.message).then(() => setCopie(true), () => setCopie(false))}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-marine-900 shadow-sm hover:bg-slate-50">
          <Copy className="size-5" aria-hidden /> {copie ? "Message copié" : "Copier le message"}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-600">
        Notez-le maintenant : ce mot de passe ne sera plus affiché. La personne le changera dans « Paramètres ».
      </p>
    </div>
  );
}

export function FormulaireCompte(listes: Listes) {
  const [etat, action] = useActionState(creerCompte, undefined);
  return (
    <div className="space-y-4">
      {/* Après une création réussie, le formulaire repart de zéro */}
      <form action={action} key={etat?.acces?.motDePasse} className="grid gap-3 md:grid-cols-2">
        <ChampsCompte {...listes} />
      </form>
      <MessageFormulaire etat={etat} />
      {etat?.acces && <BoiteAcces acces={etat.acces} />}
    </div>
  );
}

function ChampsCompte({ roles, paroisses, commissions }: Listes) {
  const [role, setRole] = useState<Role>("choriste");
  const [nom, setNom] = useState("");
  const [identifiant, setIdentifiant] = useState<string | null>(null);
  return (
    <>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Nom complet
        <input name="nom" required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. : Daniel Nkanga" className={classeChamp} />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Identifiant de connexion
        <input name="identifiant" required value={identifiant ?? identifiantPour(nom)} onChange={(e) => setIdentifiant(e.target.value)}
          placeholder="Ex. : daniel.nkanga" autoCapitalize="none" className={classeChamp} />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Rôle
        <select name="role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={classeChamp}>
          {roles.map((r) => <option key={r} value={r}>{LIBELLES_ROLES[r]}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        <span>Adresse e-mail <span className="font-normal text-slate-400">(facultatif)</span></span>
        <input name="email" type="email" placeholder="Si la personne en a une" className={classeChamp} />
      </label>
      <ChampsPerimetre role={role} paroisses={paroisses} commissions={commissions} />
      <div className="md:col-span-2">
        <BoutonEnvoi className="min-h-12 sm:w-auto">
          <UserPlus className="size-5" aria-hidden /> Créer le compte
        </BoutonEnvoi>
      </div>
    </>
  );
}

function BoutonNouveauMotDePasse({ id, nom }: { id: string; nom: string }) {
  const [etat, action] = useActionState(nouveauMotDePasse, undefined);
  return (
    <div className="px-4 pb-4">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <BoutonEnvoiSecondaire label={`Donner un nouveau mot de passe à ${nom}`}>
          <KeyRound className="size-4" aria-hidden /> Nouveau mot de passe
        </BoutonEnvoiSecondaire>
      </form>
      {etat?.erreur && <div className="mt-2"><MessageFormulaire etat={etat} /></div>}
      {etat?.acces && <div className="mt-3"><BoiteAcces acces={etat.acces} /></div>}
    </div>
  );
}

function BoutonEnvoiSecondaire({ children, label }: { children: React.ReactNode; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-label={label}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-marine-900 hover:bg-slate-50 disabled:opacity-60">
      {children}
    </button>
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
    <div className="border-b border-slate-100 last:border-0">
    <form action={action} className="grid items-center gap-3 p-4 lg:grid-cols-[1.4fr_1fr_1fr_auto_auto]">
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
    {modifiable && <BoutonNouveauMotDePasse id={u.id} nom={u.nom} />}
    </div>
  );
}
