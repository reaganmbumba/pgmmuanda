"use client";

import { useActionState } from "react";
import { Link2 } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import { STATUTS, type CodeStatut } from "@/lib/membres/libelles";
import { archiverMembre, changerStatut, relierCompte, traiterDemande } from "../actions";

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
