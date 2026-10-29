import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { Carte, EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { nomComplet } from "@/lib/format";
import { listerMembres, lireOrganisation } from "@/lib/membres/depot";
import { lireActivite, presencesActivite } from "@/lib/programmes/depot";
import { concerne } from "@/lib/programmes/libelles";
import { lireSeance } from "@/lib/registre/depot";
import { libelleJour, TYPES_SEANCE } from "@/lib/registre/libelles";
import { FeuillePresence, type LignePresence } from "../../programmes/[id]/FeuillePresence";
import { supprimerRegistre } from "../actions";

export const metadata = { title: "Registre de présence" };

export default async function PageSeance({ params }: { params: Promise<{ id: string }> }) {
  await exigerAcces("/staff/registre");
  const { id } = await params;
  const [seance, activite] = await Promise.all([lireSeance(id), lireActivite(id)]);
  if (!seance || !activite) notFound();
  const [organisation, membres, presences] = await Promise.all([lireOrganisation(), listerMembres(), presencesActivite(id)]);
  const chorale = organisation.chorales.find((c) => c.id === seance.choraleId);
  const parMembre = new Map(presences.map((p) => [p.membreId, p]));
  const lignes: LignePresence[] = membres
    .filter((m) => concerne(activite.ciblage, m))
    .map((m) => ({
      id: m.id, matricule: m.matricule, nom: nomComplet(m), paroisse: m.paroisse, voix: m.voix,
      statut: parMembre.get(m.id)?.statutCode ?? "", parQr: parMembre.get(m.id)?.methode === "qr",
    }));
  const annulee = activite.statutCode === "annulee";

  return (
    <>
      <EnTete titre={`${TYPES_SEANCE[seance.type]} — ${chorale?.nom ?? ""}`}
        description={`${libelleJour(seance.jour)}. Touchez Présent, Absent ou Excusé pour chaque membre, puis enregistrez.`} />
      <Carte titre={`Membres de la chorale (${lignes.length})`}>
        {lignes.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun membre actif n&apos;est inscrit dans cette chorale.</p>
        ) : (
          <FeuillePresence activite={id} lignes={lignes} lectureSeule={annulee} />
        )}
      </Carte>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href={`/staff/registre?chorale=${seance.choraleId}`} className="text-marine-700 hover:underline">← Retour au registre</Link>
        <ActionConfirmee action={supprimerRegistre} champs={{ id, chorale: seance.choraleId }} danger
          libelle="Retirer ce registre" question="Retirer ce registre ouvert par erreur ? Les présences cochées seront effacées." />
      </div>
    </>
  );
}
