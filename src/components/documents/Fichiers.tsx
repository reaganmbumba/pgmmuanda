import { FileAudio, FileImage, FileText, Paperclip, Upload } from "lucide-react";
import { deposerDocument, supprimerDocument } from "@/app/documents/actions";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { Champ } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import { FormulaireRapide } from "@/components/ui/FormulaireRapide";
import type { Document } from "@/lib/documents/depot";
import { formatTaille, TYPES_FICHIER, type TypeFichier } from "@/lib/documents/fichiers";
import { formatDate } from "@/lib/format";

const ICONES: Record<TypeFichier, typeof FileText> = {
  "application/pdf": FileText, "image/jpeg": FileImage, "image/png": FileImage, "audio/mpeg": FileAudio,
};

/** Liste de fichiers à ouvrir ; `grand` pour les écrans du choriste (téléphone). */
export function ListeFichiers({ documents, supprimable, grand }: { documents: Document[]; supprimable?: boolean; grand?: boolean }) {
  return (
    <ul className="space-y-2">
      {documents.map((d) => {
        const Icone = ICONES[d.type];
        return (
          <li key={d.id} className="flex flex-wrap items-center gap-2" data-fichier={d.titre}>
            <a href={`/fichiers/${d.id}`} target="_blank" rel="noopener"
              className={`flex flex-1 items-center gap-3 rounded-xl ring-1 ring-inset ring-slate-200 hover:bg-slate-50 ${grand ? "min-h-16 px-4 py-3" : "min-h-12 px-3 py-2"}`}>
              <span className="rounded-lg bg-or-100/70 p-2 text-or-600"><Icone className={grand ? "size-6" : "size-5"} aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className={`block font-medium text-marine-900 ${grand ? "text-base" : "text-sm"}`}>{d.titre}</span>
                <span className="block text-xs text-slate-500">{TYPES_FICHIER[d.type]} · {formatTaille(d.taille)} · {formatDate(d.date)}</span>
              </span>
              <span className="text-sm font-semibold text-marine-700">Ouvrir</span>
            </a>
            {supprimable && (
              <ActionConfirmee action={supprimerDocument} champs={{ id: d.id }} danger libelle="Supprimer" question={`Supprimer « ${d.titre} » ?`} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Champ « fichier » commun aux formulaires de dépôt. */
export function ChampFichier({ titre = true }: { titre?: boolean }) {
  return (
    <>
      <Champ libelle="Fichier *" aide="PDF, photo (JPEG ou PNG) ou MP3, 4 Mo au plus.">
        <input name="fichier" type="file" required accept="application/pdf,image/jpeg,image/png,audio/mpeg,.pdf,.jpg,.jpeg,.png,.mp3"
          className={`${classeChamp} file:mr-3 file:rounded-lg file:border-0 file:bg-marine-50 file:px-3 file:py-1.5 file:font-medium file:text-marine-800`} />
      </Champ>
      {titre && (
        <Champ libelle="Titre" aide="Facultatif : sinon, le nom du fichier.">
          <input name="titre" maxLength={150} className={classeChamp} />
        </Champ>
      )}
    </>
  );
}

/** Dépôt rapide rattaché à un chant ou à une opération. */
export function DeposerFichier({ champs, libelle = "Déposer le fichier", titre = true }: {
  champs: Record<string, string>; libelle?: string; titre?: boolean;
}) {
  return (
    <FormulaireRapide action={deposerDocument} champs={champs} libelle={libelle} icone={<Upload className="size-4" aria-hidden />}>
      <ChampFichier titre={titre} />
    </FormulaireRapide>
  );
}

/** Petit trombone : reçus joints à une opération. */
export function Recus({ documents }: { documents: Document[] }) {
  if (!documents.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-2">
      {documents.map((d, i) => (
        <a key={d.id} href={`/fichiers/${d.id}`} target="_blank" rel="noopener" data-recu={d.titre}
          className="inline-flex items-center gap-1 text-xs font-medium text-marine-700 hover:underline">
          <Paperclip className="size-3.5" aria-hidden />Reçu{documents.length > 1 ? ` ${i + 1}` : ""}
        </a>
      ))}
    </span>
  );
}
