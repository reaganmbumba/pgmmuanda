import Link from "next/link";
import { Check, Link2, RefreshCw, X } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Carte, EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { estAdmin, peutGererMembres } from "@/lib/auth/roles";
import { formatDateHeure, libelleParoisse, nomComplet } from "@/lib/format";
import { listerInscriptions, lireLien } from "@/lib/inscriptions/depot";
import { supabaseActif, URL_SITE } from "@/lib/supabase/config";
import { LienInscription } from "./LienInscription";
import { accepterInscription, changerLien, ouvrirLien, refuserInscription } from "./actions";

export const metadata = { title: "Inscriptions par lien" };

export default async function PageInscriptions() {
  if (!supabaseActif) {
    return (
      <>
        <EnTete titre="Inscriptions par lien" />
        <Carte><p className="text-sm text-slate-600">Disponible quand Supabase est configuré.</p></Carte>
      </>
    );
  }
  const moi = await exigerAcces("/staff/inscriptions");
  const [lien, { enAttente, traitees }] = await Promise.all([lireLien(), listerInscriptions()]);
  const admin = estAdmin(moi?.role);
  const gestion = peutGererMembres(moi?.role);

  return (
    <>
      <EnTete titre="Inscriptions par lien"
        description="Envoyez le lien : la personne remplit elle-même ses informations et met sa photo. Vous validez ensuite." />

      <Carte titre="Le lien à envoyer" className="mb-6">
        {!lien ? (
          <p className="text-sm text-red-700">
            Le fichier SQL des inscriptions (20261110000100_inscriptions.sql) n&apos;a pas encore été exécuté dans Supabase.
          </p>
        ) : (
          <div className="space-y-4">
            {lien.ouvert ? (
              <LienInscription lien={`${URL_SITE}/inscription/${lien.code}`} />
            ) : (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Le lien est fermé : personne ne peut s&apos;inscrire pour le moment.</p>
            )}
            {admin && (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <ActionConfirmee action={ouvrirLien} champs={{ ouvert: lien.ouvert ? "non" : "oui" }} danger={lien.ouvert}
                  libelle={lien.ouvert ? "Fermer le lien" : "Ouvrir le lien"}
                  icone={<Link2 className="size-3.5" aria-hidden />}
                  question={lien.ouvert ? "Plus personne ne pourra s'inscrire. Fermer ?" : "Ouvrir les inscriptions ?"} />
                <ActionConfirmee action={changerLien} champs={{}} libelle="Créer un nouveau lien"
                  icone={<RefreshCw className="size-3.5" aria-hidden />}
                  question="L'ancien lien ne marchera plus. Continuer ?" />
              </div>
            )}
          </div>
        )}
      </Carte>

      <Carte titre={`À valider (${enAttente.length})`} className="mb-6">
        {enAttente.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune inscription en attente.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {enAttente.map((i) => (
              <li key={i.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start">
                <Avatar membre={i} taille="xl" />
                <div className="min-w-0 flex-1 space-y-1 text-sm">
                  <p className="text-base font-semibold text-marine-900">{nomComplet(i)}</p>
                  <p className="text-slate-700">
                    {libelleParoisse(i.paroisse)}{i.chorale && ` · ${i.chorale}`}{i.voix && ` · ${i.voix}`}
                    {i.sexe && ` · ${i.sexe === "F" ? "Femme" : "Homme"}`}
                  </p>
                  <p className="text-slate-700">
                    <a href={`tel:${i.telephone.replace(/\s/g, "")}`} className="text-marine-800 hover:underline">{i.telephone}</a>
                    {i.email && ` · ${i.email}`}
                  </p>
                  <p className="text-xs text-slate-500">Reçue le {formatDateHeure(i.creeLe)}{!i.photo && " · sans photo"}</p>
                </div>
                {gestion && (
                  <div className="flex flex-wrap gap-2 sm:flex-col">
                    <ActionConfirmee action={accepterInscription} champs={{ id: i.id }} libelle="Accepter"
                      icone={<Check className="size-3.5" aria-hidden />}
                      question="Créer sa fiche de membre ?" />
                    <ActionConfirmee action={refuserInscription} champs={{ id: i.id }} danger libelle="Refuser"
                      icone={<X className="size-3.5" aria-hidden />} question="Refuser cette inscription ?" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Carte>

      {traitees.length > 0 && (
        <Carte titre="Dernières inscriptions traitées">
          <ul className="divide-y divide-slate-100 text-sm">
            {traitees.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                {i.membreId ? (
                  <Link href={`/staff/membres/${i.membreId}`} className="font-medium text-marine-800 hover:underline">{nomComplet(i)}</Link>
                ) : (
                  <span className="font-medium text-slate-700">{nomComplet(i)}</span>
                )}
                <Badge ton={i.statut === "acceptee" ? "vert" : "rouge"}>{i.statut === "acceptee" ? "Acceptée" : "Refusée"}</Badge>
              </li>
            ))}
          </ul>
        </Carte>
      )}
    </>
  );
}
