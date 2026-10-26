import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, FolderKanban, GraduationCap, Save, UserPlus } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { Badge } from "@/components/ui/Badge";
import { Carte, EnTete } from "@/components/ui/Carte";
import { Champ, Progression } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import { FormulaireRapide, Repliable } from "@/components/ui/FormulaireRapide";
import { estAdmin, peutGererCommission } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { formatDateHeure, nomComplet } from "@/lib/format";
import { listerMembres } from "@/lib/membres/depot";
import { listerFormations, listerProjets, lireCommission, membresCommission } from "@/lib/organisation/depot";
import { FONCTIONS_COMMISSION } from "@/lib/organisation/libelles";
import { listerActivites } from "@/lib/programmes/depot";
import { dansJours } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { ajouterMembreCommission, changerFonction, modifierCommission, retirerMembreCommission } from "../actions";

export const metadata = { title: "Commission" };

function ChoixFonction({ valeur }: { valeur?: string }) {
  return (
    <select name="fonction" defaultValue={valeur ?? "Membre"} className={classeChamp}>
      {FONCTIONS_COMMISSION.map((f) => <option key={f}>{f}</option>)}
      {valeur && !FONCTIONS_COMMISSION.includes(valeur) && <option>{valeur}</option>}
    </select>
  );
}

export default async function PageCommission({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const moi = await exigerAcces("/staff/commissions");
  if (!supabaseActif || !moi) redirect("/staff/commissions");
  const commission = await lireCommission(id);
  if (!commission) notFound();
  const gerable = estAdmin(moi.role) || (moi.role === "responsable_commission" && moi.commissionId === id);
  const [membres, formations, projets, activites, tous] = await Promise.all([
    membresCommission(id),
    listerFormations({ commissionId: id }),
    peutGererCommission(moi.role) ? listerProjets({ commissionId: id }) : Promise.resolve([]),
    listerActivites({ depuis: dansJours(0) }),
    gerable ? listerMembres() : Promise.resolve([]),
  ]);
  const dedans = new Set(membres.map((m) => m.membreId));
  const candidats = tous.filter((m) => !dedans.has(m.id)).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const aVenir = activites.filter((a) => a.commissionId === id).slice(0, 5);

  return (
    <>
      <EnTete titre={commission.nom} description={commission.description || "Commission de la PGM"} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Carte titre={`Membres (${membres.length})`}>
            {membres.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun membre dans cette commission.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {membres.map((m) => (
                  <li key={m.membreId} className="flex flex-wrap items-center justify-between gap-3 py-3" data-membre={m.matricule}>
                    <div>
                      <p className="font-medium text-marine-900">{m.nom}</p>
                      <p className="text-xs text-slate-500">{m.matricule} · {m.paroisse}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge ton={m.fonction === "Membre" ? "gris" : "or"}>{m.fonction}</Badge>
                      {gerable && (
                        <>
                          <ActionConfirmee action={changerFonction} libelle="Changer la fonction" question="Nouvelle fonction :"
                            champs={{ commissionId: id, membreId: m.membreId }}
                            choix={{ nom: "fonction", libelle: "Fonction", options: FONCTIONS_COMMISSION }} />
                          <ActionConfirmee action={retirerMembreCommission} libelle="Retirer" danger
                            question={`Retirer ${m.nom} de la commission ?`} champs={{ commissionId: id, membreId: m.membreId }} />
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Carte>
          {gerable && (
            <Repliable titre="Ajouter un membre">
              <FormulaireRapide action={ajouterMembreCommission} champs={{ commissionId: id }} libelle="Ajouter à la commission"
                icone={<UserPlus className="size-4" aria-hidden />} sansBouton={candidats.length === 0}>
                {candidats.length === 0 ? (
                  <p className="text-sm text-slate-500">Tous les membres font déjà partie de la commission.</p>
                ) : (<>
                  <Champ libelle="Membre *">
                    <select name="membreId" required defaultValue="" className={classeChamp}>
                      <option value="" disabled>Choisir un membre</option>
                      {candidats.map((m) => <option key={m.id} value={m.id}>{nomComplet(m)} ({m.matricule})</option>)}
                    </select>
                  </Champ>
                  <Champ libelle="Fonction"><ChoixFonction /></Champ>
                </>)}
              </FormulaireRapide>
            </Repliable>
          )}
        </div>

        <div className="space-y-6">
          {gerable && (
            <Repliable titre="Modifier la commission">
              <FormulaireRapide action={modifierCommission} champs={{ id }} libelle="Enregistrer" garder grille={false}
                icone={<Save className="size-4" aria-hidden />}>
                <Champ libelle="Nom" aide={estAdmin(moi.role) ? undefined : "Seule l'administration peut changer le nom."}>
                  <input name="nom" required maxLength={120} defaultValue={commission.nom} readOnly={!estAdmin(moi.role)}
                    className={`${classeChamp} read-only:bg-slate-50`} />
                </Champ>
                <Champ libelle="Rôle de la commission">
                  <textarea name="description" rows={3} maxLength={500} defaultValue={commission.description} className={classeChamp} />
                </Champ>
              </FormulaireRapide>
            </Repliable>
          )}
          <Carte titre="Activités à venir">
            {aVenir.length === 0 ? <p className="text-sm text-slate-500">Aucune activité prévue.</p> : (
              <ul className="space-y-3">
                {aVenir.map((a) => (
                  <li key={a.id}><Link href={`/staff/programmes/${a.id}`} className="flex gap-2 text-sm hover:underline">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-or-500" aria-hidden />
                    <span><span className="font-medium text-marine-900">{a.titre}</span><br /><span className="text-xs text-slate-500">{formatDateHeure(a.debut)}</span></span>
                  </Link></li>
                ))}
              </ul>
            )}
          </Carte>
          <Carte titre="Formations">
            {formations.length === 0 ? <p className="text-sm text-slate-500">Aucune formation.</p> : (
              <ul className="space-y-3">
                {formations.slice(0, 5).map((f) => (
                  <li key={f.id}><Link href={`/staff/formations/${f.id}`} className="flex items-start gap-2 text-sm hover:underline">
                    <GraduationCap className="mt-0.5 size-4 shrink-0 text-or-500" aria-hidden />
                    <span className="flex-1 font-medium text-marine-900">{f.titre}</span><Badge>{f.statut}</Badge>
                  </Link></li>
                ))}
              </ul>
            )}
          </Carte>
          {peutGererCommission(moi.role) && (
            <Carte titre="Projets">
              {projets.length === 0 ? <p className="text-sm text-slate-500">Aucun projet.</p> : (
                <ul className="space-y-4">
                  {projets.map((p) => (
                    <li key={p.id}><Link href={`/staff/projets/${p.id}`} className="block text-sm hover:underline">
                      <span className="flex items-center gap-2 font-medium text-marine-900"><FolderKanban className="size-4 text-or-500" aria-hidden />{p.titre}</span>
                      <span className="mt-2 block"><Progression valeur={p.avancement} /></span>
                    </Link></li>
                  ))}
                </ul>
              )}
            </Carte>
          )}
        </div>
      </div>
      <p className="mt-6 text-sm"><Link href="/staff/commissions" className="text-marine-700 hover:underline">← Toutes les commissions</Link></p>
    </>
  );
}
