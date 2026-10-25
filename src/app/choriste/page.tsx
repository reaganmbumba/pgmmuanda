import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { activites, annonces, choristeConnecte as moi, mesPresences } from "@/lib/demo-data";
import { formatDate, formatDateHeure } from "@/lib/format";
import { menuChoriste } from "@/lib/navigation";

const capitaliser = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export const metadata = { title: "Accueil" };

export default function AccueilChoriste() {
  const prochaine = activites[0];
  const presents = mesPresences.filter((p) => p.statut === "Présent").length;
  const taux = Math.round((presents / mesPresences.length) * 100);
  const raccourcis = menuChoriste.filter((e) =>
    ["/choriste/qr", "/choriste/presences", "/choriste/chants", "/choriste/documents"].includes(e.href),
  );

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-marine-900 p-5 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 size-36 rounded-full border-8 border-or-500/20" />
        <p className="text-sm text-marine-100/80">Bonjour,</p>
        <p className="text-2xl font-bold">{moi.prenom} {moi.nom}</p>
        <p className="mt-1 font-mono text-sm text-or-400">{moi.matricule}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/10 px-3 py-1">{moi.voix}</span>
          <span className="rounded-full bg-white/10 px-3 py-1">{moi.fonction}</span>
          <span className="rounded-full bg-white/10 px-3 py-1">Paroisse {moi.paroisse}</span>
        </div>
        <Link
          href="/choriste/qr"
          className="or-degrade mt-5 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-marine-950"
        >
          <QrCode className="size-4" aria-hidden /> Présenter mon QR code
        </Link>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-marine-900">Prochaine activité</h2>
          <Badge>{prochaine.statut}</Badge>
        </div>
        <p className="font-medium text-marine-900">{prochaine.titre}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <CalendarDays className="size-4" aria-hidden /> {formatDateHeure(prochaine.debut)}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="size-4" aria-hidden /> {prochaine.lieu}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Mes présences</p>
          <p className="mt-1 text-2xl font-bold text-marine-900">{taux} %</p>
          <p className="text-xs text-slate-400">{presents} sur {mesPresences.length} activités</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Ma carte</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">Valide</p>
          <p className="text-xs text-slate-400">depuis le {formatDate(moi.carte.dateEmission)}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-semibold text-marine-900">Accès rapide</h2>
        <div className="grid grid-cols-4 gap-2">
          {raccourcis.map(({ href, label, icone: Icone }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 text-center shadow-sm">
              <span className="rounded-xl bg-marine-50 p-2.5 text-marine-800">
                <Icone className="size-5" aria-hidden />
              </span>
              <span className="text-[11px] font-medium leading-tight text-slate-600">
                {capitaliser(label.replace(/^(Mon|Ma|Mes) /, ""))}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="font-semibold text-marine-900">Dernières annonces</h2>
          <Link href="/choriste/annonces" className="text-sm font-medium text-marine-700">Tout voir</Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {annonces.slice(0, 2).map((a) => (
            <li key={a.id}>
              <Link href="/choriste/annonces" className="flex items-center gap-3 p-4">
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
      </section>
    </div>
  );
}
