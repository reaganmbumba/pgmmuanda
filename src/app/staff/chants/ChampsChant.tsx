import { Champ } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import { VOIX } from "@/lib/membres/libelles";
import type { Chant } from "@/lib/organisation/depot";
import { LANGUES } from "@/lib/organisation/libelles";

export function ChampsChant({ c }: { c?: Chant }) {
  return (
    <>
      <Champ libelle="Titre *" className="sm:col-span-2"><input name="titre" required maxLength={150} defaultValue={c?.titre} className={classeChamp} /></Champ>
      <Champ libelle="Auteur ou compositeur"><input name="auteur" maxLength={120} defaultValue={c?.auteur} className={classeChamp} /></Champ>
      <Champ libelle="Langue">
        <select name="langue" defaultValue={c?.langue ?? "Français"} className={classeChamp}>
          {LANGUES.map((l) => <option key={l}>{l}</option>)}
          {c && !LANGUES.includes(c.langue) && <option>{c.langue}</option>}
        </select>
      </Champ>
      <Champ libelle="Catégorie"><input name="categorie" maxLength={60} defaultValue={c?.categorie} className={classeChamp} placeholder="Ex. Louange, Noël, Communion" /></Champ>
      <fieldset>
        <legend className="text-sm font-medium text-marine-900">Pour quelles voix ?</legend>
        <p className="text-xs text-slate-500">Ne cochez rien si le chant est pour toutes les voix.</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {Object.entries(VOIX).map(([k, v]) => (
            <label key={k} className="flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm has-checked:border-marine-700 has-checked:bg-marine-50">
              <input type="checkbox" name="voix" value={k} defaultChecked={c?.voixCodes.includes(k as keyof typeof VOIX)} className="accent-marine-900" /> {v}
            </label>
          ))}
        </div>
      </fieldset>
      <Champ libelle="Lien vers la partition" aide="Adresse https:// (Google Drive, Dropbox…), en mode « lecture seule ».">
        <input name="lienPartition" type="url" maxLength={500} defaultValue={c?.lienPartition ?? ""} className={classeChamp} placeholder="https://" />
      </Champ>
      <Champ libelle="Lien vers l'enregistrement" aide="Adresse https:// (YouTube, Drive…).">
        <input name="lienAudio" type="url" maxLength={500} defaultValue={c?.lienAudio ?? ""} className={classeChamp} placeholder="https://" />
      </Champ>
      <Champ libelle="Paroles" className="sm:col-span-2">
        <textarea name="paroles" rows={8} maxLength={20000} defaultValue={c?.paroles} className={classeChamp} />
      </Champ>
    </>
  );
}
