import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Save } from "lucide-react";
import { FicheChant } from "@/components/chants/Chants";
import { DeposerFichier, ListeFichiers } from "@/components/documents/Fichiers";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { Carte, EnTete } from "@/components/ui/Carte";
import { FormulaireRapide, Repliable } from "@/components/ui/FormulaireRapide";
import { peutGererCommission } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { listerDocuments } from "@/lib/documents/depot";
import { lireChant } from "@/lib/organisation/depot";
import { supabaseActif } from "@/lib/supabase/config";
import { archiverChant, enregistrerChant } from "../actions";
import { ChampsChant } from "../ChampsChant";

export const metadata = { title: "Chant" };

export default async function PageChant({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const moi = await exigerAcces("/staff/chants");
  if (!supabaseActif || !moi) redirect("/staff/chants");
  const c = await lireChant(id);
  if (!c) notFound();
  const gerable = peutGererCommission(moi.role);
  const fichiers = await listerDocuments({ chantId: id });
  return (
    <>
      <EnTete titre={c.titre} description={c.auteur || undefined}
        actions={gerable && (
          <ActionConfirmee action={archiverChant} champs={{ id, archive: c.archive ? "non" : "oui" }} danger={!c.archive}
            libelle={c.archive ? "Remettre dans le répertoire" : "Retirer du répertoire"}
            question={c.archive ? "Les choristes verront de nouveau ce chant." : "Les choristes ne verront plus ce chant."} />
        )} />
      <div className="grid gap-6 xl:grid-cols-2">
        <FicheChant chant={c} />
        <div className="space-y-6">
        <Carte titre="Partitions et fichiers">
          {fichiers.length === 0 ? <p className="mb-4 text-sm text-slate-500">Aucun fichier pour ce chant.</p>
            : <div className="mb-4"><ListeFichiers documents={fichiers} supprimable={gerable} /></div>}
          {gerable && <DeposerFichier champs={{ chantId: id }} libelle="Déposer la partition ou l'enregistrement" />}
        </Carte>
        {gerable && (
          <Repliable titre="Modifier le chant">
            <FormulaireRapide action={enregistrerChant} champs={{ id }} libelle="Enregistrer" garder icone={<Save className="size-4" aria-hidden />}>
              <ChampsChant c={c} />
            </FormulaireRapide>
          </Repliable>
        )}
        </div>
      </div>
      <p className="mt-6 text-sm"><Link href="/staff/chants" className="text-marine-700 hover:underline">← Tout le répertoire</Link></p>
    </>
  );
}
