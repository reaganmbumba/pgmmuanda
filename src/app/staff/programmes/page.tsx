import Link from "next/link";
import { CalendarPlus, ChevronLeft, ChevronRight, MapPin, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Bouton } from "@/components/ui/Bouton";
import { EnTete } from "@/components/ui/Carte";
import { activites as activitesDemo } from "@/lib/demo-data";
import { exigerAcces } from "@/lib/auth/session";
import { peutGererProgramme } from "@/lib/auth/roles";
import { formatHeure } from "@/lib/format";
import { lireOrganisation } from "@/lib/membres/depot";
import { decrireCiblage, listerActivites, type Activite } from "@/lib/programmes/depot";
import { depuisSaisieLocale, jourLocal } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Programmes" };

const TZ = { timeZone: "Africa/Kinshasa" } as const;
const jour = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", ...TZ });
const mois = new Intl.DateTimeFormat("fr-FR", { month: "short", ...TZ });
const moisLong = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

type Params = { vue?: string; periode?: string; mois?: string };

function Onglets({ liens }: { liens: { href: string; libelle: string; actif: boolean }[] }) {
  return (
    <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
      {liens.map((l) => (
        <Link key={l.href} href={l.href} aria-current={l.actif ? "page" : undefined}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${l.actif ? "bg-marine-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
          {l.libelle}
        </Link>
      ))}
    </div>
  );
}

type Resume = Pick<Activite, "titre" | "description" | "debut" | "lieu" | "responsable" | "statut">;

function LigneActivite({ a, cibles, href }: { a: Resume; cibles?: string; href?: string }) {
  const d = new Date(a.debut);
  const contenu = (
    <>
      <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-marine-900 py-2 text-white">
        <span className="text-2xl font-bold leading-none">{jour.format(d)}</span>
        <span className="text-xs uppercase text-or-400">{mois.format(d)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="font-semibold text-marine-900">{a.titre}</p>
          <Badge>{a.statut}</Badge>
        </div>
        {a.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{a.description}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>{formatHeure(a.debut)}</span>
          {a.lieu && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{a.lieu}</span>}
          {a.responsable && <span className="inline-flex items-center gap-1"><User className="size-3.5" aria-hidden />{a.responsable}</span>}
          {cibles && <span className="inline-flex items-center gap-1"><Users className="size-3.5" aria-hidden />{cibles}</span>}
        </div>
      </div>
    </>
  );
  const cls = "flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm";
  return <li>{href ? <Link href={href} className={`${cls} hover:border-marine-300`}>{contenu}</Link> : <div className={cls}>{contenu}</div>}</li>;
}

const cleMois = (annee: number, m: number) => {
  const d = new Date(Date.UTC(annee, m - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

/** Grille du mois (lundi en premier), à l'heure de Muanda. */
function Calendrier({ annee, mois: m, activites }: { annee: number; mois: number; activites: Activite[] }) {
  const decalage = (new Date(Date.UTC(annee, m - 1, 1)).getUTCDay() + 6) % 7;
  const nbJours = new Date(Date.UTC(annee, m, 0)).getUTCDate();
  const cases = Array.from({ length: Math.ceil((decalage + nbJours) / 7) * 7 }, (_, i) => i - decalage + 1);
  const aujourdhui = jourLocal(new Date().toISOString());
  const cle = (j: number) => `${cleMois(annee, m)}-${String(j).padStart(2, "0")}`;
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-xs font-semibold uppercase text-slate-500">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((j) => <div key={j} className="py-2">{j}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cases.map((j, i) => {
            const dansLeMois = j >= 1 && j <= nbJours;
            const duJour = dansLeMois ? activites.filter((a) => jourLocal(a.debut) === cle(j)) : [];
            return (
              <div key={i} className={`min-h-24 border-b border-r border-slate-100 p-1.5 ${dansLeMois ? "" : "bg-slate-50/60"}`}>
                {dansLeMois && (
                  <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${cle(j) === aujourdhui ? "bg-or-500 font-bold text-marine-950" : "text-slate-500"}`}>{j}</span>
                )}
                <ul className="mt-1 space-y-1">
                  {duJour.map((a) => (
                    <li key={a.id}>
                      <Link href={`/staff/programmes/${a.id}`} title={a.titre}
                        className={`block truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium ${a.statutCode === "annulee" ? "bg-red-50 text-red-700 line-through" : "bg-marine-50 text-marine-800 hover:bg-marine-100"}`}>
                        {formatHeure(a.debut)} {a.titre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default async function PageProgrammes({ searchParams }: { searchParams: Promise<Params> }) {
  const moi = await exigerAcces("/staff/programmes");
  if (!supabaseActif || !moi) return <ProgrammesDemo />;
  const p = await searchParams;
  const vue = p.vue === "calendrier" ? "calendrier" : "liste";
  const passees = p.periode === "passees";
  const organisation = await lireOrganisation();

  const aujourdhui = jourLocal(new Date().toISOString());
  const debutDuJour = depuisSaisieLocale(`${aujourdhui}T00:00`);
  const [annee, m] = (/^\d{4}-(0[1-9]|1[0-2])$/.test(p.mois ?? "") ? p.mois! : aujourdhui.slice(0, 7)).split("-").map(Number);

  const activites = vue === "calendrier"
    ? await listerActivites({
        depuis: depuisSaisieLocale(`${cleMois(annee, m)}-01T00:00`),
        avant: depuisSaisieLocale(`${cleMois(annee, m + 1)}-01T00:00`),
      })
    : await listerActivites(passees ? { avant: debutDuJour, decroissant: true, limite: 100 } : { depuis: debutDuJour });

  return (
    <>
      <EnTete
        titre="Programmes"
        description="Activités planifiées de la PGM et des paroisses."
        actions={
          <>
            <Onglets liens={[
              { href: "/staff/programmes", libelle: "Liste", actif: vue === "liste" },
              { href: "/staff/programmes?vue=calendrier", libelle: "Calendrier", actif: vue === "calendrier" },
            ]} />
            {peutGererProgramme(moi.role) && (
              <Bouton href="/staff/programmes/nouvelle"><CalendarPlus className="size-4" aria-hidden /> Nouvelle activité</Bouton>
            )}
          </>
        }
      />
      {vue === "calendrier" ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <Link href={`/staff/programmes?vue=calendrier&mois=${cleMois(annee, m - 1)}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-marine-700 hover:bg-white">
              <ChevronLeft className="size-4" aria-hidden /> Précédent
            </Link>
            <h2 className="text-lg font-semibold capitalize text-marine-900">{moisLong.format(new Date(Date.UTC(annee, m - 1, 1)))}</h2>
            <Link href={`/staff/programmes?vue=calendrier&mois=${cleMois(annee, m + 1)}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-marine-700 hover:bg-white">
              Suivant <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
          <Calendrier annee={annee} mois={m} activites={activites} />
        </>
      ) : (
        <>
          <div className="mb-4">
            <Onglets liens={[
              { href: "/staff/programmes", libelle: "À venir", actif: !passees },
              { href: "/staff/programmes?periode=passees", libelle: "Passées", actif: passees },
            ]} />
          </div>
          {activites.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              {passees ? "Aucune activité passée." : "Aucune activité à venir."}
            </p>
          ) : (
            <ul className="space-y-3">
              {activites.map((a) => {
                const c = decrireCiblage(a.ciblage, organisation);
                return <LigneActivite key={a.id} a={a} cibles={`${c.portee} · ${c.cibles}`} href={`/staff/programmes/${a.id}`} />;
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}

/** Programme de démonstration, affiché uniquement en mode maquette (sans Supabase). */
function ProgrammesDemo() {
  return (
    <>
      <EnTete
        titre="Programmes"
        description="Activités planifiées de la PGM et des paroisses."
        actions={<Bouton><CalendarPlus className="size-4" aria-hidden /> Nouvelle activité</Bouton>}
      />
      <ul className="space-y-3">
        {activitesDemo.map((a) => <LigneActivite key={a.id} a={a} cibles={a.commission} />)}
      </ul>
    </>
  );
}
