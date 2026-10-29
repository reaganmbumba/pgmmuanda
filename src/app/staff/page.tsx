import { InstallerApp } from "@/components/InstallerApp";
import Link from "next/link";
import {
  CalendarDays,
  ClipboardCheck,
  IdCard,
  Megaphone,
  ScanLine,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Bouton } from "@/components/ui/Bouton";
import { Carte, EnTete } from "@/components/ui/Carte";
import { Avatar } from "@/components/ui/Avatar";
import { activites, annonces, membres, paroisses } from "@/lib/demo-data";
import { formatDate, formatDateHeure, nomComplet } from "@/lib/format";
import type { Voix } from "@/lib/types";
import { exigerAcces } from "@/lib/auth/session";
import { peutOuvrir, type Role } from "@/lib/auth/roles";
import { CHAMPS_MEMBRE } from "@/lib/membres/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { chiffresTableauDeBord } from "@/lib/tableau-de-bord";

export const metadata = { title: "Tableau de bord" };

const TAUX_PRESENCE_DEMO = 84;

export default async function TableauDeBord() {
  if (!supabaseActif) return <TableauDemo />;
  // Le contrôleur n'a accès qu'au scanner (vérifié ici aussi : une redirection après connexion ne repasse pas par le proxy).
  const moi = (await exigerAcces("/staff"))!;
  return <TableauReel role={moi.role} chiffres={await chiffresTableauDeBord()} />;
}

/** Les gestes les plus fréquents, en grandes tuiles faciles à toucher. */
const ACTIONS = [
  { href: "/staff/membres/nouveau", acces: "/staff/membres", label: "Ajouter un membre", icone: UserPlus },
  { href: "/staff/scanner", acces: "/staff/scanner", label: "Scanner une carte", icone: ScanLine },
  { href: "/staff/programmes", acces: "/staff/programmes", label: "Programmer une activité", icone: CalendarDays },
  { href: "/staff/communication", acces: "/staff/communication", label: "Publier une annonce", icone: Megaphone },
];

function ActionsRapides({ role }: { role: Role }) {
  const actions = ACTIONS.filter((a) => peutOuvrir(role, a.acces));
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {actions.map(({ href, label, icone: Icone }, i) => (
        <Link key={href} href={href}
          className={`flex min-h-20 items-center gap-3 rounded-2xl p-4 text-sm font-semibold shadow-sm transition ${
            i === 0 ? "bg-marine-900 text-white hover:bg-marine-800" : "border border-slate-200/80 bg-white text-marine-900 hover:border-or-400"
          }`}>
          <span className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${i === 0 ? "or-degrade text-marine-950" : "bg-or-100 text-or-600"}`}>
            <Icone className="size-5.5" aria-hidden />
          </span>
          {label}
        </Link>
      ))}
    </div>
  );
}

const LIBELLES_CONTROLE = { valide: "Valide", revoquee: "Révoquée", inconnue: "Inconnue" } as Record<string, string>;

function Barres({ lignes }: { lignes: { nom: string; total: number }[] }) {
  const max = Math.max(1, ...lignes.map((l) => l.total));
  return (
    <ul className="space-y-3">
      {lignes.map((p) => (
        <li key={p.nom} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-3 text-sm">
          <span className="truncate text-slate-700">{p.nom}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full rounded-full bg-marine-800" style={{ width: `${(p.total / max) * 100}%` }} />
          </span>
          <span className="text-right font-semibold text-marine-900">{p.total}</span>
        </li>
      ))}
    </ul>
  );
}

function Indicateurs({ liste }: { liste: { label: string; valeur: number | string; icone: typeof Users }[] }) {
  return (
    <div className={`grid grid-cols-2 gap-4 ${liste.length > 4 ? "md:grid-cols-3 xl:grid-cols-5" : "xl:grid-cols-4"}`}>
      {liste.map(({ label, valeur, icone: Icone }) => (
        <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm" data-indicateur={label}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="rounded-lg bg-marine-50 p-2 text-marine-800">
              <Icone className="size-4.5" aria-hidden />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-marine-900">{valeur}</p>
        </div>
      ))}
    </div>
  );
}

function TableauReel({ role, chiffres: c }: { role: Role; chiffres: Awaited<ReturnType<typeof chiffresTableauDeBord>> }) {
  const actifs = c.statuts.find((s) => s.code === "actif")?.total ?? 0;
  const attente = c.statuts.find((s) => s.code === "en_attente")?.total ?? 0;
  return (
    <>
      <EnTete
        titre="Tableau de bord"
        description="Chiffres réels de votre périmètre, lus dans la base de données."
      />
      <ActionsRapides role={role} />
      <div className="mb-6 max-w-md empty:hidden"><InstallerApp discret /></div>
      <Indicateurs
        liste={[
          { label: "Choristes inscrits", valeur: c.total, icone: Users },
          { label: "Membres actifs", valeur: actifs, icone: UserCheck },
          { label: "En attente de validation", valeur: attente, icone: UserPlus },
          { label: "Cartes actives", valeur: c.cartesActives, icone: IdCard },
          { label: "Taux de présence (30 j)", valeur: c.tauxPresence === null ? "—" : `${c.tauxPresence} %`, icone: ClipboardCheck },
        ]}
      />
      <p className="mt-3 text-sm text-slate-500">
        {c.nouveaux30j} nouvelle{c.nouveaux30j > 1 ? "s" : ""} inscription{c.nouveaux30j > 1 ? "s" : ""} ces 30 derniers jours.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Carte titre="Répartition par paroisse" className="xl:col-span-2">
          {c.parParoisse.length === 0 ? <p className="text-sm text-slate-500">Aucun membre enregistré.</p> : <Barres lignes={c.parParoisse} />}
        </Carte>

        <Carte titre="Répartition par voix">
          <div className="grid grid-cols-2 gap-3">
            {c.voix.map((v) => (
              <div key={v.libelle} className="rounded-xl bg-marine-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{v.libelle}</p>
                <p className="mt-1 text-2xl font-bold text-marine-900">{v.total}</p>
              </div>
            ))}
          </div>
        </Carte>

        <Carte
          titre="Membres en attente de validation"
          action={<Link href="/staff/membres" className="shrink-0 text-sm font-medium text-marine-700 hover:underline">Voir tout</Link>}
        >
          {c.enAttente.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun membre en attente.</p>
          ) : (
            <ul className="space-y-3">
              {c.enAttente.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <Avatar membre={m} taille="sm" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium text-marine-900">{nomComplet(m)}</p>
                    <p className="text-slate-500">{m.matricule}{m.paroisse ? ` · ${m.paroisse}` : ""}</p>
                  </div>
                  <Bouton variante="secondaire" className="px-3 py-1.5 text-xs" href={`/staff/membres/${m.id}`}>Examiner</Bouton>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre="Demandes de correction en attente">
          {c.demandes.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune demande en attente.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {c.demandes.slice(0, 6).map((d) => (
                <li key={d.id} className="py-2 first:pt-0">
                  <Link href={`/staff/membres/${d.membreId}`} className="font-medium text-marine-900 hover:underline">
                    {d.membre ?? d.matricule ?? "Membre"}
                  </Link>
                  <p className="text-slate-500">{CHAMPS_MEMBRE[d.champ] ?? d.champ} · {formatDate(d.date)}</p>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre="Activités à venir" className="xl:col-span-2"
          action={<Link href="/staff/programmes" className="text-sm font-medium text-marine-700 hover:underline">Voir le programme</Link>}>
          {c.activites.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune activité à venir.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {c.activites.map((a) => (
                <li key={a.id}>
                  <Link href={`/staff/programmes/${a.id}`} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                    <span className="mt-0.5 rounded-lg bg-or-100 p-2 text-or-600"><CalendarDays className="size-4.5" aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-marine-900">{a.titre}</span>
                      <span className="block text-sm text-slate-500">{formatDateHeure(a.debut)}{a.lieu ? ` · ${a.lieu}` : ""}</span>
                    </span>
                    <Badge>{a.statut}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre="Annonces récentes"
          action={<Link href="/staff/communication" className="text-sm font-medium text-marine-700 hover:underline">Voir tout</Link>}>
          {c.annonces.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune annonce publiée.</p>
          ) : (
            <ul className="space-y-3">
              {c.annonces.map((a) => (
                <li key={a.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between gap-2"><Badge>{a.type}</Badge><span className="text-xs text-slate-400">{formatDate(a.date)}</span></div>
                  <p className="mt-1.5 text-sm font-medium text-marine-900">{a.titre}</p>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre="Derniers contrôles de cartes" action={<Link href="/staff/scanner" className="text-sm font-medium text-marine-700 hover:underline">Scanner</Link>}>
          {c.controles.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun contrôle enregistré.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {c.controles.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-2 first:pt-0">
                  <span>
                    <span className="font-mono text-marine-800">{v.matricule ?? `${v.reference.slice(0, 6)}…`}</span>
                    <span className="block text-xs text-slate-400">{formatDateHeure(v.date)}</span>
                  </span>
                  <Badge ton={v.resultat === "valide" ? "vert" : v.resultat === "revoquee" ? "rouge" : "gris"}>{LIBELLES_CONTROLE[v.resultat] ?? v.resultat}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>
    </>
  );
}

/** Tableau de démonstration, affiché uniquement en mode maquette (sans Supabase). */
function TableauDemo() {
  const actifs = membres.filter((m) => m.statut === "Actif");
  const enAttente = membres.filter((m) => m.statut === "En attente");
  const parParoisse = paroisses
    .map((p) => ({ nom: p, total: membres.filter((m) => m.paroisse === p).length }))
    .sort((a, b) => b.total - a.total);
  const maxParoisse = Math.max(...parParoisse.map((p) => p.total));
  const voix: Voix[] = ["Soprano", "Alto", "Ténor", "Basse"];
  const parVoix = voix.map((v) => ({
    voix: v,
    total: membres.filter((m) => m.voix === v).length,
  }));

  const indicateurs = [
    { label: "Choristes inscrits", valeur: membres.length, icone: Users },
    { label: "Membres actifs", valeur: actifs.length, icone: UserCheck },
    { label: "En attente de validation", valeur: enAttente.length, icone: UserPlus },
    { label: "Taux de présence (30 j)", valeur: `${TAUX_PRESENCE_DEMO} %`, icone: ClipboardCheck },
  ];

  return (
    <>
      <EnTete
        titre="Tableau de bord"
        description="Vue d'ensemble de la Présidence générale de la musique de Muanda."
      />
      <ActionsRapides role="super_admin" />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {indicateurs.map(({ label, valeur, icone: Icone }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="rounded-lg bg-marine-50 p-2 text-marine-800">
                <Icone className="size-4.5" aria-hidden />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-marine-900">{valeur}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Carte titre="Répartition par paroisse" className="xl:col-span-2">
          <ul className="space-y-3">
            {parParoisse.map((p) => (
              <li key={p.nom} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-3 text-sm">
                <span className="truncate text-slate-700">{p.nom}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full rounded-full bg-marine-800"
                    style={{ width: `${(p.total / maxParoisse) * 100}%` }}
                  />
                </span>
                <span className="text-right font-semibold text-marine-900">{p.total}</span>
              </li>
            ))}
          </ul>
        </Carte>

        <Carte titre="Répartition par voix">
          <div className="grid grid-cols-2 gap-3">
            {parVoix.map((v) => (
              <div key={v.voix} className="rounded-xl bg-marine-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {v.voix}
                </p>
                <p className="mt-1 text-2xl font-bold text-marine-900">{v.total}</p>
              </div>
            ))}
          </div>
        </Carte>

        <Carte
          titre="Activités à venir"
          className="xl:col-span-2"
          action={
            <Link href="/staff/programmes" className="text-sm font-medium text-marine-700 hover:underline">
              Voir le programme
            </Link>
          }
        >
          <ul className="divide-y divide-slate-100">
            {activites.map((a) => (
              <li key={a.id} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 rounded-lg bg-or-100 p-2 text-or-600">
                  <CalendarDays className="size-4.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-marine-900">{a.titre}</p>
                  <p className="text-sm text-slate-500">
                    {formatDateHeure(a.debut)} · {a.lieu}
                  </p>
                </div>
                <Badge>{a.statut}</Badge>
              </li>
            ))}
          </ul>
        </Carte>

        <Carte titre="Membres en attente de validation">
          <ul className="space-y-3">
            {enAttente.map((m) => (
              <li key={m.matricule} className="flex items-center gap-3">
                <Avatar membre={m} taille="sm" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium text-marine-900">{nomComplet(m)}</p>
                  <p className="text-slate-500">{m.paroisse} · {m.voix}</p>
                </div>
                <Bouton variante="secondaire" className="px-3 py-1.5 text-xs">
                  Examiner
                </Bouton>
              </li>
            ))}
          </ul>
        </Carte>

        <Carte titre="Annonces récentes" className="xl:col-span-3">
          <ul className="grid gap-4 md:grid-cols-3">
            {annonces.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge>{a.type}</Badge>
                  <span className="text-xs text-slate-400">{formatDate(a.date)}</span>
                </div>
                <p className="mt-2 font-medium text-marine-900">{a.titre}</p>
                <p className="mt-1 text-sm text-slate-500">{a.extrait}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <Megaphone className="size-3.5" aria-hidden /> {a.cible}
                </p>
              </li>
            ))}
          </ul>
        </Carte>
      </div>
    </>
  );
}
