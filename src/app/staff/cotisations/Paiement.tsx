"use client";

import { useActionState } from "react";
import { useLectureSeule } from "@/components/LectureSeule";
import { useFormStatus } from "react-dom";
import { BellRing, Check, Loader2, MessageCircle } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { annulerCotisation, enregistrerCotisation, rappelerCotisation } from "./actions";

const champ = "min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-marine-700";

function BoutonPaye() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60">
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />} Payé
    </button>
  );
}

/** Saisie d'un paiement, directement sur la ligne du membre. */
export function Payer({ membreId, nom, mois, montant, devise }: {
  membreId: string; nom: string; mois: string; montant?: number; devise?: string;
}) {
  const [etat, action] = useActionState(enregistrerCotisation, undefined);
  if (useLectureSeule()) return null;
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="membreId" value={membreId} />
      <input type="hidden" name="mois" value={mois} />
      <input name="montant" inputMode="decimal" defaultValue={montant ?? ""} placeholder="Montant" required
        aria-label={`Montant payé par ${nom}`} className={`${champ} w-28`} />
      <select name="devise" defaultValue={devise ?? "CDF"} aria-label="Monnaie" className={champ}>
        <option value="CDF">FC</option>
        <option value="USD">USD</option>
      </select>
      <BoutonPaye />
      {etat?.erreur && <p role="alert" className="w-full text-xs text-red-700">{etat.erreur}</p>}
    </form>
  );
}

export function Annuler({ id }: { id: string }) {
  return <ActionConfirmee action={annulerCotisation} champs={{ id }} danger libelle="Annuler" question="Annuler ce paiement (erreur de saisie) ?" />;
}

function BoutonRappel() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60">
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BellRing className="size-4" aria-hidden />} Rappeler
    </button>
  );
}

/** Rappel du règlement : dans l'application, et par WhatsApp (lien préparé, envoi par vous). */
export function Rappeler({ membreId, nom, mois, whatsapp, dernier }: {
  membreId: string; nom: string; mois: string; whatsapp: string; dernier: string | null;
}) {
  const [etat, action] = useActionState(rappelerCotisation, undefined);
  if (useLectureSeule()) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={action} aria-label={`Rappeler le règlement à ${nom}`}>
        <input type="hidden" name="membreId" value={membreId} />
        <input type="hidden" name="mois" value={mois} />
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
