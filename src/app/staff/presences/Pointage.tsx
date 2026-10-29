"use client";

import { useState, useTransition } from "react";
import { useLectureSeule } from "@/components/LectureSeule";
import { CircleAlert, CircleCheck, CircleX, Loader2, Search } from "lucide-react";
import { LecteurQR } from "@/components/carte/LecteurQR";
import { Avatar } from "@/components/ui/Avatar";
import { Bouton } from "@/components/ui/Bouton";
import { pointer, type ResultatPointage } from "@/app/staff/programmes/actions";

const MESSAGES: Record<NonNullable<ResultatPointage["resultat"]>, { titre: string; ton: "ok" | "info" | "refus" }> = {
  enregistre: { titre: "Présence enregistrée", ton: "ok" },
  deja_present: { titre: "Déjà pointé présent", ton: "info" },
  inconnue: { titre: "Carte inconnue", ton: "refus" },
  carte_invalide: { titre: "Carte non valable (révoquée ou membre non actif)", ton: "refus" },
  activite_annulee: { titre: "Activité annulée", ton: "refus" },
  non_concerne: { titre: "Ce membre n'est pas concerné par cette activité", ton: "refus" },
  non_autorise: { titre: "Membre hors de votre périmètre", ton: "refus" },
};

function Resultat({ r }: { r: ResultatPointage }) {
  if (r.erreur) return <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{r.erreur}</p>;
  const m = MESSAGES[r.resultat!];
  const Icone = m.ton === "ok" ? CircleCheck : m.ton === "info" ? CircleAlert : CircleX;
  const couleur = m.ton === "ok" ? "border-emerald-500 text-emerald-700" : m.ton === "info" ? "border-amber-400 text-amber-700" : "border-red-500 text-red-700";
  return (
    <div className={`rounded-2xl border-2 bg-white p-5 ${couleur}`} data-resultat={r.resultat}>
      <p className="flex items-center gap-2 text-lg font-bold"><Icone className="size-7" aria-hidden /> {m.titre}</p>
      {r.nom && (
        <div className="mt-4 flex items-center gap-3 text-marine-900">
          <Avatar membre={{ prenom: r.prenom!, nom: r.nom, photo: r.photo }} taille="lg" />
          <div>
            <p className="font-semibold">{r.prenom} {r.nom}</p>
            <p className="font-mono text-sm text-slate-500">{r.matricule}</p>
            <p className="text-sm text-slate-500">{r.paroisse}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Pointage des présences : chaque carte scannée est enregistrée « présent » par la base. */
export function Pointage({ activite }: { activite: string }) {
  const [matricule, setMatricule] = useState("");
  const [resultat, setResultat] = useState<ResultatPointage | null>(null);
  const [historique, setHistorique] = useState<ResultatPointage[]>([]);
  const [enCours, demarrer] = useTransition();
  const lectureSeule = useLectureSeule();

  function envoyer(contenu: string, mode: "qr" | "matricule") {
    demarrer(async () => {
      const r = await pointer(activite, contenu, mode);
      setResultat(r);
      if (r.resultat === "enregistre") setHistorique((h) => [r, ...h].slice(0, 20));
    });
  }

  if (lectureSeule) return <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Compte en lecture seule : le pointage est fait par les responsables et les contrôleurs.</p>;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <LecteurQR surCode={(texte) => envoyer(texte, "qr")} />
      <div className="space-y-6">
        <form className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
          onSubmit={(e) => { e.preventDefault(); envoyer(matricule, "matricule"); }}>
          <label htmlFor="matricule-presence" className="text-sm font-semibold text-marine-900">Pointer par matricule</label>
          <div className="mt-3 flex gap-2">
            <input id="matricule-presence" value={matricule} onChange={(e) => setMatricule(e.target.value)} placeholder="PGM-MUA-0001"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-marine-700" />
            <Bouton type="submit" disabled={enCours}>
              {enCours ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />} Pointer
            </Bouton>
          </div>
        </form>
        <div aria-live="polite">
          {enCours && <p className="text-sm text-slate-500">Enregistrement…</p>}
          {!enCours && resultat && <Resultat r={resultat} />}
        </div>
        {historique.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-marine-900">Pointés pendant cette séance ({historique.length})</p>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {historique.map((h) => (
                <li key={h.date} className="flex justify-between py-1.5">
                  <span>{h.prenom} {h.nom}</span><span className="font-mono text-xs text-slate-400">{h.matricule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
