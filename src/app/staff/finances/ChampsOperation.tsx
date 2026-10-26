import { Champ } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import { CATEGORIES_FINANCES, DEVISES, SENS_OPERATION } from "@/lib/organisation/libelles";
import { jourLocal } from "@/lib/programmes/libelles";

/** Champs d'une entrée ou sortie d'argent. */
export function ChampsOperation({ projets, projetFixe, projetObligatoire }: {
  projets: { id: string; titre: string }[];
  projetFixe?: string;
  /** Le responsable de commission enregistre seulement pour ses projets. */
  projetObligatoire?: boolean;
}) {
  return (
    <>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium text-marine-900">Type *</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {Object.entries(SENS_OPERATION).map(([k, v]) => (
            <label key={k} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm has-checked:border-marine-700 has-checked:bg-marine-50 has-checked:font-semibold">
              <input type="radio" name="sens" value={k} defaultChecked={k === "depense"} className="accent-marine-900" /> {v}
            </label>
          ))}
        </div>
      </fieldset>
      <Champ libelle="Motif *" className="sm:col-span-2">
        <input name="libelle" required maxLength={200} className={classeChamp} placeholder="Ex. Location de la salle" />
      </Champ>
      <Champ libelle="Montant *">
        <input name="montant" required inputMode="decimal" className={classeChamp} placeholder="Ex. 150000" />
      </Champ>
      <Champ libelle="Monnaie *">
        <select name="devise" defaultValue="CDF" className={classeChamp}>
          {Object.entries(DEVISES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Champ>
      <Champ libelle="Catégorie">
        <select name="categorie" defaultValue="Divers" className={classeChamp}>
          {CATEGORIES_FINANCES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Champ>
      <Champ libelle="Date *">
        <input name="dateOperation" type="date" required defaultValue={jourLocal(new Date().toISOString())} className={classeChamp} />
      </Champ>
      {projetFixe ? <input type="hidden" name="projetId" value={projetFixe} /> : (
        <Champ libelle={projetObligatoire ? "Projet *" : "Projet"}>
          <select name="projetId" required={projetObligatoire} defaultValue="" className={classeChamp}>
            <option value="" disabled={projetObligatoire}>{projetObligatoire ? "Choisir un projet" : "Aucun (caisse générale)"}</option>
            {projets.map((p) => <option key={p.id} value={p.id}>{p.titre}</option>)}
          </select>
        </Champ>
      )}
      <Champ libelle="N° du reçu ou de la facture">
        <input name="piece" maxLength={80} className={classeChamp} />
      </Champ>
    </>
  );
}
