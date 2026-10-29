"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import { STATUTS, VOIX } from "@/lib/membres/libelles";
import type { FicheMembre, Organisation } from "@/lib/membres/depot";
import { enregistrerMembre } from "./actions";

function Champ({ libelle, children, aide }: { libelle: string; children: React.ReactNode; aide?: string }) {
  return (
    <label className="block text-sm font-medium text-marine-900">
      {libelle}
      {children}
      {aide && <span className="mt-1 block text-xs font-normal text-slate-500">{aide}</span>}
    </label>
  );
}

export function FormulaireMembre({ membre, organisation }: { membre?: FicheMembre; organisation: Organisation }) {
  const [etat, action] = useActionState(enregistrerMembre, undefined);
  const [paroisse, setParoisse] = useState(membre?.paroisseId ?? (organisation.paroisses.length === 1 ? organisation.paroisses[0].id : ""));
  const chorales = organisation.chorales.filter((c) => c.paroisseId === paroisse);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={membre?.id ?? ""} />

      <fieldset className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:grid-cols-3">
        <legend className="px-1 text-sm font-semibold text-marine-900">Identité</legend>
        <Champ libelle="Nom *"><input name="nom" required maxLength={80} defaultValue={membre?.nom} className={classeChamp} /></Champ>
        <Champ libelle="Postnom"><input name="postnom" maxLength={80} defaultValue={membre?.postnom} className={classeChamp} /></Champ>
        <Champ libelle="Prénom *"><input name="prenom" required maxLength={80} defaultValue={membre?.prenom} className={classeChamp} /></Champ>
        <Champ libelle="Sexe">
          <select name="sexe" defaultValue={membre?.sexe ?? ""} className={classeChamp}>
            <option value="">Non précisé</option><option value="F">Femme</option><option value="M">Homme</option>
          </select>
        </Champ>
        <Champ libelle="Téléphone" aide="Ex. +243 81 234 5678">
          <input name="telephone" type="tel" defaultValue={membre?.telephone} className={classeChamp} />
        </Champ>
        <Champ libelle="Adresse e-mail"><input name="email" type="email" defaultValue={membre?.email} className={classeChamp} /></Champ>
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:grid-cols-3">
        <legend className="px-1 text-sm font-semibold text-marine-900">Chorale</legend>
        <Champ libelle="Paroisse *">
          <select name="paroisseId" required value={paroisse} onChange={(e) => setParoisse(e.target.value)} className={classeChamp}>
            <option value="">Choisir…</option>
            {organisation.paroisses.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </Champ>
        <Champ libelle="Chorale" aide={paroisse && !chorales.length ? "Aucune chorale enregistrée pour cette paroisse." : undefined}>
          <select key={paroisse} name="choraleId" defaultValue={membre?.paroisseId === paroisse ? (membre?.choraleId ?? "") : organisation.chorales.length === 1 ? organisation.chorales[0].id : ""} className={classeChamp}>
            <option value="">Aucune</option>
            {chorales.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </Champ>
        <Champ libelle="Voix">
          <select name="voix" defaultValue={membre?.voixCode ?? ""} className={classeChamp}>
            <option value="">Non précisée</option>
            {Object.entries(VOIX).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Champ>
        <Champ libelle="Fonction *"><input name="fonction" required defaultValue={membre?.fonction ?? "Choriste"} className={classeChamp} /></Champ>
        <Champ libelle="Date d'adhésion *">
          <input name="dateAdhesion" type="date" required max={aujourdhui} defaultValue={membre?.dateAdhesion ?? aujourdhui} className={classeChamp} />
        </Champ>
        <Champ libelle="Statut *">
          <select name="statut" defaultValue={membre?.statutCode ?? "en_attente"} className={classeChamp}>
            {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Champ>
      </fieldset>

      {!membre && (
        <p className="text-sm text-slate-500">
          Le matricule (PGM-MUA-0001, PGM-MUA-0002…) est attribué automatiquement à l&apos;enregistrement et ne pourra plus être modifié.
        </p>
      )}
      <MessageFormulaire etat={etat} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={membre ? `/staff/membres/${membre.id}` : "/staff/membres"}
          className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-marine-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
          Annuler
        </Link>
        <BoutonEnvoi className="sm:w-auto">
          <Save className="size-4" aria-hidden /> {membre ? "Enregistrer les modifications" : "Inscrire le membre"}
        </BoutonEnvoi>
      </div>
    </form>
  );
}
