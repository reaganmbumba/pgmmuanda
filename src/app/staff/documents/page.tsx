import { Upload } from "lucide-react";
import { deposerDocument } from "@/app/documents/actions";
import { ChampFichier, ListeFichiers } from "@/components/documents/Fichiers";
import { ChampsCiblage } from "@/components/programmes/ChampsCiblage";
import { EnTete } from "@/components/ui/Carte";
import { Vide } from "@/components/ui/Champ";
import { FormulaireRapide, Repliable } from "@/components/ui/FormulaireRapide";
import { estAdmin, peutPublier } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { listerDocuments } from "@/lib/documents/depot";
import { lireOrganisation } from "@/lib/membres/depot";
import { decrireCiblage } from "@/lib/programmes/depot";
import { porteesAnnonce } from "@/lib/programmes/droits";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Documents" };

export default async function PageDocuments() {
  const moi = await exigerAcces("/staff/documents");
  const description = "Règlements, programmes imprimables, convocations… à mettre à la disposition des choristes.";
  if (!supabaseActif || !moi) {
    return (<><EnTete titre="Documents" description={description} /><Vide>Les documents s&apos;affichent ici une fois la base configurée.</Vide></>);
  }
  const [documents, organisation] = await Promise.all([listerDocuments({ generaux: true }), lireOrganisation()]);
  const gerable = (portee: string | null) => estAdmin(moi.role) || (moi.role === "responsable_paroisse" && !!portee && portee === moi.paroisseId);
  return (
    <>
      <EnTete titre="Documents" description={description} />
      {peutPublier(moi.role) && (
        <div className="mb-6">
          <Repliable titre="Déposer un document">
            <FormulaireRapide action={deposerDocument} libelle="Déposer et prévenir les choristes" grille={false} icone={<Upload className="size-4" aria-hidden />}>
              <div className="grid gap-4 sm:grid-cols-2"><ChampFichier /></div>
              <ChampsCiblage organisation={organisation} portees={porteesAnnonce(moi, organisation)} />
            </FormulaireRapide>
          </Repliable>
        </div>
      )}
      {documents.length === 0 ? <Vide>Aucun document pour le moment.</Vide> : (
        <div className="space-y-4">
          {documents.map((d) => {
            const c = decrireCiblage(d.ciblage, organisation);
            return (
              <section key={d.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <p className="mb-2 text-xs text-slate-500">Pour : {c.portee} · {c.cibles}</p>
                <ListeFichiers documents={[d]} supprimable={gerable(d.ciblage.portee)} />
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
