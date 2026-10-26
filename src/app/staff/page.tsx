import Link from "next/link";
import {
  CalendarDays,
  ClipboardCheck,
  Megaphone,
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

export const metadata = { title: "Tableau de bord" };

const TAUX_PRESENCE_DEMO = 84;

export default async function TableauDeBord() {
  // Le contrôleur n'a accès qu'au scanner (vérifié ici aussi : une redirection après connexion ne repasse pas par le proxy).
  await exigerAcces("/staff");
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
        actions={
          <>
            <Bouton variante="secondaire" href="/staff/scanner">
              Scanner une carte
            </Bouton>
            <Bouton href="/staff/membres">Ajouter un membre</Bouton>
          </>
        }
      />

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
