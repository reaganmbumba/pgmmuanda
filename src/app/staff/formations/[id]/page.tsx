import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, MapPin, Save, User, UserPlus, Users } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { Badge } from "@/components/ui/Badge";
import { Carte, EnTete } from "@/components/ui/Carte";
import { Champ } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import { FormulaireRapide, Repliable } from "@/components/ui/FormulaireRapide";
import { estAdmin } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { formatDateHeure, formatHeure, nomComplet } from "@/lib/format";
import { listerMembres } from "@/lib/membres/depot";
import { inscriptionsFormation, lireFormation } from "@/lib/organisation/depot";
import { STATUTS_INSCRIPTION } from "@/lib/organisation/libelles";
import { lireCommissions } from "@/lib/programmes/depot";
import { jourLocal } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { changerStatutFormation, desinscrire, enregistrerFormation, evaluer, inscrireMembres } from "../actions";
import { ChampsFormation } from "../ChampsFormation";

export const metadata = { title: "Formation" };

export default async function PageFormation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const moi = await exigerAcces("/staff/formations");
  if (!supabaseActif || !moi) redirect("/staff/formations");
  const f = await lireFormation(id);
  if (!f) notFound();
  const gerable = estAdmin(moi.role) || (moi.role === "responsable_commission" && !!f.commissionId && f.commissionId === moi.commissionId);
  const [inscrits, commissions, membres] = await Promise.all([
    inscriptionsFormation(id), lireCommissions(), gerable ? listerMembres() : Promise.resolve([]),
  ]);
  const deja = new Set(inscrits.map((i) => i.membreId));
  const candidats = membres.filter((m) => !deja.has(m.id) && m.statutCode === "actif");
  const parParoisse = new Map<string, typeof candidats>();
  for (const m of candidats) parParoisse.set(m.paroisse, [...(parParoisse.get(m.paroisse) ?? []), m]);
  const annulee = f.statutCode === "annulee";
  const notes = inscrits.filter((i) => i.note !== null).map((i) => i.note!);
  const moyenne = notes.length ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1).replace(".", ",") : null;

  return (
    <>
      <EnTete titre={f.titre} description={f.commission || "Formation générale"} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <Carte titre="Détails">
            <div className="mb-3"><Badge>{f.statut}</Badge></div>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-2"><CalendarDays className="size-4 shrink-0 text-or-500" aria-hidden />
                {formatDateHeure(f.debut)}{f.fin && ` – ${jourLocal(f.fin) === jourLocal(f.debut) ? formatHeure(f.fin) : formatDateHeure(f.fin)}`}</li>
              {f.lieu && <li className="flex gap-2"><MapPin className="size-4 shrink-0 text-or-500" aria-hidden />{f.lieu}</li>}
              {f.formateur && <li className="flex gap-2"><User className="size-4 shrink-0 text-or-500" aria-hidden />{f.formateur}</li>}
              <li className="flex gap-2"><Users className="size-4 shrink-0 text-or-500" aria-hidden />
                {inscrits.length} inscrit{inscrits.length > 1 ? "s" : ""}{f.places ? ` sur ${f.places} places` : ""}</li>
            </ul>
            {f.description && <p className="mt-4 whitespace-pre-line text-sm text-slate-600">{f.description}</p>}
            {gerable && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <ActionConfirmee action={changerStatutFormation} champs={{ id, statut: "en_cours" }} masquer={annulee || f.statutCode === "en_cours"}
                  libelle="Marquer en cours" question="La formation a-t-elle commencé ?" />
                <ActionConfirmee action={changerStatutFormation} champs={{ id, statut: "terminee" }} masquer={annulee || f.statutCode === "terminee"}
                  libelle="Marquer terminée" question="La formation est-elle terminée ?" />
                <ActionConfirmee action={changerStatutFormation} champs={{ id, statut: "annulee" }} masquer={annulee} danger
                  libelle="Annuler la formation" question="Annuler ? Les inscrits seront prévenus." />
              </div>
            )}
          </Carte>
          {gerable && (
            <Repliable titre="Modifier la formation">
              <FormulaireRapide action={enregistrerFormation} champs={{ id }} libelle="Enregistrer" garder grille={false} icone={<Save className="size-4" aria-hidden />}>
                <ChampsFormation f={f} commissions={commissions} commissionFixe={estAdmin(moi.role) ? undefined : moi.commissionId} />
              </FormulaireRapide>
            </Repliable>
          )}
        </div>

        <div className="space-y-6 xl:col-span-2">
          <Carte titre="Inscrits et évaluations" action={moyenne && <span className="text-sm text-slate-500">Moyenne : <strong className="text-marine-900">{moyenne} / 20</strong></span>}>
            {inscrits.length === 0 ? <p className="text-sm text-slate-500">Personne n&apos;est encore inscrit.</p> : (
              <ul className="divide-y divide-slate-100">
                {inscrits.map((i) => (
                  <li key={i.membreId} className="py-3" data-inscrit={i.matricule}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-marine-900">{i.nom}</p>
                        <p className="text-xs text-slate-500">{i.matricule} · {i.paroisse}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {i.note !== null && <span className="text-sm font-semibold text-marine-900">{String(i.note).replace(".", ",")} / 20</span>}
                        <Badge>{i.statut}</Badge>
                      </div>
                    </div>
                    {i.appreciation && <p className="mt-1 text-sm text-slate-600">« {i.appreciation} »</p>}
                    {gerable && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium text-marine-700">Évaluer</summary>
                        <FormulaireRapide action={evaluer} champs={{ formationId: id, membreId: i.membreId }} libelle="Enregistrer l'évaluation" garder className="mt-3 rounded-xl bg-slate-50 p-4">
                          <Champ libelle="Résultat">
                            <select name="statut" defaultValue={i.statutCode} className={classeChamp}>
                              {Object.entries(STATUTS_INSCRIPTION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                          </Champ>
                          <Champ libelle="Note sur 20">
                            <input name="note" inputMode="decimal" defaultValue={i.note ?? ""} className={classeChamp} placeholder="Ex. 14,5" />
                          </Champ>
                          <Champ libelle="Appréciation" className="sm:col-span-2">
                            <input name="appreciation" maxLength={1000} defaultValue={i.appreciation} className={classeChamp} />
                          </Champ>
                        </FormulaireRapide>
                        <ActionConfirmee action={desinscrire} champs={{ formationId: id, membreId: i.membreId }} danger className="mt-2"
                          libelle="Retirer l'inscription" question={`Retirer ${i.nom} de la formation ?`} />
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Carte>
          {gerable && !annulee && (
            <Repliable titre="Inscrire des membres">
              <FormulaireRapide action={inscrireMembres} champs={{ formationId: id }} libelle="Inscrire les membres cochés" grille={false}
                icone={<UserPlus className="size-4" aria-hidden />} sansBouton={candidats.length === 0}>
                {candidats.length === 0 ? <p className="text-sm text-slate-500">Tous les membres actifs sont déjà inscrits.</p> : (
                  <div className="max-h-80 space-y-4 overflow-y-auto rounded-xl border border-slate-200 p-3">
                    {[...parParoisse].map(([paroisse, liste]) => (
                      <fieldset key={paroisse}>
                        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">{paroisse}</legend>
                        <div className="mt-1 grid gap-1 sm:grid-cols-2">
                          {liste.map((m) => (
                            <label key={m.id} className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm hover:bg-slate-50">
                              <input type="checkbox" name="membreId" value={m.id} className="size-4 accent-marine-900" />
                              {nomComplet(m)} <span className="text-xs text-slate-400">{m.matricule}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                )}
              </FormulaireRapide>
            </Repliable>
          )}
        </div>
      </div>
      <p className="mt-6 text-sm"><Link href="/staff/formations" className="text-marine-700 hover:underline">← Toutes les formations</Link></p>
    </>
  );
}
