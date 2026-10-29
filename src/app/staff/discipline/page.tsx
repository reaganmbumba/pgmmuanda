import Link from "next/link";
import { Carte, EnTete } from "@/components/ui/Carte";
import { Vide } from "@/components/ui/Champ";
import { voitTout } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { lienWhatsAppVers } from "@/lib/cotisations/mois";
import { listerSanctions, membresAbsents } from "@/lib/discipline/depot";
import { messageRappelAbsences, SEUIL_ABSENCES } from "@/lib/discipline/libelles";
import { formatDate, formatDateHeure } from "@/lib/format";
import { dansJours } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { RappelAbsences } from "./Formulaires";
import { ListeSanctions } from "./ListeSanctions";

export const metadata = { title: "Discipline" };

const PERIODES = [30, 90] as const;

export default async function PageDiscipline({ searchParams }: { searchParams: Promise<{ vue?: string; jours?: string }> }) {
  const moi = await exigerAcces("/staff/discipline");
  const description = "Membres souvent absents sans motif, et sanctions prévues par le Règlement intérieur.";
  if (!supabaseActif || !moi) {
    return (
      <>
        <EnTete titre="Discipline" description={description} />
        <Vide>En mode maquette, la discipline est désactivée : elle fonctionne une fois la base de données configurée.</Vide>
      </>
    );
  }
  const admin = voitTout(moi.role);
  const p = await searchParams;
  const vue = admin && p.vue === "sanctions" ? "sanctions" : "absences";
  const jours = Number(p.jours) === 90 ? 90 : 30;

  const onglets = (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
        {([["absences", "Absences sans motif"], ...(admin ? [["sanctions", "Sanctions"]] : [])] as [string, string][]).map(([v, texte]) => (
          <Link key={v} href={`/staff/discipline?vue=${v}`} aria-current={v === vue ? "page" : undefined}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${v === vue ? "bg-marine-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{texte}</Link>
        ))}
      </div>
      {vue === "absences" && (
        <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
          {PERIODES.map((j) => (
            <Link key={j} href={`/staff/discipline?jours=${j}`} aria-current={j === jours ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${j === jours ? "bg-or-500 text-marine-950" : "text-slate-600 hover:bg-slate-50"}`}>{j} jours</Link>
          ))}
        </div>
      )}
    </div>
  );

  if (vue === "sanctions") {
    const sanctions = await listerSanctions();
    return (
      <>
        <EnTete titre="Discipline" description={description} />
        {onglets}
        {sanctions.length === 0
          ? <Vide>Aucune sanction enregistrée. Pour en noter une, ouvrez la fiche du membre.</Vide>
          : <Carte><ListeSanctions sanctions={sanctions} avecMembre /></Carte>}
        <p className="mt-4 text-xs text-slate-500">Seuls l&apos;administration et le Président de l&apos;antenne voient les sanctions. Pour en noter une, ouvrez la fiche du membre, partie « Discipline ».</p>
      </>
    );
  }

  const absents = await membresAbsents(dansJours(-jours));
  return (
    <>
      <EnTete titre="Discipline" description={description} />
      {onglets}
      <p className="mb-4 rounded-xl border border-or-400/60 bg-or-100/50 p-3 text-sm text-marine-900">
        Règlement intérieur, art. 27 : « toute absence ou retard non justifié dans les différentes activités » ne peut être toléré.
        Ici : les membres actifs avec au moins {SEUIL_ABSENCES} absences marquées « Absent » (et non « Excusé ») ces {jours} derniers jours.
      </p>
      {absents.length === 0 ? (
        <Vide>Aucun membre n&apos;a {SEUIL_ABSENCES} absences sans motif ou plus sur cette période.</Vide>
      ) : (
        <Carte>
          <ul className="divide-y divide-slate-100">
            {absents.map((m) => (
              <li key={m.membreId} className="flex flex-wrap items-start justify-between gap-3 py-3" data-absent={m.nom}>
                <div className="min-w-0">
                  <Link href={`/staff/membres/${m.membreId}`} className="font-medium text-marine-900 hover:underline">{m.nom}</Link>
                  <p className="text-xs text-slate-500"><span className="font-mono">{m.matricule}</span>{m.paroisse && ` · ${m.paroisse}`}</p>
                  <p className="mt-1 text-sm font-semibold text-red-700" data-nb-absences>{m.absences.length} absences sans motif</p>
                  <ul className="mt-1 text-xs text-slate-500">
                    {m.absences.slice(0, 5).map((a) => <li key={a.date + a.titre}>{formatDate(a.date)} · {a.titre}</li>)}
                  </ul>
                </div>
                <RappelAbsences membreId={m.membreId} nom={m.nom} nombre={m.absences.length}
                  whatsapp={lienWhatsAppVers(m.telephone, messageRappelAbsences(m.prenom, m.absences.length, jours))}
                  dernier={m.rappel ? `Rappel envoyé le ${formatDateHeure(m.rappel.le)}${m.rappel.par ? ` par ${m.rappel.par}` : ""}` : null} />
              </li>
            ))}
          </ul>
        </Carte>
      )}
    </>
  );
}
