"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { creerClientNavigateur } from "@/lib/supabase/client";

/** Réduit une photo de téléphone (souvent 4 à 8 Mo) à 1600 px de large en JPEG. */
async function reduire(fichier: File): Promise<Blob> {
  try {
    const image = await createImageBitmap(fichier);
    const echelle = Math.min(1, 1600 / Math.max(image.width, image.height));
    const toile = document.createElement("canvas");
    toile.width = Math.round(image.width * echelle);
    toile.height = Math.round(image.height * echelle);
    toile.getContext("2d")!.drawImage(image, 0, 0, toile.width, toile.height);
    return await new Promise((ok, ko) => toile.toBlob((b) => (b ? ok(b) : ko()), "image/jpeg", 0.85));
  } catch {
    return fichier;
  }
}

/**
 * Image d'une publication : envoyée dès qu'elle est choisie, puis le formulaire
 * enregistre seulement son chemin. Elle accompagne aussi les partages WhatsApp et Facebook.
 */
export function ChampImage({ chemin, base }: { chemin: string | null; base: string }) {
  const [valeur, setValeur] = useState(chemin ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  // Le formulaire est vidé après un ajout réussi : l'image aussi
  useEffect(() => {
    const form = ref.current?.closest("form");
    const vider = () => setValeur(chemin ?? "");
    form?.addEventListener("reset", vider);
    return () => form?.removeEventListener("reset", vider);
  }, [chemin]);

  async function choisir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErreur("Choisissez une photo ou une image.");
    setErreur(""); setEnvoi(true);
    const blob = await reduire(f);
    const nouveau = `images/${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 10)}.jpg`;
    const { error } = await creerClientNavigateur().storage.from("site").upload(nouveau, blob, { contentType: blob.type || "image/jpeg" });
    setEnvoi(false);
    if (error) return setErreur("L'image n'a pas pu être envoyée. Vérifiez la connexion et réessayez.");
    setValeur(nouveau);
  }

  return (
    <div ref={ref} className="sm:col-span-2">
      <span className="block text-sm font-medium text-marine-900">Image (photo, affiche…)</span>
      <input type="hidden" name="image" value={valeur} />
      <input type="hidden" name="imageAvant" value={chemin ?? ""} />
      <div className="mt-1 flex flex-wrap items-center gap-3">
        {valeur && <img src={`${base}/${valeur}`} alt="" className="h-20 w-32 rounded-lg border border-slate-200 object-cover" />}
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-marine-900">
          {envoi ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          {envoi ? "Envoi…" : valeur ? "Changer l'image" : "Ajouter une image"}
          <input type="file" accept="image/*" className="sr-only" onChange={choisir} disabled={envoi} />
        </label>
        {valeur && (
          <button type="button" onClick={() => setValeur("")} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-medium text-red-700">
            <X className="size-4" aria-hidden />Retirer
          </button>
        )}
      </div>
      {erreur && <p className="mt-1 text-sm text-red-700">{erreur}</p>}
    </div>
  );
}
