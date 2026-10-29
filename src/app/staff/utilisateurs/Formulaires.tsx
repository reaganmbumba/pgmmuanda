"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Copy, KeyRound, Loader2, MessageCircle, Pencil, RefreshCw, UserPlus } from "lucide-react";
import { useLectureSeule } from "@/components/LectureSeule";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import { LIBELLES_NIVEAUX, LIBELLES_ROLES, estLecteurGeneral, ROLES_PAR_NIVEAU, niveauDe, peutRecevoirAccesFinances, type Niveau, type Role } from "@/lib/auth/roles";
import { lienWhatsApp } from "@/lib/programmes/libelles";
import { motDePasseProvisoire } from "@/lib/auth/comptes";
import { creerCompte, modifierUtilisateur, nouveauMotDePasse, renommerUtilisateur, type EtatAcces } from "./actions";

type Option = { id: string; nom: string };
type Listes = { roles: Role[]; paroisses: Option[]; commissions: Option[]; chorales: Option[] };

function ChampsPerimetre({ role, paroisses, commissions, chorales, paroisseId, commissionId, choraleId }: {
  role: Role; paroisses: Option[]; commissions: Option[]; chorales: Option[];
  paroisseId?: string | null; commissionId?: string | null; choraleId?: string | null;
}) {
  return (
    <>
      <select name="choraleId" defaultValue={choraleId ?? ""} aria-label="Chorale"
        className={`${classeChamp} ${role === "responsable_chorale" ? "" : "hidden"}`}>
        <option value="">Chorale…</option>
        {chorales.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
      </select>
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

/**
 * Choix du rôle en deux temps : d'abord Membre, Membre staff ou Admin, puis, s'il y a
 * plusieurs possibilités, la fonction précise (responsable de paroisse, contrôleur…).
 */
function ChoixRole({ roles, role, onChange, disabled, pour }: {
  roles: Role[]; role: Role; onChange: (r: Role) => void; disabled?: boolean; pour?: string;
}) {
  const niveau = niveauDe(role);
  const niveaux = (Object.keys(ROLES_PAR_NIVEAU) as Niveau[]).filter(
    (n) => n === niveau || ROLES_PAR_NIVEAU[n].some((r) => roles.includes(r)));
  const fonctions = ROLES_PAR_NIVEAU[niveau].filter((r) => r === role || roles.includes(r));
  const suffixe = pour ? ` de ${pour}` : "";
  return (
    <div className="grid gap-2">
      <input type="hidden" name="role" value={role} />
      <select value={niveau} disabled={disabled} aria-label={`Niveau${suffixe}`} className={classeChamp}
        onChange={(e) => {
          const n = e.target.value as Niveau;
          onChange(ROLES_PAR_NIVEAU[n].find((r) => roles.includes(r)) ?? ROLES_PAR_NIVEAU[n][0]);
        }}>
        {niveaux.map((n) => <option key={n} value={n}>{LIBELLES_NIVEAUX[n]}</option>)}
      </select>
      {fonctions.length > 1 && (
        <select value={role} disabled={disabled} aria-label={`Fonction${suffixe}`} className={classeChamp}
          onChange={(e) => onChange(e.target.value as Role)}>
          {fonctions.map((r) => <option key={r} value={r}>{LIBELLES_ROLES[r]}{estLecteurGeneral(r) ? " (voit tout, ne modifie rien)" : ""}</option>)}
        </select>
      )}
    </div>
  );
}

/** Case visible seulement pour les responsables : l'administration a toujours accès aux finances. */
function CaseFinances({ role, coche, disabled, pour }: { role: Role; coche?: boolean; disabled?: boolean; pour?: string }) {
  if (!peutRecevoirAccesFinances(role)) return null;
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-marine-900">
      <input type="checkbox" name="accesFinances" defaultChecked={coche} disabled={disabled}
        aria-label={pour ? `Accès aux finances pour ${pour}` : undefined} className="size-5 accent-marine-900" />
      Accès aux finances
    </label>
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
  const [etat, action, enCours] = useActionState(creerCompte, undefined);
  return (
    <div className="space-y-4">
      {/* Après une création réussie, le formulaire repart de zéro */}
      {/* Envoi sans la remise à zéro automatique de React : après une erreur, les choix restent affichés tels quels */}
      <form key={etat?.acces?.motDePasse} className="grid gap-3 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          startTransition(() => action(f));
        }}>
        <ChampsCompte {...listes} enCours={enCours} />
      </form>
      <MessageFormulaire etat={etat} />
      {etat?.acces && <BoiteAcces acces={etat.acces} />}
    </div>
  );
}

function ChampsCompte({ roles, paroisses, commissions, chorales, enCours }: Listes & { enCours: boolean }) {
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
      <div className="grid gap-1 text-sm font-medium text-slate-700">
        Type de compte
        <ChoixRole roles={roles} role={role} onChange={setRole} />
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        <span>Adresse e-mail <span className="font-normal text-slate-400">(facultatif)</span></span>
        <input name="email" type="email" placeholder="Si la personne en a une" className={classeChamp} />
      </label>
      <ChampsPerimetre role={role} paroisses={paroisses} commissions={commissions} chorales={chorales} />
      <CaseFinances role={role} />
      <ChampMotDePasse />
      <div className="md:col-span-2">
        <button type="submit" disabled={enCours}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-marine-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-marine-800 disabled:opacity-60 sm:w-auto">
          {enCours ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <UserPlus className="size-5" aria-hidden />} Créer le compte
        </button>
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

export function LigneUtilisateur({ u, roles, paroisses, commissions, chorales, estMoi }: Listes & {
  u: { id: string; nom: string; email: string | null; identifiant: string | null; role: Role; paroisseId: string | null; commissionId: string | null; choraleId: string | null; actif: boolean; accesFinances: boolean };
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
      <ChoixRole roles={modifiable ? roles : [u.role]} role={role} onChange={setRole} disabled={!modifiable} pour={u.nom} />
      <div>
        <ChampsPerimetre role={role} paroisses={paroisses} commissions={commissions} chorales={chorales}
          paroisseId={u.paroisseId} commissionId={u.commissionId} choraleId={u.choraleId} />
        <div className="mt-2"><CaseFinances role={role} coche={u.accesFinances} disabled={!modifiable} pour={u.nom} /></div>
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
    {(modifiable || estMoi) && <CorrigerNom id={u.id} nom={u.nom} />}
    {modifiable && <BoutonNouveauMotDePasse id={u.id} nom={u.nom} />}
    </div>
  );
}

/** « Corriger le nom » d'un compte, replié tant qu'on n'en a pas besoin. */
function CorrigerNom({ id, nom }: { id: string; nom: string }) {
  const [etat, action] = useActionState(renommerUtilisateur, undefined);
  if (useLectureSeule()) return null;
  return (
    <details className="px-4 pb-3 text-xs">
      <summary className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 font-medium text-marine-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
        <Pencil className="size-3.5" aria-hidden /> Corriger le nom
      </summary>
      <form action={action} className="mt-2 flex flex-wrap items-start gap-2">
        <input type="hidden" name="id" value={id} />
        <input name="nom" required minLength={2} maxLength={80} defaultValue={nom} aria-label={`Nouveau nom de ${nom}`} className={`${classeChamp} min-w-48 flex-1`} />
        <BoutonEnvoi className="sm:w-auto">Enregistrer</BoutonEnvoi>
        <div className="w-full"><MessageFormulaire etat={etat} /></div>
      </form>
    </details>
  );
}

/** Mot de passe provisoire visible dès le formulaire : proposé par l'application, modifiable. */
function ChampMotDePasse() {
  const [valeur, setValeur] = useState("");
  // Tiré au sort dans le navigateur, après l'affichage (sinon le serveur et le navigateur ne seraient pas d'accord)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- valeur aléatoire, seulement dans le navigateur
  useEffect(() => { setValeur(motDePasseProvisoire()); }, []);
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2">
      Mot de passe provisoire
      <span className="flex gap-2">
        <input name="motDePasse" value={valeur} onChange={(e) => setValeur(e.target.value)} autoComplete="off" spellCheck={false}
          className={`${classeChamp} font-mono text-base tracking-wide`} />
        <button type="button" onClick={() => setValeur(motDePasseProvisoire())}
          className="mt-1.5 inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-marine-900 hover:bg-slate-50">
          <RefreshCw className="size-4" aria-hidden /> Autre
        </button>
      </span>
      <span className="text-xs font-normal text-slate-500">Notez-le ou envoyez-le sur WhatsApp après la création. La personne le changera dans « Paramètres ».</span>
    </label>
  );
}
