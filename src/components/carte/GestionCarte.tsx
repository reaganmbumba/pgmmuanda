"use client";

import { useActionState } from "react";
import { Download, IdCard, RefreshCcw, ShieldX } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { BoutonEnvoi, MessageFormulaire } from "@/components/ui/Formulaire";
import { MOTIFS_CARTE } from "@/lib/cartes/motifs";
import { emettreCarte, reediterCarte, revoquerCarte } from "@/app/staff/cartes/actions";

/** Boutons d'une carte : émettre, télécharger, rééditer, révoquer. */
export function GestionCarte({ membreId, carteId, membreActif, compact }: {
  membreId: string;
  carteId: string | null;
  membreActif: boolean;
  compact?: boolean;
}) {
  const [etat, emettre] = useActionState(emettreCarte, undefined);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start gap-2">
        {!carteId && membreActif && (
          <form action={emettre}>
            <input type="hidden" name="membreId" value={membreId} />
            <BoutonEnvoi className={compact ? "w-auto px-3 py-1.5 text-xs" : "w-auto"}>
              <IdCard className="size-4" aria-hidden /> Émettre la carte
            </BoutonEnvoi>
          </form>
        )}
        {!carteId && !membreActif && (
          <p className="text-xs text-slate-500">Activez d&apos;abord le membre pour lui émettre une carte.</p>
        )}
        {carteId && (
          <a href={`/cartes/${carteId}/pdf`} target="_blank" rel="noopener"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-marine-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Download className="size-3.5" aria-hidden /> PDF
          </a>
        )}
        <ActionConfirmee masquer={!carteId} action={reediterCarte} champs={{ membreId }} libelle="Rééditer"
          icone={<RefreshCcw className="size-3.5" aria-hidden />}
          question="Émettre une nouvelle carte ? L'ancienne ne sera plus valable."
          choix={{ nom: "motif", libelle: "Motif", options: MOTIFS_CARTE }} />
        <ActionConfirmee masquer={!carteId} action={revoquerCarte} champs={{ membreId, carteId: carteId ?? "" }} danger
          libelle="Révoquer" icone={<ShieldX className="size-3.5" aria-hidden />}
          question="Révoquer cette carte ? Elle sera signalée comme non valable au contrôle."
          choix={{ nom: "motif", libelle: "Motif", options: MOTIFS_CARTE }} />
      </div>
      <MessageFormulaire etat={etat} />
    </div>
  );
}
