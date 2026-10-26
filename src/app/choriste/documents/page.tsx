import { FileText } from "lucide-react";
import { ListeFichiers } from "@/components/documents/Fichiers";
import { listerDocuments } from "@/lib/documents/depot";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Mes documents" };

export default async function MesDocuments() {
  // La base ne renvoie que les documents qui concernent ce choriste.
  const documents = supabaseActif ? await listerDocuments({ generaux: true }) : [];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-marine-900">Mes documents</h1>
      {documents.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <FileText className="mx-auto size-10 text-or-500" aria-hidden />
          <p className="mt-3 font-medium text-marine-900">Aucun document pour le moment.</p>
          <p className="mt-1 text-sm text-slate-500">Les règlements, programmes et convocations de la PGM apparaîtront ici.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-4 shadow-sm"><ListeFichiers documents={documents} grand /></div>
      )}
      <p className="text-center text-xs text-slate-400">Touchez un document pour l&apos;ouvrir.</p>
    </div>
  );
}
