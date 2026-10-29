import Link from "next/link";
import { BookOpenCheck, Plus } from "lucide-react";
import { ActionDirecte } from "@/components/ui/ActionDirecte";
import { Badge } from "@/components/ui/Badge";
import { Carte, EnTete } from "@/components/ui/Carte";
import { Champ, Vide } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import { FormulaireRapide, Repliable } from "@/components/ui/FormulaireRapide";
import { estLecteurGeneral, estAdmin } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { lireOrganisation } from "@/lib/membres/depot";
import { lireHoraires, listerSeances } from "@/lib/registre/depot";
import { aujourdhuiMuanda, JOURS, libelleHeure, libelleJour, typePropose, TYPES_SEANCE } from "@/lib/registre/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { enregistrerHoraire, ouvrirRegistre, retirerHoraire } from "./actions";

export const metadata = { title: "Registre de présence" };

const DESCRIPTION = "Chaque chorale coche ses présents et ses absents aux répétitions et aux cultes. Le choriste voit ses absences dans son espace.";

export default async function PageRegistre({ searchParams }: { searchParams: Promise<{ chorale?: string }> }) {
  const moi = await exigerAcces("/staff/registre");
  if (!supabaseActif || !moi) {
    return (<><EnTete titre="Registre de présence" description={DESCRIPTION} />
      <Vide>En mode maquette, le registre est désactivé : il fonctionne une fois la base de données configurée.</Vide></>);
  }
  const { paroisses, chorales: toutes } = await lireOrganisation();
  const nomParoisse = (id: string | null) => (id ? paroisses.find((p) => p.id === id)?.nom ?? "" : "Urbain");
  // Chacun ne voit que les chorales qu'il gère.
  const chorales = toutes
    .filter((c) => estAdmin(moi.role) || estLecteurGeneral(moi.role)
      || (moi.role === "responsable_paroisse" && c.paroisseId !== null && c.paroisseId === moi.paroisseId)
      || (moi.role === "responsable_chorale" && c.id === moi.choraleId))
    .map((c) => ({ ...c, libelle: `${c.nom} (${nomParoisse(c.paroisseId)})` }))
    .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));

  const p = await searchParams;
  const chorale = chorales.find((c) => c.id === p.chorale) ?? (chorales.length === 1 ? chorales[0] : null);
  const choix = chorales.length > 1 && (
    <form method="get" className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <Champ libelle="Chorale" className="min-w-64 flex-1">
        <select name="chorale" defaultValue={chorale?.id ?? ""} aria-label="Chorale" className={classeChamp}>
          <option value="">Choisir la chorale…</option>
          {chorales.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
        </select>
      </Champ>
      <button type="submit" className="inline-flex min-h-11 items-center rounded-xl bg-marine-900 px-5 text-sm font-semibold text-white hover:bg-marine-800">Afficher</button>
    </form>
  );

  if (!chorale) {
    return (<><EnTete titre="Registre de présence" description={DESCRIPTION} />{choix}
      {chorales.length === 0 && <Vide>Aucune chorale à gérer. Les chorales se créent dans « Paroisses ».</Vide>}</>);
  }

  const horaires = await lireHoraires(chorale.id);
  if (!horaires) {
    return (<><EnTete titre="Registre de présence" description={DESCRIPTION} />
      <Vide>Le registre sera disponible après l&apos;exécution du fichier SQL « registre_chorales » dans Supabase.</Vide></>);
  }
  const seances = await listerSeances(chorale.id);
  const aujourdhui = aujourdhuiMuanda();

  return (
    <>
      <EnTete titre={`Registre — ${chorale.libelle}`} description={DESCRIPTION} />
      {choix}
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Carte titre="Ouvrir le registre">
            <FormulaireRapide action={ouvrirRegistre} champs={{ chorale: chorale.id }} libelle="Ouvrir le registre"
              icone={<BookOpenCheck className="size-4" aria-hidden />}>
              <Champ libelle="Date">
                <input type="date" name="jour" required defaultValue={aujourdhui} className={classeChamp} />
              </Champ>
              <Champ libelle="Séance" aide="Un jour inhabituel ? Choisissez simplement la date.">
                <select name="type" defaultValue={typePropose(horaires, aujourdhui)} className={classeChamp}>
                  {Object.entries(TYPES_SEANCE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Champ>
            </FormulaireRapide>
          </Carte>

          <Carte titre="Derniers registres">
            {seances.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun registre pour le moment.</p>
            ) : (
              <ul className="divide-y divide-slate-100" data-registres>
                {seances.map((s) => (
                  <li key={s.id}>
                    <Link href={`/staff/registre/${s.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-slate-50">
                      <span>
                        <span className="block text-sm font-medium text-marine-900">{libelleJour(s.jour)}</span>
                        <span className="text-xs text-slate-500">{TYPES_SEANCE[s.type]}{s.annulee && " · annulée"}</span>
                      </span>
                      <span className="flex flex-wrap gap-1.5 text-xs">
                        <Badge ton="vert">{`${s.presents} présent${s.presents > 1 ? "s" : ""}`}</Badge>
                        <Badge ton="rouge">{`${s.absents} absent${s.absents > 1 ? "s" : ""}`}</Badge>
                        {s.excuses > 0 && <Badge ton="ambre">{`${s.excuses} excusé${s.excuses > 1 ? "s" : ""}`}</Badge>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Carte>
        </div>

        <div className="space-y-5">
          <Carte titre="Jours habituels">
            {horaires.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun jour habituel.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm" data-horaires>
                {horaires.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-2 py-2">
                    <span><span className="font-medium text-marine-900">{JOURS[h.jour]}</span> · {TYPES_SEANCE[h.type]} à {libelleHeure(h.heure)}</span>
                    <ActionDirecte action={retirerHoraire} champs={{ id: h.id }} libelle="Retirer" />
                  </li>
                ))}
              </ul>
            )}
          </Carte>
          <Repliable titre="Ajouter ou changer un jour">
            <FormulaireRapide action={enregistrerHoraire} champs={{ chorale: chorale.id }} libelle="Enregistrer"
              icone={<Plus className="size-4" aria-hidden />} grille={false}>
              <Champ libelle="Jour">
                <select name="jour" required defaultValue="" className={classeChamp}>
                  <option value="">Choisir…</option>
                  {JOURS.slice(1).map((j, i) => <option key={j} value={i + 1}>{j}</option>)}
                </select>
              </Champ>
              <Champ libelle="Séance">
                <select name="type" defaultValue="repetition" className={classeChamp}>
                  {Object.entries(TYPES_SEANCE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Champ>
              <Champ libelle="Heure"><input type="time" name="heure" required defaultValue="17:00" className={classeChamp} /></Champ>
            </FormulaireRapide>
          </Repliable>
        </div>
      </div>
    </>
  );
}
