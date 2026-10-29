import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Carte, EnTete } from "@/components/ui/Carte";
import { Vide } from "@/components/ui/Champ";
import { estAdmin } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { cotisationsDuMois, montantHabituel } from "@/lib/cotisations/depot";
import { decaler, libelleMois, lienWhatsAppVers, lireMois, messageRappel, moisCourant } from "@/lib/cotisations/mois";
import { formatDateHeure } from "@/lib/format";
import { formatJour, formatMontant, type Devise } from "@/lib/organisation/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { Annuler, Payer, Rappeler } from "./Paiement";

export const metadata = { title: "Cotisations" };

const PAR_PAGE = 100;

export default async function PageCotisations({ searchParams }: { searchParams: Promise<{ mois?: string; vue?: string; q?: string }> }) {
  const moi = await exigerAcces("/staff/cotisations");
  const description = "Chaque membre paie sa cotisation du mois. Le total entre tout seul dans la caisse (Finances).";
  if (!supabaseActif || !moi) {
    return (
      <>
        <EnTete titre="Cotisations" description={description} />
        <Vide>En mode maquette, les cotisations sont désactivées : elles fonctionnent une fois la base de données configurée.</Vide>
      </>
    );
  }
  const p = await searchParams;
  const mois = lireMois(p.mois) ?? moisCourant();
  const vue = p.vue === "payes" ? "payes" : "a_payer";
  const q = (p.q ?? "").trim().toLowerCase();
  const lien = (m: string, v = vue) => `/staff/cotisations?mois=${m.slice(0, 7)}&vue=${v}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  const lignes = await cotisationsDuMois(mois);
  const payes = lignes.filter((l) => l.paiement);
  const habituel = montantHabituel(lignes);
  const totaux = (["CDF", "USD"] as Devise[]).map((d) => ({
    devise: d, total: payes.filter((l) => l.paiement!.devise === d).reduce((s, l) => s + l.paiement!.montant, 0),
  })).filter((t) => t.total > 0);
  const affichees = lignes
    .filter((l) => (vue === "payes" ? l.paiement : !l.paiement))
    .filter((l) => !q || `${l.nom} ${l.matricule}`.toLowerCase().includes(q));
  const admin = estAdmin(moi.role);

  return (
    <>
      <EnTete titre="Cotisations" description={description} />

      <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-marine-900 p-3 text-white">
        <Link href={lien(decaler(mois, -1))} aria-label="Mois précédent" className="rounded-xl p-3 hover:bg-white/10"><ChevronLeft className="size-6" /></Link>
        <p className="text-center text-lg font-bold capitalize" data-mois>{libelleMois(mois)}</p>
        <Link href={lien(decaler(mois, 1))} aria-label="Mois suivant" className="rounded-xl p-3 hover:bg-white/10"><ChevronRight className="size-6" /></Link>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">Ont payé</p>
          <p className="text-3xl font-bold text-emerald-800" data-nb-payes>{payes.length}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">Pas encore payé</p>
          <p className="text-3xl font-bold text-red-800" data-nb-a-payer>{lignes.length - payes.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Reçu ce mois</p>
          <p className="text-xl font-bold text-marine-900">
            {totaux.length ? totaux.map((t) => formatMontant(t.total, t.devise)).join(" + ") : "—"}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
          {([["a_payer", "Pas encore payé"], ["payes", "Ont payé"]] as const).map(([v, texte]) => (
            <Link key={v} href={lien(mois, v)} aria-current={v === vue ? "page" : undefined}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${v === vue ? "bg-marine-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{texte}</Link>
          ))}
        </div>
        <form className="relative min-w-48 flex-1" role="search">
          <input type="hidden" name="mois" value={mois.slice(0, 7)} />
          <input type="hidden" name="vue" value={vue} />
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input type="search" name="q" defaultValue={p.q ?? ""} placeholder="Chercher un nom ou un matricule" aria-label="Chercher un membre"
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-marine-700" />
        </form>
      </div>

      {affichees.length === 0 ? (
        <Vide>{vue === "payes" ? "Personne n'a encore payé ce mois-ci." : q ? "Aucun membre trouvé." : "Tout le monde a payé ce mois-ci."}</Vide>
      ) : (
        <Carte>
          <ul className="divide-y divide-slate-100">
            {affichees.slice(0, PAR_PAGE).map((l) => (
              <li key={l.membreId} className="flex flex-wrap items-center justify-between gap-3 py-3" data-cotisation={l.nom}>
                <div className="min-w-0">
                  <p className="font-medium text-marine-900">{l.nom}</p>
                  <p className="text-xs text-slate-500"><span className="font-mono">{l.matricule}</span>{l.paroisse && ` · ${l.paroisse}`}</p>
                </div>
                {l.paiement ? (
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="font-semibold text-emerald-700">{formatMontant(l.paiement.montant, l.paiement.devise)}</p>
                      <p className="text-xs text-slate-500">le {formatJour(l.paiement.payeLe)}{l.paiement.saisiPar && ` · par ${l.paiement.saisiPar}`}</p>
                    </div>
                    {admin && <Annuler id={l.paiement.id} />}
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <Payer membreId={l.membreId} nom={l.nom} mois={mois} montant={habituel?.montant} devise={habituel?.devise} />
                    <Rappeler membreId={l.membreId} nom={l.nom} mois={mois}
                      whatsapp={lienWhatsAppVers(l.telephone, messageRappel(l.prenom, mois))}
                      dernier={l.rappel ? `Rappel envoyé le ${formatDateHeure(l.rappel.le)}${l.rappel.par ? ` par ${l.rappel.par}` : ""}` : null} />
                  </div>
                )}
              </li>
            ))}
          </ul>
          {affichees.length > PAR_PAGE && (
            <p className="pt-3 text-sm text-slate-500">{affichees.length - PAR_PAGE} autres membres : cherchez un nom pour les trouver.</p>
          )}
        </Carte>
      )}
      <p className="mt-4 text-xs text-slate-500">
        Seuls les membres actifs sont listés.{!admin && " Pour annuler un paiement enregistré par erreur, contactez l'administration."}
      </p>
    </>
  );
}
