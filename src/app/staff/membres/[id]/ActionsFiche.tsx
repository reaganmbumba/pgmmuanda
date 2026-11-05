"use client";

import { useActionState } from "react";
import { Hash, Link2 } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import { STATUTS, type CodeStatut } from "@/lib/membres/libelles";
import { archiverMembre, changerMatricule, changerStatut, relierCompte, traiterDemande } from "../actions";

const VERBES: Record<CodeStatut, string> = {
  en_attente: "Remettre en attente",
  actif: "Activer",
  inactif: "Rendre inactif",
  suspendu: "Suspendre",
};

export function ActionsStatut({ id, statut, archive }: { id: string; statut: CodeStatut; archive: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(STATUTS) as CodeStatut[]).map((s) => (
        <ActionConfirmee key={s} masquer={archive || s === statut} action={changerStatut} champs={{ id, statut: s }} libelle={VERBES[s]}
          question={`Passer ce membre au statut « ${STATUTS[s]} » ?`} danger={s === "suspendu"} />
      ))}
      <ActionConfirmee action={archiverMembre} champs={{ id, archive: archive ? "non" : "oui" }}
        libelle={archive ? "Restaurer" : "Archiver"} danger={!archive}
        question={archive ? "Restaurer cette fiche ?" : "Archiver cette fiche ? Elle restera consultable dans les archives."} />
    </div>
  );
}

export function RelierCompte({ id, profilId, compteActuel, comptes }: {
  id: string;
  profilId: string | null;
  compteActuel: string | null;
  comptes: { id: string; nom: string; identifiant: string | null }[];
}) {
  const [etat, action] = useActionState(relierCompte, undefined);
  if (profilId) {
    return (
      <div className="space-y-2 text-sm">
        <MessageFormulaire etat={etat} />
        <p>Relié au compte <strong>{compteActuel ?? "choriste"}</strong> : ce membre voit sa fiche dans l&apos;espace choriste.</p>
        <ActionConfirmee action={relierCompte} champs={{ id, profilId: "" }} libelle="Détacher le compte" danger
          question="Détacher ce compte ? Le choriste ne verra plus sa fiche." />
      </div>
    );
  }
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      {comptes.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aucun compte choriste libre. Créez d&apos;abord son compte dans « Utilisateurs et permissions » › « Créer un compte », avec le rôle Choriste.
        </p>
      ) : (
        <>
          <select name="profilId" required aria-label="Compte à relier" className={classeChamp}>
            <option value="">Choisir un compte choriste…</option>
            {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}{c.identifiant ? ` (${c.identifiant})` : ""}</option>)}
          </select>
          <BoutonEnvoi className="sm:w-auto"><Link2 className="size-4" aria-hidden /> Relier ce compte</BoutonEnvoi>
        </>
      )}
      <MessageFormulaire etat={etat} />
    </form>
  );
}

export function TraiterDemande({ id, enAttente }: { id: string; enAttente: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionConfirmee masquer={!enAttente} action={traiterDemande} champs={{ id, decision: "acceptee" }} libelle="Accepter"
        question="Accepter et appliquer cette correction ?" />
      <ActionConfirmee masquer={!enAttente} action={traiterDemande} champs={{ id, decision: "refusee" }} libelle="Refuser" danger
        question="Refuser cette demande ?" />
    </div>
  );
}

/** Changer le matricule à la main (administration seulement). */
export function ChangerMatricule({ id, matricule }: { id: string; matricule: string }) {
  const [etat, action] = useActionState(changerMatricule, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <label className="block text-sm font-medium text-slate-700">
        Nouveau matricule
        <input name="matricule" required defaultValue={matricule} maxLength={20} autoCapitalize="characters" autoComplete="off"
          spellCheck={false} className={`${classeChamp} font-mono uppercase`} />
      </label>
      <p className="text-xs text-slate-500">
        Lettres, chiffres et tirets, ex. PGM-MUA-0025. Deux membres ne peuvent pas avoir le même matricule.
        Le QR code de la carte reste valable ; seule une carte déjà imprimée devra être réimprimée.
      </p>
      <MessageFormulaire etat={etat} />
      <BoutonEnvoi className="sm:w-auto"><Hash className="size-4" aria-hidden /> Enregistrer le matricule</BoutonEnvoi>
    </form>
  );
}
