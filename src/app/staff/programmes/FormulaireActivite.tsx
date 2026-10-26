"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { ChampsCiblage } from "@/components/programmes/ChampsCiblage";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import type { Organisation } from "@/lib/membres/depot";
import type { Activite } from "@/lib/programmes/depot";
import { STATUTS_ACTIVITE, versSaisieLocale } from "@/lib/programmes/libelles";
import { enregistrerActivite } from "./actions";

function Champ({ libelle, children, className = "" }: { libelle: string; children: React.ReactNode; className?: string }) {
  return <label className={`block text-sm font-medium text-marine-900 ${className}`}>{libelle}{children}</label>;
}

export function FormulaireActivite({ activite, organisation, commissions, portees, commissionFixe }: {
  activite?: Activite;
  organisation: Organisation;
  commissions: { id: string; nom: string }[];
  portees: (string | null)[];
  /** Le responsable de commission organise toujours pour sa commission. */
  commissionFixe?: string | null;
}) {
  const [etat, action] = useActionState(enregistrerActivite, undefined);
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={activite?.id ?? ""} />
      <fieldset className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:grid-cols-2">
        <legend className="px-1 text-sm font-semibold text-marine-900">Activité</legend>
        <Champ libelle="Titre *" className="md:col-span-2">
          <input name="titre" required maxLength={150} defaultValue={activite?.titre} className={classeChamp}
            placeholder="Ex. Répétition générale des quatre voix" />
        </Champ>
        <Champ libelle="Début * (heure de Muanda)">
          <input name="debut" type="datetime-local" required defaultValue={activite ? versSaisieLocale(activite.debut) : ""} className={classeChamp} />
        </Champ>
        <Champ libelle="Fin">
          <input name="fin" type="datetime-local" defaultValue={activite?.fin ? versSaisieLocale(activite.fin) : ""} className={classeChamp} />
        </Champ>
        <Champ libelle="Lieu">
          <input name="lieu" maxLength={150} defaultValue={activite?.lieu} className={classeChamp} placeholder="Ex. Temple de Muanda-Centre" />
        </Champ>
        <Champ libelle="Responsable de l'activité">
          <input name="responsable" maxLength={120} defaultValue={activite?.responsable} className={classeChamp} />
        </Champ>
        <Champ libelle="Commission organisatrice">
          {commissionFixe ? (
            <>
              <input type="hidden" name="commissionId" value={commissionFixe} />
              <input disabled value={commissions.find((c) => c.id === commissionFixe)?.nom ?? ""} className={classeChamp} />
            </>
          ) : (
            <select name="commissionId" defaultValue={activite?.commissionId ?? ""} className={classeChamp}>
              <option value="">Aucune</option>
              {commissions.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          )}
        </Champ>
        <Champ libelle="Statut">
          <select name="statut" defaultValue={activite?.statutCode ?? "prevue"} className={classeChamp}>
            {Object.entries(STATUTS_ACTIVITE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Champ>
        <Champ libelle="Description" className="md:col-span-2">
          <textarea name="description" rows={3} maxLength={2000} defaultValue={activite?.description} className={classeChamp} />
        </Champ>
      </fieldset>

      <ChampsCiblage organisation={organisation} portees={portees} valeur={activite?.ciblage} />

      <p className="text-sm text-slate-500">
        Les membres concernés qui ont un compte reçoivent une notification dans l&apos;application. Rien n&apos;est envoyé par WhatsApp ou SMS.
      </p>
      <MessageFormulaire etat={etat} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={activite ? `/staff/programmes/${activite.id}` : "/staff/programmes"}
          className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-marine-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
          Annuler
        </Link>
        <BoutonEnvoi className="sm:w-auto">
          <Save className="size-4" aria-hidden /> {activite ? "Enregistrer les modifications" : "Créer l'activité"}
        </BoutonEnvoi>
      </div>
    </form>
  );
}
