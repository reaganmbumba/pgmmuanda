"use client";

import { useActionState, useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { MessageFormulaire } from "@/components/ui/Formulaire";
import { enregistrerPhoto } from "@/app/staff/cartes/actions";

/** Réduit la photo dans le navigateur : portrait 4:5, 360 × 450 px, JPEG ≈ 30 Ko. */
async function reduire(fichier: File): Promise<string> {
  const image = await createImageBitmap(fichier);
  const L = 360, H = 450;
  const echelle = Math.max(L / image.width, H / image.height);
  const w = image.width * echelle, h = image.height * echelle;
  const canvas = document.createElement("canvas");
  canvas.width = L;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, L, H);
  ctx.drawImage(image, (L - w) / 2, (H - h) / 2, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function PhotoMembre({ membre, id }: { membre: { prenom: string; nom: string; photo?: string | null }; id: string }) {
  const [etat, action, envoi] = useActionState(enregistrerPhoto, undefined);
  const [apercu, setApercu] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const formulaire = useRef<HTMLFormElement>(null);
  const champ = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Avatar membre={{ ...membre, photo: apercu ?? membre.photo }} taille="xl" />
        <div className="space-y-2">
          <form ref={formulaire} action={action}>
            <input type="hidden" name="membreId" value={id} />
            <input ref={champ} type="hidden" name="photo" />
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-marine-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
              {envoi ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Camera className="size-3.5" aria-hidden />}
              {membre.photo ? "Changer la photo" : "Ajouter une photo"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Photo du membre"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  setErreur(null);
                  if (!f) return;
                  if (f.size > 15_000_000) return setErreur("Fichier trop lourd (15 Mo maximum).");
                  try {
                    const donnees = await reduire(f);
                    setApercu(donnees);
                    champ.current!.value = donnees;
                    formulaire.current!.requestSubmit();
                  } catch {
                    setErreur("Cette image ne peut pas être lue. Essayez une photo JPEG.");
                  }
                }} />
            </label>
          </form>
          {membre.photo && (
            <ActionConfirmee action={enregistrerPhoto} champs={{ membreId: id, photo: "" }} danger
              libelle="Retirer" icone={<Trash2 className="size-3.5" aria-hidden />} question="Retirer la photo ?" />
          )}
        </div>
      </div>
      {erreur && <p role="alert" className="text-xs text-red-700">{erreur}</p>}
      <MessageFormulaire etat={etat} />
      <p className="text-xs text-slate-500">Photo d&apos;identité de face, fond clair. Elle est réduite automatiquement avant l&apos;envoi.</p>
    </div>
  );
}
