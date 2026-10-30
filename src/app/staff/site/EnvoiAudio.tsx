"use client";

import { useActionState, useRef, useState, startTransition, useEffect } from "react";
import { Loader2, Upload } from "lucide-react";
import { useLectureSeule } from "@/components/LectureSeule";
import { Champ } from "@/components/ui/Champ";
import { classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import type { Etat } from "@/lib/etat-action";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { ajouterAudio } from "./actions";

const MAX = 50 * 1024 * 1024;

/** Nom de fichier sûr : « 2026-10-30-alliance-chant-x7k2.mp3 ». */
function cheminAudio(fichier: File, titre: string) {
  const ext = (fichier.name.match(/\.([a-z0-9]{2,4})$/i)?.[1] ?? "mp3").toLowerCase();
  const nom = titre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "audio";
  return `audios/${new Date().toISOString().slice(0, 10)}-${nom}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
}

/**
 * Le fichier part directement du téléphone vers l'espace de stockage (jusqu'à 50 Mo),
 * puis le serveur enregistre l'audio dans la liste du site.
 */
export function EnvoiAudio({ chorales }: { chorales: string[] }) {
  const [etat, envoyer, enCours] = useActionState(ajouterAudio, undefined);
  const [depot, setDepot] = useState<Etat>(undefined);
  const [envoiFichier, setEnvoiFichier] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (etat?.succes) ref.current?.reset(); }, [etat]);
  if (useLectureSeule()) return null;

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const fichier = f.get("audio");
    if (!(fichier instanceof File) || fichier.size === 0) return setDepot({ erreur: "Choisissez le fichier audio." });
    if (!fichier.type.startsWith("audio/")) return setDepot({ erreur: "Ce fichier n'est pas un audio (MP3, M4A, OGG, WAV…)." });
    if (fichier.size > MAX) return setDepot({ erreur: "Le fichier dépasse 50 Mo. Envoyez un audio plus court ou compressé (MP3)." });
    setDepot(undefined);
    setEnvoiFichier(true);
    const chemin = cheminAudio(fichier, String(f.get("titre") ?? ""));
    const { error } = await creerClientNavigateur().storage.from("site").upload(chemin, fichier, { contentType: fichier.type });
    setEnvoiFichier(false);
    if (error) return setDepot({ erreur: "L'envoi du fichier a échoué. Vérifiez la connexion et réessayez." });
    f.delete("audio");
    f.set("fichier", chemin);
    startTransition(() => envoyer(f));
  }

  const occupe = envoiFichier || enCours;
  return (
    <form ref={ref} onSubmit={soumettre} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ libelle="Titre du chant *"><input name="titre" required maxLength={200} className={classeChamp} placeholder="Ex. Répétition du chant « … »" /></Champ>
        <Champ libelle="Chorale">
          <input name="sousTitre" list="chorales-site" maxLength={200} className={classeChamp} placeholder="Ex. Alliance" />
          <datalist id="chorales-site">{chorales.map((c) => <option key={c} value={c} />)}</datalist>
        </Champ>
        <Champ libelle="Date de la répétition"><input name="date" type="date" className={classeChamp} /></Champ>
        <Champ libelle="Fichier audio * (50 Mo au plus)"><input name="audio" type="file" accept="audio/*" required className={classeChamp} /></Champ>
        <Champ libelle="Remarque" className="sm:col-span-2"><input name="texte" maxLength={500} className={classeChamp} placeholder="Ex. Voix des sopranos" /></Champ>
      </div>
      <MessageFormulaire etat={depot ?? etat} />
      <button type="submit" disabled={occupe}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-marine-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-marine-800 disabled:opacity-60 sm:w-auto">
        {occupe ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
        {envoiFichier ? "Envoi du fichier…" : "Ajouter l'audio"}
      </button>
    </form>
  );
}
