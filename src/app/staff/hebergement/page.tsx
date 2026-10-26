import { BedDouble, CalendarCheck, Plus } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { Badge } from "@/components/ui/Badge";
import { Carte, EnTete } from "@/components/ui/Carte";
import { Champ, Vide } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import { FormulaireRapide, Repliable } from "@/components/ui/FormulaireRapide";
import { exigerAcces } from "@/lib/auth/session";
import { affectationsDemo, chambresDemo } from "@/lib/demo-data";
import { nomComplet } from "@/lib/format";
import { listerMembres } from "@/lib/membres/depot";
import { listerAffectations, listerChambres, type Affectation, type Chambre } from "@/lib/organisation/depot";
import { formatJour, formatPeriode, occupation } from "@/lib/organisation/libelles";
import { jourLocal } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { affecter, annulerAffectation, basculerChambre, creerChambre } from "./actions";

export const metadata = { title: "Chambres et hébergement" };

const SEXE = { M: "Hommes", F: "Femmes" } as const;

function Chambres({ chambres, affectations, jour, gestion }: { chambres: Chambre[]; affectations: Affectation[]; jour: string; gestion: boolean }) {
  if (chambres.length === 0) return <Vide>Aucune chambre enregistrée. Ajoutez la première chambre ci-dessus.</Vide>;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {chambres.map((c) => {
        const occ = occupation(affectations.filter((a) => a.chambreId === c.id), jour);
        const libres = c.capacite - occ;
        return (
          <li key={c.id} className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ${c.active ? "" : "opacity-60"}`} data-chambre={c.nom}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-marine-50 p-2.5 text-marine-800"><BedDouble className="size-5" aria-hidden /></span>
                <div><p className="font-semibold text-marine-900">{c.nom}</p><p className="text-xs text-slate-500">{c.site || "Lieu non précisé"}</p></div>
              </div>
              <Badge ton={c.sexe ? "marine" : "gris"}>{c.sexe ? SEXE[c.sexe] : "Mixte"}</Badge>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-sm text-slate-600"><span className="text-2xl font-bold text-marine-900">{occ}</span> / {c.capacite} occupée{c.capacite > 1 ? "s" : ""}</p>
              <Badge ton={!c.active ? "gris" : libres > 0 ? "vert" : "rouge"}>{!c.active ? "Hors service" : libres > 0 ? `${libres} libre${libres > 1 ? "s" : ""}` : "Complète"}</Badge>
            </div>
            {c.notes && <p className="mt-2 text-xs text-slate-500">{c.notes}</p>}
            {gestion && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <ActionConfirmee action={basculerChambre} champs={{ id: c.id, active: c.active ? "non" : "oui" }}
                  libelle={c.active ? "Ne plus utiliser" : "Réutiliser"} question={c.active ? "Retirer cette chambre des choix ?" : "Remettre cette chambre en service ?"} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default async function PageHebergement({ searchParams }: { searchParams: Promise<{ jour?: string }> }) {
  const moi = await exigerAcces("/staff/hebergement");
  const description = "Chambres, places libres et choristes logés. Visible seulement par l'administration.";
  const aujourdhui = jourLocal(new Date().toISOString());
  if (!supabaseActif || !moi) {
    return (<><EnTete titre="Chambres et hébergement" description={description} />
      <Chambres chambres={chambresDemo} affectations={affectationsDemo} jour={affectationsDemo[0]?.du ?? aujourdhui} gestion={false} /></>);
  }
  const { jour: j } = await searchParams;
  const jour = /^\d{4}-\d{2}-\d{2}$/.test(j ?? "") ? j! : aujourdhui;
  const [chambres, affectations, membres] = await Promise.all([listerChambres(), listerAffectations({ depuis: jour < aujourdhui ? jour : aujourdhui }), listerMembres()]);
  const actives = chambres.filter((c) => c.active);
  const sejours = affectations.filter((a) => a.au >= aujourdhui);

  return (
    <>
      <EnTete titre="Chambres et hébergement" description={description} />
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Repliable titre="Loger un choriste">
          {actives.length === 0 ? <p className="text-sm text-slate-500">Ajoutez d&apos;abord une chambre.</p> : (
            <FormulaireRapide action={affecter} libelle="Attribuer la chambre" icone={<CalendarCheck className="size-4" aria-hidden />}>
              <Champ libelle="Choriste *" className="sm:col-span-2">
                <select name="membreId" required defaultValue="" className={classeChamp}>
                  <option value="" disabled>Choisir un choriste</option>
                  {[...membres].sort((a, b) => a.nom.localeCompare(b.nom, "fr")).map((m) => (
                    <option key={m.id} value={m.id}>{nomComplet(m)} ({m.matricule}{m.sexe ? `, ${m.sexe === "M" ? "homme" : "femme"}` : ""})</option>
                  ))}
                </select>
              </Champ>
              <Champ libelle="Chambre *" className="sm:col-span-2">
                <select name="chambreId" required defaultValue="" className={classeChamp}>
                  <option value="" disabled>Choisir une chambre</option>
                  {actives.map((c) => <option key={c.id} value={c.id}>{c.nom}{c.site && ` – ${c.site}`} ({c.sexe ? SEXE[c.sexe] : "mixte"}, {c.capacite} places)</option>)}
                </select>
              </Champ>
              <Champ libelle="Arrivée *"><input name="du" type="date" required defaultValue={jour} className={classeChamp} /></Champ>
              <Champ libelle="Départ *"><input name="au" type="date" required defaultValue={jour} className={classeChamp} /></Champ>
              <Champ libelle="Remarque" className="sm:col-span-2"><input name="notes" maxLength={300} className={classeChamp} /></Champ>
            </FormulaireRapide>
          )}
        </Repliable>
        <Repliable titre="Ajouter une chambre">
          <FormulaireRapide action={creerChambre} libelle="Ajouter la chambre" icone={<Plus className="size-4" aria-hidden />}>
            <Champ libelle="Nom ou numéro *"><input name="nom" required maxLength={60} className={classeChamp} placeholder="Ex. Chambre 12" /></Champ>
            <Champ libelle="Bâtiment ou lieu"><input name="site" maxLength={120} className={classeChamp} placeholder="Ex. Internat de Muanda" /></Champ>
            <Champ libelle="Nombre de places *"><input name="capacite" type="number" min={1} max={100} required defaultValue={2} className={classeChamp} /></Champ>
            <Champ libelle="Pour qui ?">
              <select name="sexe" defaultValue="" className={classeChamp}>
                <option value="">Mixte ou famille</option><option value="M">Hommes</option><option value="F">Femmes</option>
              </select>
            </Champ>
            <Champ libelle="Remarque" className="sm:col-span-2"><input name="notes" maxLength={500} className={classeChamp} /></Champ>
          </FormulaireRapide>
        </Repliable>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-marine-900">Occupation le {formatJour(jour)}</h2>
        <form className="flex items-center gap-2 text-sm">
          <label htmlFor="jour" className="text-slate-600">Voir un autre jour :</label>
          <input id="jour" name="jour" type="date" defaultValue={jour} className="rounded-lg border border-slate-300 px-2 py-1.5" />
          <button className="rounded-lg bg-marine-900 px-3 py-1.5 font-medium text-white">Afficher</button>
        </form>
      </div>
      <Chambres chambres={chambres} affectations={affectations} jour={jour} gestion />

      <Carte titre="Choristes logés (séjours en cours et à venir)" className="mt-6">
        {sejours.length === 0 ? <p className="text-sm text-slate-500">Personne n&apos;est logé pour le moment.</p> : (
          <ul className="divide-y divide-slate-100">
            {sejours.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3" data-affectation={a.matricule}>
                <div>
                  <p className="font-medium text-marine-900">{a.nom} <span className="text-xs font-normal text-slate-500">{a.matricule} · {a.paroisse}</span></p>
                  <p className="text-sm text-slate-600">{a.chambre}{a.site && ` (${a.site})`} · {formatPeriode(a.du, a.au)}</p>
                  {a.notes && <p className="text-xs text-slate-500">{a.notes}</p>}
                </div>
                <ActionConfirmee action={annulerAffectation} champs={{ id: a.id }} danger libelle="Annuler" question={`Annuler l'hébergement de ${a.nom} ?`} />
              </li>
            ))}
          </ul>
        )}
      </Carte>
    </>
  );
}
