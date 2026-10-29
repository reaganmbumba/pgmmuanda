"use client";

import { useActionState, useState } from "react";
import { useLectureSeule } from "@/components/LectureSeule";
import { useFormStatus } from "react-dom";
import { BellRing, Gavel, Loader2, MessageCircle } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { Champ } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import { FormulaireRapide } from "@/components/ui/FormulaireRapide";
import { MANQUEMENTS, TYPES_SANCTION, type CodeSanction } from "@/lib/discipline/libelles";
import { annulerSanction, enregistrerSanction, rappelerAbsences } from "./actions";

/** Nouvelle sanction (Règlement intérieur, art. 25 et 26), sur la fiche du membre. */
export function FormulaireSanction({ membreId, aujourdhui }: { membreId: string; aujourdhui: string }) {
  const [type, setType] = useState<CodeSanction>("avertissement");
  const [manquement, setManquement] = useState<string>(MANQUEMENTS[0]);
  return (
    <FormulaireRapide action={enregistrerSanction} champs={{ membreId }} libelle="Enregistrer la sanction"
      icone={<Gavel className="size-4" aria-hidden />} grille={false}>
      <Champ libelle="Sanction">
        <select name="type" value={type} onChange={(e) => setType(e.target.value as CodeSanction)} className={classeChamp}>
          {Object.entries(TYPES_SANCTION).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Champ>
      <Champ libelle="Manquement (art. 27)">
        <select value={MANQUEMENTS.includes(manquement as never) ? manquement : "autre"} className={classeChamp}
          onChange={(e) => setManquement(e.target.value === "autre" ? "" : e.target.value)}>
          {MANQUEMENTS.map((m) => <option key={m} value={m}>{m}</option>)}
          <option value="autre">Autre…</option>
        </select>
      </Champ>
      {MANQUEMENTS.includes(manquement as never)
        ? <input type="hidden" name="manquement" value={manquement} />
        : <Champ libelle="Préciser le manquement"><input name="manquement" value={manquement} onChange={(e) => setManquement(e.target.value)} required maxLength={200} className={classeChamp} /></Champ>}
      <Champ libelle="Ce qui s'est passé" aide="Facultatif.">
        <textarea name="details" rows={2} maxLength={2000} className={classeChamp} />
      </Champ>
      <div className="grid gap-3 sm:grid-cols-2">
        <Champ libelle="Date des faits"><input type="date" name="dateFaits" required max={aujourdhui} className={classeChamp} /></Champ>
        {type === "suspension" && (
          <Champ libelle="Suspendu jusqu'au"><input type="date" name="finSuspension" required min={aujourdhui} className={classeChamp} /></Champ>
        )}
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-or-400/60 bg-or-100/50 p-3 text-sm text-marine-900">
        <input type="checkbox" name="defense" required className="mt-0.5 size-5 accent-marine-900" />
        <span>Le membre a été invité à présenter sa défense <span className="text-slate-500">(art. 25 : obligatoire avant toute sanction)</span>.</span>
      </label>
    </FormulaireRapide>
  );
}

export function AnnulerSanction({ id }: { id: string }) {
  return <ActionConfirmee action={annulerSanction} champs={{ id }} danger libelle="Annuler" question="Annuler cette sanction (erreur de saisie) ?" />;
}

function BoutonRappel() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60">
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BellRing className="size-4" aria-hidden />} Rappeler le règlement
    </button>
  );
}

/** Rappel du règlement : dans l'application, et par WhatsApp (lien préparé, envoi par vous). */
export function RappelAbsences({ membreId, nom, nombre, whatsapp, dernier }: {
  membreId: string; nom: string; nombre: number; whatsapp: string; dernier: string | null;
}) {
  const [etat, action] = useActionState(rappelerAbsences, undefined);
  if (useLectureSeule()) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={action} aria-label={`Rappeler le règlement à ${nom}`}>
        <input type="hidden" name="membreId" value={membreId} />
        <input type="hidden" name="nombre" value={nombre} />
        <BoutonRappel />
      </form>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label={`Rappel WhatsApp à ${nom}`}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
        <MessageCircle className="size-4" aria-hidden /> WhatsApp
      </a>
      {(etat?.erreur || etat?.succes || dernier) && (
        <p role={etat?.erreur ? "alert" : "status"} className={`w-full text-xs ${etat?.erreur ? "text-red-700" : "text-amber-700"}`}>
          {etat?.erreur ?? etat?.succes ?? dernier}
        </p>
      )}
    </div>
  );
}
