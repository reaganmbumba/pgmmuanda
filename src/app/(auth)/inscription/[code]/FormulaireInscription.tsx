"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Camera, CheckCircle2, Globe, Image as ImageIcon, KeyRound, Send, UserRound } from "lucide-react";
import { BoutonEnvoi, classeChamp, MessageFormulaire } from "@/components/ui/Formulaire";
import { motDePasseDuNom } from "@/lib/auth/comptes";
import { VOIX } from "@/lib/membres/libelles";
import { reduirePhoto } from "@/lib/photo";
import { deposerInscription } from "./actions";
import { ExemplesPhoto } from "./ExemplesPhoto";

export type Choix = {
  paroisses: { id: string; nom: string }[];
  chorales: { id: string; nom: string; paroisseId: string | null }[];
};

const classe = `${classeChamp} min-h-12 text-base`;
const boutonPhoto =
  "flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-3 text-center text-sm font-semibold text-marine-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50";

function Champ({ libelle, children, aide }: { libelle: string; children: React.ReactNode; aide?: string }) {
  return (
    <label className="block text-sm font-semibold text-marine-900">
      {libelle}
      {children}
      {aide && <span className="mt-1 block text-xs font-normal text-slate-500">{aide}</span>}
    </label>
  );
}

export function FormulaireInscription({ code, choix }: { code: string; choix: Choix }) {
  const [etat, action] = useActionState(deposerInscription, undefined);
  const [paroisse, setParoisse] = useState(choix.paroisses.length === 1 ? choix.paroisses[0].id : "");
  const [photo, setPhoto] = useState("");
  const [erreurPhoto, setErreurPhoto] = useState<string | null>(null);
  const [motDePasse, setMotDePasse] = useState("");
  // Tant que la personne n'a pas écrit son propre mot de passe, on propose « nom + 123456 »
  const [motDePasseChoisi, setMotDePasseChoisi] = useState(false);
  // Les chorales de la paroisse, puis les chorales urbaines (ouvertes à toutes les paroisses)
  const chorales = paroisse
    ? choix.chorales.filter((c) => c.paroisseId === paroisse).concat(choix.chorales.filter((c) => c.paroisseId === null))
    : [];

  async function choisir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    setErreurPhoto(null);
    if (!f) return;
    if (f.size > 15_000_000) return setErreurPhoto("Photo trop lourde (15 Mo au plus).");
    try { setPhoto(await reduirePhoto(f)); } catch { setErreurPhoto("Cette photo ne peut pas être lue. Essayez une autre photo."); }
  }

  if (etat?.succes) {
    const acces = etat.acces;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
          <p className="mt-3 text-lg font-semibold text-emerald-800">{etat.succes}</p>
          <p className="mt-2 text-sm text-emerald-800">
            {acces ? "Votre compte est créé. " : ""}Le responsable va vérifier vos informations. Une fois validé, votre fiche de membre et votre carte seront disponibles.
          </p>
        </div>
        {acces && (
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" data-acces>
            <p className="font-semibold text-marine-900">Vos accès : notez-les bien</p>
            <dl className="mt-3 space-y-2 text-base">
              <div className="flex items-center gap-2"><UserRound className="size-5 text-marine-700" aria-hidden />
                <dt className="text-slate-500">Identifiant :</dt><dd className="font-mono font-semibold text-marine-900">{acces.identifiant}</dd></div>
              <div className="flex items-center gap-2"><KeyRound className="size-5 text-marine-700" aria-hidden />
                <dt className="text-slate-500">Mot de passe :</dt><dd className="font-mono font-semibold text-marine-900">{acces.motDePasse}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-slate-500">
              Faites une capture d&apos;écran. Vous pourrez changer votre mot de passe dans « Paramètres » de votre espace.
            </p>
            <Link href={acces.connecte ? "/choriste" : "/connexion"}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-or-500 px-4 py-2.5 text-base font-semibold text-marine-950 shadow-sm hover:brightness-105">
              <UserRound className="size-5" aria-hidden /> {acces.connecte ? "Ouvrir mon espace" : "Me connecter"}
            </Link>
          </div>
        )}
        <Link href="/"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-marine-900 px-4 py-2.5 text-base font-semibold text-white shadow-sm hover:bg-marine-800">
          <Globe className="size-5" aria-hidden /> Aller sur le site de la PGM
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="photo" value={photo} />

      <div className="flex flex-col items-center gap-3">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- image intégrée (data:)
          <img src={photo} alt="Votre photo" className="h-40 w-32 rounded-2xl object-cover ring-4 ring-white shadow" />
        ) : (
          <span className="flex h-28 w-24 items-center justify-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
            <Camera className="size-8" aria-hidden />
          </span>
        )}
        <ExemplesPhoto />
        <p className="text-sm font-semibold text-marine-900">{photo ? "Changer la photo :" : "Ajouter ma photo * :"}</p>
        <div className="grid w-full grid-cols-2 gap-3">
          <label className={boutonPhoto}>
            <Camera className="size-6" aria-hidden /> Prendre une photo
            <input type="file" accept="image/*" capture="user" className="sr-only" aria-label="Prendre une photo" onChange={choisir} />
          </label>
          <label className={boutonPhoto}>
            <ImageIcon className="size-6" aria-hidden /> Choisir dans la galerie
            <input type="file" accept="image/*" className="sr-only" aria-label="Choisir dans la galerie" onChange={choisir} />
          </label>
        </div>
        {erreurPhoto && <p role="alert" className="text-sm text-red-700">{erreurPhoto}</p>}
        <p className="text-center text-xs text-slate-500">Cette photo servira pour votre carte de membre.</p>
      </div>

      <Champ libelle="Nom *">
        <input name="nom" required maxLength={80} autoComplete="family-name" className={classe}
          onChange={(e) => { if (!motDePasseChoisi) setMotDePasse(motDePasseDuNom(e.target.value)); }} />
      </Champ>
      <Champ libelle="Postnom"><input name="postnom" maxLength={80} className={classe} /></Champ>
      <Champ libelle="Prénom *"><input name="prenom" required maxLength={80} autoComplete="given-name" className={classe} /></Champ>

      <fieldset>
        <legend className="text-sm font-semibold text-marine-900">Vous êtes *</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          {[["F", "Femme"], ["M", "Homme"]].map(([v, l]) => (
            <label key={v} className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-base font-medium text-marine-900 has-[:checked]:border-marine-800 has-[:checked]:bg-marine-900 has-[:checked]:text-white">
              <input type="radio" name="sexe" value={v} required className="sr-only" />{l}
            </label>
          ))}
        </div>
      </fieldset>

      <Champ libelle="Téléphone *" aide="Ex. +243 81 234 5678">
        <input name="telephone" type="tel" required inputMode="tel" autoComplete="tel" className={classe} />
      </Champ>

      <Champ libelle="Paroisse *">
        <select name="paroisseId" required value={paroisse} onChange={(e) => setParoisse(e.target.value)} className={classe}>
          <option value="">Choisir…</option>
          {choix.paroisses.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
      </Champ>
      <Champ libelle="Chorale">
        <select key={paroisse} name="choraleId" defaultValue="" disabled={!paroisse} className={classe}>
          <option value="">{paroisse ? "Je ne sais pas / aucune" : "Choisissez d'abord la paroisse"}</option>
          {chorales.map((c) => <option key={c.id} value={c.id}>{c.paroisseId === null ? `${c.nom} (Urbain)` : c.nom}</option>)}
        </select>
      </Champ>
      <Champ libelle="Voix">
        <select name="voix" defaultValue="" className={classe}>
          <option value="">Je ne sais pas</option>
          {Object.entries(VOIX).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Champ>
      <Champ libelle="Adresse e-mail (si vous en avez une)">
        <input name="email" type="email" autoComplete="email" className={classe} />
      </Champ>

      <fieldset className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <legend className="px-1 text-sm font-semibold text-marine-900">Votre mot de passe *</legend>
        <p className="text-sm text-slate-700">
          Nous vous proposons : <strong>votre nom + 123456</strong> (exemple : <span className="font-mono">Mbumba123456</span>).
          Vous pouvez aussi écrire le vôtre (10 caractères au moins, avec une majuscule, une minuscule et un chiffre).
        </p>
        <input name="motDePasse" required minLength={10} maxLength={72} value={motDePasse}
          onChange={(e) => { setMotDePasse(e.target.value); setMotDePasseChoisi(true); }}
          placeholder="Écrivez d'abord votre nom plus haut" autoComplete="new-password" spellCheck={false}
          aria-label="Mot de passe" className={`${classe} font-mono`} />
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          Notez bien ce mot de passe : vous en aurez besoin pour vous connecter.
        </p>
      </fieldset>

      <MessageFormulaire etat={etat} />
      {!photo && <p className="text-sm text-amber-700">N&apos;oubliez pas d&apos;ajouter votre photo en haut.</p>}
      <BoutonEnvoi className="min-h-12 text-base">
        <Send className="size-5" aria-hidden /> Envoyer mon inscription
      </BoutonEnvoi>
    </form>
  );
}
