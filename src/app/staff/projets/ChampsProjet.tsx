import { Champ } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import type { Projet } from "@/lib/organisation/depot";
import { STATUTS_PROJET } from "@/lib/organisation/libelles";

export function ChampsProjet({ p, commissions, commissionFixe }: {
  p?: Projet; commissions: { id: string; nom: string }[]; commissionFixe?: string | null;
}) {
  return (
    <>
      <Champ libelle="Nom du projet *" className="sm:col-span-2">
        <input name="titre" required maxLength={150} defaultValue={p?.titre} className={classeChamp} placeholder="Ex. Achat de pupitres" />
      </Champ>
      <Champ libelle="Commission">
        {commissionFixe ? (
          <>
            <input type="hidden" name="commissionId" value={commissionFixe} />
            <input disabled value={commissions.find((c) => c.id === commissionFixe)?.nom ?? ""} className={classeChamp} />
          </>
        ) : (
          <select name="commissionId" defaultValue={p?.commissionId ?? ""} className={classeChamp}>
            <option value="">Aucune (projet de la présidence)</option>
            {commissions.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        )}
      </Champ>
      <Champ libelle="Responsable du projet">
        <input name="responsable" maxLength={120} defaultValue={p?.responsable} className={classeChamp} />
      </Champ>
      <Champ libelle="Début"><input name="debut" type="date" defaultValue={p?.debut ?? ""} className={classeChamp} /></Champ>
      <Champ libelle="Fin prévue"><input name="finPrevue" type="date" defaultValue={p?.finPrevue ?? ""} className={classeChamp} /></Champ>
      <Champ libelle="Budget en francs (FC)"><input name="budgetCdf" inputMode="decimal" defaultValue={p?.budgetCdf ?? 0} className={classeChamp} /></Champ>
      <Champ libelle="Budget en dollars ($)"><input name="budgetUsd" inputMode="decimal" defaultValue={p?.budgetUsd ?? 0} className={classeChamp} /></Champ>
      <Champ libelle="Statut">
        <select name="statut" defaultValue={p?.statutCode ?? "planifie"} className={classeChamp}>
          {Object.entries(STATUTS_PROJET).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Champ>
      <Champ libelle="Description" className="sm:col-span-2">
        <textarea name="description" rows={3} maxLength={3000} defaultValue={p?.description} className={classeChamp} />
      </Champ>
    </>
  );
}
