import { Champ } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import type { Formation } from "@/lib/organisation/depot";
import { STATUTS_FORMATION } from "@/lib/organisation/libelles";
import { versSaisieLocale } from "@/lib/programmes/libelles";

/** Champs d'une formation (création et modification). */
export function ChampsFormation({ f, commissions, commissionFixe }: {
  f?: Formation;
  commissions: { id: string; nom: string }[];
  /** Le responsable de commission organise toujours pour sa commission. */
  commissionFixe?: string | null;
}) {
  return (
    <>
      <Champ libelle="Titre *" className="sm:col-span-2">
        <input name="titre" required maxLength={150} defaultValue={f?.titre} className={classeChamp} placeholder="Ex. Solfège pour débutants" />
      </Champ>
      <Champ libelle="Début * (heure de Muanda)">
        <input name="debut" type="datetime-local" required defaultValue={f ? versSaisieLocale(f.debut) : ""} className={classeChamp} />
      </Champ>
      <Champ libelle="Fin">
        <input name="fin" type="datetime-local" defaultValue={f?.fin ? versSaisieLocale(f.fin) : ""} className={classeChamp} />
      </Champ>
      <Champ libelle="Formateur">
        <input name="formateur" maxLength={120} defaultValue={f?.formateur} className={classeChamp} />
      </Champ>
      <Champ libelle="Lieu">
        <input name="lieu" maxLength={150} defaultValue={f?.lieu} className={classeChamp} />
      </Champ>
      <Champ libelle="Nombre de places" aide="Laissez vide s'il n'y a pas de limite.">
        <input name="places" type="number" min={1} max={1000} defaultValue={f?.places ?? ""} className={classeChamp} />
      </Champ>
      <Champ libelle="Commission organisatrice">
        {commissionFixe ? (
          <>
            <input type="hidden" name="commissionId" value={commissionFixe} />
            <input disabled value={commissions.find((c) => c.id === commissionFixe)?.nom ?? ""} className={classeChamp} />
          </>
        ) : (
          <select name="commissionId" defaultValue={f?.commissionId ?? ""} className={classeChamp}>
            <option value="">Aucune (formation générale)</option>
            {commissions.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        )}
      </Champ>
      <Champ libelle="Statut">
        <select name="statut" defaultValue={f?.statutCode ?? "planifiee"} className={classeChamp}>
          {Object.entries(STATUTS_FORMATION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Champ>
      <Champ libelle="Programme de la formation" className="sm:col-span-2">
        <textarea name="description" rows={3} maxLength={3000} defaultValue={f?.description} className={classeChamp} />
      </Champ>
    </>
  );
}
