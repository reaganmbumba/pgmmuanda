import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { activites, annonces, choristeConnecte as moi, mesPresences } from "@/lib/demo-data";
import { formatDate, formatDateHeure, libelleParoisse } from "@/lib/format";
import { menuChoriste } from "@/lib/navigation";
import { FicheNonReliee } from "@/components/ui/FicheNonReliee";
import { utilisateurCourant } from "@/lib/auth/session";
import { cartesDuMembre } from "@/lib/cartes/depot";
import { maFiche } from "@/lib/membres/depot";
import { mesNotifications } from "@/lib/notifications";
import { listerActivites, listerAnnonces, presencesMembre, taux } from "@/lib/programmes/depot";
import { dansJours, depuisSaisieLocale, jourLocal } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Accueil" };

export default async function AccueilChoriste() {
  if (!supabaseActif) return <AccueilDemo />;
  const u = await utilisateurCourant();
  const fiche = u ? await maFiche(u.id) : null;
  if (!fiche) return <FicheNonReliee />;
  const [cartes, notifications, prochaines, dernieres, presences] = await Promise.all([
    cartesDuMembre(fiche.id), mesNotifications(3),
    listerActivites({ depuis: depuisSaisieLocale(`${jourLocal(dansJours(0))}T00:00`), limite: 3 }), listerAnnonces({ limite: 2 }), presencesMembre(fiche.id),
  ]);
  const active = cartes.find((c) => c.statutCode === "active");
  const prochaine = prochaines.find((a) => a.statutCode !== "annulee");
  const limite = dansJours(-30);
  const recentes = presences.filter((p) => p.date >= limite);
  const tauxPresence = taux(recentes);
  return (
    <div className="space-y-5">
      <Bienvenue prenom={fiche.prenom} nom={fiche.nom} matricule={fiche.matricule}
        etiquettes={[fiche.voix, fiche.fonction, libelleParoisse(fiche.paroisse)].filter(Boolean)} />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Mon statut</p>
          <p className="mt-1 text-2xl font-bold text-marine-900">{fiche.statut}</p>
          <p className="text-xs text-slate-400">membre depuis le {formatDate(fiche.dateAdhesion)}</p>
        </div>
        <Link href="/choriste/carte" className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Ma carte</p>
          {active ? (
            <>
              <p className="mt-1 text-2xl font-bold text-emerald-600">Valide</p>
              <p className="text-xs text-slate-400">depuis le {formatDate(active.dateEmission)}</p>
            </>
          ) : (
            <>
              <p className="mt-1 text-2xl font-bold text-slate-400">Aucune</p>
              <p className="text-xs text-slate-400">pas encore émise par la PGM</p>
            </>
          )}
        </Link>
      </div>

      {prochaine ? (
        <ProchaineActivite titre={prochaine.titre} debut={prochaine.debut} lieu={prochaine.lieu} statut={prochaine.statut} />
      ) : (
        <section className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">Aucune activité prévue pour vous pour le moment.</section>
      )}

      <Link href="/choriste/presences" className="block rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-500">Mes présences (30 jours)</p>
        <p className="mt-1 text-2xl font-bold text-marine-900">{tauxPresence === null ? "—" : `${tauxPresence} %`}</p>
        <p className="text-xs text-slate-400">
          {recentes.length ? `${recentes.filter((p) => p.statutCode === "present").length} présence${recentes.length > 1 ? "s" : ""} sur ${recentes.length} activité${recentes.length > 1 ? "s" : ""}` : "Aucune présence saisie"}
        </p>
      </Link>

      <Raccourcis />

      <DernieresAnnonces liste={dernieres.map((a) => ({ id: a.id, titre: a.titre, type: a.type, date: a.date }))} />

      <section className="rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="font-semibold text-marine-900">Dernières notifications</h2>
          <Link href="/choriste/notifications" className="text-sm font-medium text-marine-700">Tout voir</Link>
        </div>
        {notifications.liste.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-slate-500">Aucune notification pour le moment.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.liste.map((n) => (
              <li key={n.id}>
                <Link href="/choriste/notifications" className="flex items-center gap-3 px-4 py-3">
                  <span className={`size-2 shrink-0 rounded-full ${n.lue ? "bg-slate-200" : "bg-or-500"}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${n.lue ? "text-slate-600" : "font-medium text-marine-900"}`}>{n.titre}</span>
                    <span className="block text-xs text-slate-400">{formatDateHeure(n.date)}</span>
                  </span>
                  <ChevronRight className="size-4 text-slate-300" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}

function Bienvenue({ prenom, nom, matricule, etiquettes }: { prenom: string; nom: string; matricule: string; etiquettes: string[] }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-marine-900 p-5 text-white shadow-lg">
      <div className="absolute -right-10 -top-10 size-36 rounded-full border-8 border-or-500/20" />
      <p className="text-sm text-marine-100/80">Bonjour,</p>
      <p className="text-2xl font-bold">{prenom} {nom}</p>
      <p className="mt-1 font-mono text-sm text-or-400">{matricule}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {etiquettes.map((e) => <span key={e} className="rounded-full bg-white/10 px-3 py-1">{e}</span>)}
      </div>
      <Link
        href="/choriste/qr"
        className="or-degrade mt-5 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-marine-950"
      >
        <QrCode className="size-4" aria-hidden /> Présenter mon QR code
      </Link>
    </section>
  );
}

function ProchaineActivite({ titre, debut, lieu, statut }: { titre: string; debut: string; lieu: string; statut: string }) {
  return (
    <Link href="/choriste/programme" className="block rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-marine-900">Prochaine activité</h2>
        <Badge>{statut}</Badge>
      </div>
      <p className="font-medium text-marine-900">{titre}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
        <CalendarDays className="size-4" aria-hidden /> {formatDateHeure(debut)}
      </p>
      {lieu && (
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="size-4" aria-hidden /> {lieu}
        </p>
      )}
    </Link>
  );
}

function DernieresAnnonces({ liste }: { liste: { id: string; titre: string; type: string; date: string }[] }) {
  return (
    <section className="rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between p-4 pb-2">
        <h2 className="font-semibold text-marine-900">Dernières annonces</h2>
        <Link href="/choriste/annonces" className="text-sm font-medium text-marine-700">Tout voir</Link>
      </div>
      {liste.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-slate-500">Aucune annonce pour le moment.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {liste.map((a) => (
            <li key={a.id}>
              <Link href={`/choriste/annonces#${a.id}`} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Badge>{a.type}</Badge>
                  <p className="mt-1.5 text-sm font-medium text-marine-900">{a.titre}</p>
                  <p className="text-xs text-slate-400">{formatDate(a.date)}</p>
                </div>
                <ChevronRight className="size-4 text-slate-300" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Raccourcis() {
  // Grandes cases, avec un libellé complet : faciles à toucher et à comprendre
  const raccourcis = ["/choriste/qr", "/choriste/chants", "/choriste/formations", "/choriste/documents", "/choriste/chambre", "/choriste/profil"]
    .map((h) => menuChoriste.find((e) => e.href === h)!);
  return (
    <section>
      <h2 className="mb-3 font-semibold text-marine-900">Accès rapide</h2>
      <div className="grid grid-cols-2 gap-3">
        {raccourcis.map(({ href, label, icone: Icone }) => (
          <Link key={href} href={href} className="flex min-h-16 items-center gap-3 rounded-2xl bg-white p-3 shadow-sm active:bg-slate-50">
            <span className="rounded-xl bg-marine-50 p-2.5 text-marine-800">
              <Icone className="size-6" aria-hidden />
            </span>
            <span className="text-sm font-semibold leading-tight text-marine-900">
              {label.replace(" et partitions", "")}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Accueil de démonstration, affiché uniquement en mode maquette (sans Supabase). */
function AccueilDemo() {
  const prochaine = activites[0];
  const presents = mesPresences.filter((p) => p.statut === "Présent").length;
  const tauxDemo = Math.round((presents / mesPresences.length) * 100);
  return (
    <div className="space-y-5">
      <Bienvenue prenom={moi.prenom} nom={moi.nom} matricule={moi.matricule} etiquettes={[moi.voix, moi.fonction, libelleParoisse(moi.paroisse)]} />
      <ProchaineActivite titre={prochaine.titre} debut={prochaine.debut} lieu={prochaine.lieu} statut={prochaine.statut} />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Mes présences</p>
          <p className="mt-1 text-2xl font-bold text-marine-900">{tauxDemo} %</p>
          <p className="text-xs text-slate-400">{presents} sur {mesPresences.length} activités</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Ma carte</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">Valide</p>
          <p className="text-xs text-slate-400">depuis le {formatDate(moi.carte.dateEmission)}</p>
        </div>
      </div>
      <Raccourcis />
      <DernieresAnnonces liste={annonces.slice(0, 2)} />
    </div>
  );
}
