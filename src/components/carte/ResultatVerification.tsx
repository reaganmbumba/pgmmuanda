import { CircleCheck, CircleHelp, CircleX } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { Membre } from "@/lib/types";

/** Ce que la vérification publique a le droit d'afficher. */
export type CarteVerifiee = {
  valide: boolean;
  prenom: string;
  nom: string;
  postnom: string;
  matricule: string;
  paroisse: string;
};

export const depuisMembreDemo = (m?: Membre): CarteVerifiee | undefined =>
  m && {
    valide: m.carte.statut === "Active" && m.statut !== "Suspendu",
    prenom: m.prenom,
    nom: m.nom,
    postnom: m.postnom,
    matricule: m.matricule,
    paroisse: m.paroisse,
  };

/** Affiche uniquement ce que la vérification publique autorise : photo, nom, matricule, paroisse, statut. */
export function ResultatVerification({ membre }: { membre?: CarteVerifiee }) {
  if (!membre)
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <CircleHelp className="mx-auto size-12 text-slate-400" aria-hidden />
        <p className="mt-3 text-lg font-semibold text-marine-900">Référence inconnue</p>
        <p className="mt-1 text-sm text-slate-500">
          Cette carte n&apos;existe pas dans la base de la PGM Muanda.
        </p>
      </div>
    );

  const valide = membre.valide;
  return (
    <div
      className={`rounded-2xl border-2 bg-white p-6 ${valide ? "border-emerald-500" : "border-red-500"}`}
    >
      <div className="flex items-center gap-3">
        {valide ? (
          <CircleCheck className="size-10 text-emerald-600" aria-hidden />
        ) : (
          <CircleX className="size-10 text-red-600" aria-hidden />
        )}
        <div>
          <p className={`text-lg font-bold ${valide ? "text-emerald-700" : "text-red-700"}`}>
            {valide ? "Carte valide" : "Carte révoquée"}
          </p>
          <p className="text-sm text-slate-500">
            {valide
              ? "Ce choriste est membre en règle de la PGM Muanda."
              : "Cette carte n'est plus valable. Ne pas accepter."}
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4 rounded-xl bg-marine-50 p-4">
        <Avatar membre={membre} taille="lg" />
        <div className="text-sm">
          <p className="text-base font-semibold text-marine-900">
            {membre.prenom} {membre.nom} {membre.postnom}
          </p>
          <p className="font-mono font-semibold text-marine-700">{membre.matricule}</p>
          <p className="text-slate-500">Paroisse {membre.paroisse}</p>
        </div>
      </div>
    </div>
  );
}
