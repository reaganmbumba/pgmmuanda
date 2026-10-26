import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, FilePlus, ListPlus, Save, User, Wallet } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { ActionDirecte } from "@/components/ui/ActionDirecte";
import { Badge } from "@/components/ui/Badge";
import { Carte, EnTete } from "@/components/ui/Carte";
import { Champ, Progression } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import { FormulaireRapide, Repliable } from "@/components/ui/FormulaireRapide";
import { estAdmin } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { listerOperations, lireProjet, rapportsProjet, tachesProjet } from "@/lib/organisation/depot";
import { bilan, formatJour, formatMontant, type Devise } from "@/lib/organisation/libelles";
import { lireCommissions } from "@/lib/programmes/depot";
import { supabaseActif } from "@/lib/supabase/config";
import { enregistrerOperation } from "../../finances/actions";
import { ChampsOperation } from "../../finances/ChampsOperation";
import { LigneOperation, recusParOperation } from "../../finances/LigneOperation";
import { listerDocuments } from "@/lib/documents/depot";
import { ajouterRapport, ajouterTache, changerStatutProjet, changerStatutTache, enregistrerProjet, supprimerTache } from "../actions";
import { ChampsProjet } from "../ChampsProjet";

export const metadata = { title: "Projet" };

export default async function PageProjet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const moi = await exigerAcces("/staff/projets");
  if (!supabaseActif || !moi) redirect("/staff/projets");
  const p = await lireProjet(id);
  if (!p) notFound();
  const [taches, rapports, operations, commissions] = await Promise.all([
    tachesProjet(id), rapportsProjet(id), listerOperations({ projetId: id }), lireCommissions(),
  ]);
  const b = bilan(operations);
  const recus = recusParOperation(await listerDocuments({ operations: operations.map((o) => o.id) }));
  const budgets: Record<Devise, number> = { CDF: p.budgetCdf, USD: p.budgetUsd };
  const faites = taches.filter((t) => t.statutCode === "terminee").length;

  return (
    <>
      <EnTete titre={p.titre} description={p.commission || "Projet de la présidence"} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <Carte titre="Résumé">
            <div className="mb-4"><Badge>{p.statut}</Badge></div>
            <Progression valeur={p.avancement} />
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {p.responsable && <li className="flex gap-2"><User className="size-4 shrink-0 text-or-500" aria-hidden />{p.responsable}</li>}
              {(p.debut || p.finPrevue) && (
                <li className="flex gap-2"><CalendarDays className="size-4 shrink-0 text-or-500" aria-hidden />
                  {p.debut ? formatJour(p.debut) : "?"} → {p.finPrevue ? formatJour(p.finPrevue) : "?"}</li>
              )}
            </ul>
            {p.description && <p className="mt-4 whitespace-pre-line text-sm text-slate-600">{p.description}</p>}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <ActionConfirmee action={changerStatutProjet} champs={{ id, statut: "termine" }} masquer={p.statutCode === "termine"}
                libelle="Marquer terminé" question="Le projet est-il terminé ?" />
              <ActionConfirmee action={changerStatutProjet} champs={{ id, statut: "suspendu" }} masquer={p.statutCode === "suspendu"}
                libelle="Suspendre" question="Suspendre le projet ?" />
              <ActionConfirmee action={changerStatutProjet} champs={{ id, statut: "annule" }} masquer={p.statutCode === "annule"} danger
                libelle="Annuler le projet" question="Annuler le projet ?" />
            </div>
          </Carte>

          <Carte titre="Budget et dépenses">
            {(["CDF", "USD"] as Devise[]).filter((d) => budgets[d] || b[d].depenses || b[d].recettes).map((d) => (
              <div key={d} className="mb-4 last:mb-0" data-devise={d}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{d === "CDF" ? "Francs congolais" : "Dollars"}</p>
                <dl className="mt-1 space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-500">Budget</dt><dd className="font-medium">{formatMontant(budgets[d], d)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Dépensé</dt><dd className="font-medium text-red-700">{formatMontant(b[d].depenses, d)}</dd></div>
                  {b[d].recettes > 0 && <div className="flex justify-between"><dt className="text-slate-500">Reçu</dt><dd className="font-medium text-emerald-700">{formatMontant(b[d].recettes, d)}</dd></div>}
                  {budgets[d] > 0 && (
                    <div className="flex justify-between border-t border-slate-100 pt-1"><dt className="text-slate-500">Reste du budget</dt>
                      <dd className={`font-semibold ${budgets[d] - b[d].depenses < 0 ? "text-red-700" : "text-marine-900"}`}>{formatMontant(budgets[d] - b[d].depenses, d)}</dd></div>
                  )}
                </dl>
                {budgets[d] > 0 && <div className="mt-2"><Progression valeur={(b[d].depenses / budgets[d]) * 100} libelle="Budget utilisé" /></div>}
              </div>
            ))}
            {!p.budgetCdf && !p.budgetUsd && operations.length === 0 && <p className="text-sm text-slate-500">Aucun budget ni dépense.</p>}
          </Carte>

          <Repliable titre="Modifier le projet">
            <FormulaireRapide action={enregistrerProjet} champs={{ id }} libelle="Enregistrer" garder grille={false} icone={<Save className="size-4" aria-hidden />}>
              <ChampsProjet p={p} commissions={commissions} commissionFixe={estAdmin(moi.role) ? undefined : moi.commissionId} />
            </FormulaireRapide>
          </Repliable>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <Carte titre={`Tâches (${faites}/${taches.length} terminées)`}>
            {taches.length === 0 ? <p className="text-sm text-slate-500">Aucune tâche.</p> : (
              <ul className="divide-y divide-slate-100">
                {taches.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3" data-tache={t.titre}>
                    <div>
                      <p className={`font-medium ${t.statutCode === "terminee" ? "text-slate-400 line-through" : "text-marine-900"}`}>{t.titre}</p>
                      <p className="text-xs text-slate-500">{[t.responsable, t.echeance && `avant le ${formatJour(t.echeance)}`].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{t.statut}</Badge>
                      {t.statutCode === "a_faire" && <ActionDirecte action={changerStatutTache} champs={{ id: t.id, projetId: id, statut: "en_cours" }} libelle="Commencer" />}
                      {t.statutCode !== "terminee" && <ActionDirecte action={changerStatutTache} champs={{ id: t.id, projetId: id, statut: "terminee" }} libelle="Terminer" />}
                      {t.statutCode === "terminee" && <ActionDirecte action={changerStatutTache} champs={{ id: t.id, projetId: id, statut: "en_cours" }} libelle="Rouvrir" />}
                      <ActionConfirmee action={supprimerTache} champs={{ id: t.id, projetId: id }} danger libelle="Supprimer" question="Supprimer cette tâche ?" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <FormulaireRapide action={ajouterTache} champs={{ projetId: id }} libelle="Ajouter la tâche" icone={<ListPlus className="size-4" aria-hidden />}>
                <Champ libelle="Nouvelle tâche *" className="sm:col-span-2"><input name="titre" required maxLength={200} className={classeChamp} placeholder="Ex. Demander trois devis" /></Champ>
                <Champ libelle="Qui s'en occupe ?"><input name="responsable" maxLength={120} className={classeChamp} /></Champ>
                <Champ libelle="À faire avant le"><input name="echeance" type="date" className={classeChamp} /></Champ>
              </FormulaireRapide>
            </div>
          </Carte>

          <Carte titre="Rapports d'avancement">
            <Repliable titre="Écrire un rapport">
              <FormulaireRapide action={ajouterRapport} champs={{ projetId: id }} libelle="Enregistrer le rapport" icone={<FilePlus className="size-4" aria-hidden />}>
                <Champ libelle="Avancement du projet (%) *">
                  <input name="avancement" type="number" min={0} max={100} step={5} required defaultValue={p.avancement} className={classeChamp} />
                </Champ>
                <Champ libelle="Ce qui a été fait *" className="sm:col-span-2">
                  <textarea name="contenu" rows={3} required maxLength={5000} className={classeChamp} />
                </Champ>
              </FormulaireRapide>
            </Repliable>
            {rapports.length > 0 && (
              <ol className="mt-4 space-y-4 border-l-2 border-or-200 pl-4">
                {rapports.map((r) => (
                  <li key={r.id} data-rapport>
                    <p className="text-xs text-slate-500">{formatDate(r.date)}{r.auteur && ` · ${r.auteur}`} · <strong className="text-marine-900">{r.avancement} %</strong></p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{r.contenu}</p>
                  </li>
                ))}
              </ol>
            )}
          </Carte>

          <Carte titre="Argent du projet" action={<Link href="/staff/finances" className="inline-flex items-center gap-1 text-sm text-marine-700 hover:underline"><Wallet className="size-4" aria-hidden />Finances</Link>}>
            {operations.length > 0 && (
              <ul className="mb-4 divide-y divide-slate-100 text-sm">
                {operations.map((o) => <LigneOperation key={o.id} o={o} recus={recus.get(o.id)} supprimable={estAdmin(moi.role)} joindre />)}
              </ul>
            )}
            <Repliable titre="Enregistrer une dépense ou une entrée">
              <FormulaireRapide action={enregistrerOperation} libelle="Enregistrer" icone={<Save className="size-4" aria-hidden />}>
                <ChampsOperation projets={[]} projetFixe={id} />
              </FormulaireRapide>
            </Repliable>
          </Carte>
        </div>
      </div>
      <p className="mt-6 text-sm"><Link href="/staff/projets" className="text-marine-700 hover:underline">← Tous les projets</Link></p>
    </>
  );
}
