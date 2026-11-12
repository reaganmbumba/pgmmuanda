"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, AudioLines, BookOpen, Check, ChevronRight, Copy, Delete, Lock, Mic, MicOff, Music, Play, RotateCcw, Star, Trophy, Volume2, X } from "lucide-react";
import {
  NIVEAUX, POINTS_BONNE_REPONSE, QUESTIONS_PAR_PARTIE, SEUIL_REUSSITE,
  dicteeJuste, enregistrerPartie, etoiles, lireProgression, niveauOuvert, note, preparerPartie, rang, totalEtoiles,
  type Niveau, type NoteId, type Progression, type Question,
} from "@/lib/solfa/jeu";
import { doActuel, jouerMelodie, jouerNotes, jouerRythme, jouerSignal, ouvrirMicro, reglerDo, sonEnCours, type Micro } from "@/lib/solfa/son";
import {
  TONALITES, chanteJuste, detecterFrequence, doDe, ecartAvec, lireReglages, noteChantee,
  type NoteChantee, type Reglages,
} from "@/lib/solfa/hauteur";
import { texteDemiTons, transcrire, type Mesure } from "@/lib/solfa/transcrire";
import { lireRythme } from "@/lib/solfa/rythme";
import { COURS, type LeconCours } from "@/lib/solfa/cours";

const CLE = "pgm-solfa-progression";

// Les points restent sur le téléphone (stockage du navigateur) ; en secours, en mémoire.
let enMemoire: string | null = null;
const abonnes = new Set<() => void>();
const abonner = (f: () => void) => { abonnes.add(f); return () => { abonnes.delete(f); }; };
function lireBrut(): string | null {
  try { return window.localStorage.getItem(CLE) ?? enMemoire; } catch { return enMemoire; }
}
function sauver(p: Progression) {
  enMemoire = JSON.stringify(p);
  try { window.localStorage.setItem(CLE, enMemoire); } catch { /* stockage indisponible : on garde en mémoire */ }
  abonnes.forEach((f) => f());
}

// Réglages de voix (homme ou femme) et de tonalité, gardés sur le téléphone.
const CLE_REGLAGES = "pgm-solfa-reglages";
let reglagesEnMemoire: string | null = null;
function lireReglagesBruts(): string | null {
  try { return window.localStorage.getItem(CLE_REGLAGES) ?? reglagesEnMemoire; } catch { return reglagesEnMemoire; }
}
function sauverReglages(r: Reglages) {
  reglagesEnMemoire = JSON.stringify(r);
  try { window.localStorage.setItem(CLE_REGLAGES, reglagesEnMemoire); } catch { /* on garde en mémoire */ }
  abonnes.forEach((f) => f());
}
function useReglages(): Reglages {
  const brut = useSyncExternalStore(abonner, lireReglagesBruts, () => null);
  const reglages = useMemo(() => lireReglages(brut), [brut]);
  useEffect(() => { reglerDo(doDe(reglages)); }, [reglages]);
  return reglages;
}

/** Le niveau qu'il faut réussir pour ouvrir celui-ci (les niveaux de chant ne comptent pas). */
function niveauRequis(numero: number) {
  let avant = numero - 1;
  while (avant >= 1 && NIVEAUX[avant - 1]?.chant) avant--;
  return avant;
}

type Ecran =
  | { nom: "accueil" }
  | { nom: "lecon"; niveau: Niveau }
  | { nom: "jeu"; niveau: Niveau }
  | { nom: "fin"; niveau: Niveau; bonnes: number; avant: number }
  | { nom: "modulateur" }
  | { nom: "chanter" }
  | { nom: "melodie" }
  | { nom: "cours"; lecon?: LeconCours };

export function JeuSolfa() {
  const brut = useSyncExternalStore(abonner, lireBrut, () => null);
  const progression = useMemo(() => lireProgression(brut), [brut]);
  const [ecran, setEcran] = useState<Ecran>({ nom: "accueil" });
  const reglages = useReglages();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [ecran]);

  const terminer = (niveau: Niveau, bonnes: number) => {
    const avant = progression.meilleurs[niveau.numero] ?? 0;
    sauver(enregistrerPartie(progression, niveau.numero, bonnes));
    setEcran({ nom: "fin", niveau, bonnes, avant });
  };

  if (ecran.nom === "lecon") return <Lecon niveau={ecran.niveau} retour={() => setEcran({ nom: "accueil" })} jouer={() => setEcran({ nom: "jeu", niveau: ecran.niveau })} />;
  if (ecran.nom === "jeu") return <Partie key={`${ecran.niveau.numero}-${progression.parties}`} niveau={ecran.niveau} quitter={() => setEcran({ nom: "accueil" })} terminer={(b) => terminer(ecran.niveau, b)} />;
  if (ecran.nom === "fin") {
    const suivant = NIVEAUX.find((n) => n.numero === ecran.niveau.numero + 1);
    return (
      <Fin bonnes={ecran.bonnes} avant={ecran.avant} niveau={ecran.niveau}
        rejouer={() => setEcran({ nom: "jeu", niveau: ecran.niveau })}
        suivant={suivant && niveauOuvert(progression, suivant.numero) ? () => setEcran({ nom: "lecon", niveau: suivant }) : undefined}
        accueil={() => setEcran({ nom: "accueil" })} />
    );
  }
  if (ecran.nom === "modulateur") return <ModulateurLibre retour={() => setEcran({ nom: "accueil" })} />;
  if (ecran.nom === "cours") {
    const ouvrirNiveau = (titre: string) => {
      const n = NIVEAUX.find((x) => x.titre === titre);
      if (n && niveauOuvert(progression, n.numero)) setEcran({ nom: "lecon", niveau: n });
    };
    return ecran.lecon
      ? <LeconDuCours lecon={ecran.lecon} retour={() => setEcran({ nom: "cours" })}
          suivante={() => { const i = COURS.indexOf(ecran.lecon!); setEcran({ nom: "cours", lecon: COURS[i + 1] }); }}
          niveauOuvert={(t) => { const n = NIVEAUX.find((x) => x.titre === t); return !!n && niveauOuvert(progression, n.numero); }}
          jouerNiveau={ouvrirNiveau} />
      : <SommaireCours retour={() => setEcran({ nom: "accueil" })} ouvrir={(l) => setEcran({ nom: "cours", lecon: l })} />;
  }
  if (ecran.nom === "melodie") return <MelodieChantee reglages={reglages} retour={() => setEcran({ nom: "accueil" })} />;
  if (ecran.nom === "chanter") return <ChanterLibre reglages={reglages} retour={() => setEcran({ nom: "accueil" })} />;
  return <Accueil progression={progression} reglages={reglages} ouvrir={(n) => setEcran({ nom: "lecon", niveau: n })}
    modulateur={() => setEcran({ nom: "modulateur" })} chanter={() => setEcran({ nom: "chanter" })} melodie={() => setEcran({ nom: "melodie" })}
    cours={() => setEcran({ nom: "cours" })} />;
}

/* ───────────── Accueil du jeu ───────────── */

function Accueil({ progression, reglages, ouvrir, modulateur, chanter, melodie, cours }: {
  progression: Progression; reglages: Reglages; ouvrir: (n: Niveau) => void; modulateur: () => void; chanter: () => void; melodie: () => void; cours: () => void;
}) {
  const r = rang(progression.points);
  const etoilesTotal = totalEtoiles(progression);
  return (
    <div className="space-y-5" data-jeu-solfa="accueil">
      <section className="relative overflow-hidden rounded-3xl bg-marine-900 p-5 text-white shadow-lg">
        <div className="absolute -right-8 -top-8 size-32 rounded-full border-8 border-or-500/20" aria-hidden />
        <p className="text-sm text-marine-100/80">Paix ! Apprenez le tonic sol-fa en jouant.</p>
        <h1 className="mt-1 text-2xl font-bold">Jeu du sol-fa</h1>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/10 p-2">
            <p className="text-2xl font-bold text-or-400" data-points={progression.points}>{progression.points}</p>
            <p className="text-[11px] text-marine-100/80">points</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-2">
            <p className="text-2xl font-bold text-or-400">{etoilesTotal}<span className="text-sm text-marine-100/70">/{NIVEAUX.length * 3}</span></p>
            <p className="text-[11px] text-marine-100/80">étoiles</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-2">
            <p className="text-2xl font-bold text-or-400">{progression.parties}</p>
            <p className="text-[11px] text-marine-100/80">parties</p>
          </div>
        </div>
        <div className="mt-4 text-sm">
          <p className="flex items-center gap-2 font-semibold"><Trophy className="size-4 shrink-0 text-or-400" aria-hidden /> Votre titre : {r.titre}</p>
          {r.suivant && <p className="mt-0.5 pl-6 text-marine-100/70">Encore {r.manque} points pour devenir « {r.suivant} »</p>}
        </div>
      </section>

      <button type="button" onClick={cours} data-ouvrir-cours
        className="flex min-h-20 w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-2 ring-or-400 active:bg-slate-50">
        <span className="rounded-xl bg-or-100 p-3 text-or-600"><BookOpen className="size-6" aria-hidden /></span>
        <span className="flex-1">
          <span className="block text-base font-bold text-marine-900">Le cours de tonic sol-fa</span>
          <span className="block text-xs text-slate-500">7 leçons : les notes, le temps, le demi-temps, le temps pointé, les silences… avec les exercices à écouter.</span>
        </span>
        <ChevronRight className="size-5 text-slate-300" aria-hidden />
      </button>

      <button type="button" onClick={chanter} data-ouvrir-chanter
        className="flex min-h-20 w-full items-center gap-3 rounded-2xl bg-or-500 p-4 text-left shadow-sm active:bg-or-400">
        <span className="rounded-xl bg-marine-900 p-3 text-or-400"><Mic className="size-6" aria-hidden /></span>
        <span className="flex-1">
          <span className="block text-base font-bold text-marine-950">Je chante, le jeu me dit la note</span>
          <span className="block text-xs text-marine-900">Chantez dans le micro : la note s&apos;affiche (d, r, m…).</span>
        </span>
      </button>

      <button type="button" onClick={melodie} data-ouvrir-melodie
        className="flex min-h-20 w-full items-center gap-3 rounded-2xl bg-marine-900 p-4 text-left text-white shadow-sm active:bg-marine-800">
        <span className="rounded-xl bg-or-500 p-3 text-marine-950"><AudioLines className="size-6" aria-hidden /></span>
        <span className="flex-1">
          <span className="block text-base font-bold">Chantez un air, je l&apos;écris en sol-fa</span>
          <span className="block text-xs text-marine-100/80">Les notes et le rythme : d : r | m : - ||</span>
        </span>
      </button>

      <button type="button" onClick={modulateur}
        className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm active:bg-slate-50">
        <span className="rounded-xl bg-or-100 p-2.5 text-or-600"><Music className="size-6" aria-hidden /></span>
        <span className="flex-1">
          <span className="block text-base font-semibold text-marine-900">Le modulateur</span>
          <span className="block text-xs text-slate-500">Touchez les notes pour les écouter librement.</span>
        </span>
      </button>

      <section className="space-y-3">
        <h2 className="font-semibold text-marine-900">Les niveaux</h2>
        <ol className="space-y-3">
          {NIVEAUX.map((n) => {
            const ouvert = niveauOuvert(progression, n.numero);
            const meilleur = progression.meilleurs[n.numero];
            return (
              <li key={n.numero}>
                <button type="button" disabled={!ouvert} onClick={() => ouvrir(n)} data-niveau={n.numero}
                  className={`flex min-h-20 w-full items-center gap-3 rounded-2xl p-4 text-left shadow-sm ${ouvert ? "bg-white active:bg-slate-50" : "bg-slate-100"}`}>
                  <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${ouvert ? "bg-marine-900 text-white" : "bg-slate-200 text-slate-400"}`}>
                    {ouvert ? n.numero : <Lock className="size-5" aria-label="Fermé" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`flex items-center gap-1.5 text-base font-semibold ${ouvert ? "text-marine-900" : "text-slate-400"}`}>
                      {n.titre}{n.chant && <Mic className="size-4 text-or-600" aria-label="avec le micro" />}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {ouvert ? n.resume : `Réussissez le niveau ${niveauRequis(n.numero)} (${SEUIL_REUSSITE}/10) pour l'ouvrir.`}
                    </span>
                    {meilleur !== undefined && <span className="mt-1 block text-xs text-slate-400">Meilleur score : {meilleur}/10</span>}
                  </span>
                  {ouvert && <Etoiles n={etoiles(meilleur ?? 0)} petite />}
                </button>
              </li>
            );
          })}
        </ol>
      </section>
      <ChoixReglages reglages={reglages} />
      <p className="text-center text-xs text-slate-400">Pensez à monter le volume du téléphone. Vos points restent enregistrés sur ce téléphone.</p>
    </div>
  );
}

function Etoiles({ n, petite = false }: { n: number; petite?: boolean }) {
  return (
    <span className="flex shrink-0 gap-0.5" aria-label={`${n} étoile${n > 1 ? "s" : ""} sur 3`}>
      {[1, 2, 3].map((i) => (
        <Star key={i} className={`${petite ? "size-5" : "size-12"} ${i <= n ? "fill-or-400 text-or-500" : "text-slate-300"}`} aria-hidden />
      ))}
    </span>
  );
}

function BarreRetour({ titre, retour }: { titre: string; retour: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={retour} className="rounded-xl bg-white p-3 text-marine-900 shadow-sm" aria-label="Retour">
        <ArrowLeft className="size-5" aria-hidden />
      </button>
      <h1 className="text-lg font-bold text-marine-900">{titre}</h1>
    </div>
  );
}

/* ───────────── Le modulateur (échelle verticale de notes) ───────────── */

function Modulateur({ notes, onNote, allumee }: { notes: NoteId[]; onNote: (n: NoteId) => void; allumee?: NoteId | null }) {
  // Comme le modulateur affiché dans les salles de répétition : les notes aiguës en haut.
  const ordre = [...notes].reverse();
  return (
    <div className="mx-auto flex max-w-xs flex-col gap-1.5" data-modulateur>
      {ordre.map((id) => {
        const n = note(id);
        const pivot = id === "d" || id === "d1";
        return (
          <button key={id} type="button" onClick={() => onNote(id)} data-touche={id}
            className={`flex min-h-12 items-center justify-between rounded-xl px-4 text-left shadow-sm transition active:scale-[0.98] ${
              allumee === id ? "bg-or-400 text-marine-950" : pivot ? "bg-marine-900 text-white" : "bg-white text-marine-900"
            }`}>
            <span className="font-serif text-2xl font-bold">{n.texte}</span>
            <span className={`text-sm ${allumee === id ? "text-marine-950" : pivot ? "text-marine-100" : "text-slate-500"}`}>{n.nom}</span>
          </button>
        );
      })}
    </div>
  );
}

function useNoteAllumee() {
  const [allumee, setAllumee] = useState<NoteId | null>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toucher = (n: NoteId) => {
    jouerNotes([n], { duree: 0.6 });
    setAllumee(n);
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => setAllumee(null), 450);
  };
  return { allumee, toucher };
}

function ModulateurLibre({ retour }: { retour: () => void }) {
  const { allumee, toucher } = useNoteAllumee();
  return (
    <div className="space-y-4" data-jeu-solfa="modulateur">
      <BarreRetour titre="Le modulateur" retour={retour} />
      <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
        Touchez une note pour l&apos;entendre. Essayez de chanter <b>d r m f s l t d¹</b> en montant, puis en descendant.
      </p>
      <Modulateur notes={["s1", "l1", "t1", ...["d", "r", "m", "f", "s", "l", "t", "d1", "r1"] as NoteId[]]} onNote={toucher} allumee={allumee} />
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => jouerNotes(["d", "r", "m", "f", "s", "l", "t", "d1"], { duree: 0.45, pause: 0.05 })}
          className="min-h-14 rounded-2xl bg-marine-900 font-semibold text-white">Écouter en montant</button>
        <button type="button" onClick={() => jouerNotes(["d1", "t", "l", "s", "f", "m", "r", "d"], { duree: 0.45, pause: 0.05 })}
          className="min-h-14 rounded-2xl bg-white font-semibold text-marine-900 shadow-sm">Écouter en descendant</button>
      </div>
    </div>
  );
}

/* ───────────── La leçon avant le niveau ───────────── */

function Lecon({ niveau, retour, jouer }: { niveau: Niveau; retour: () => void; jouer: () => void }) {
  const { allumee, toucher } = useNoteAllumee();
  return (
    <div className="space-y-4" data-jeu-solfa="lecon">
      <BarreRetour titre={`Niveau ${niveau.numero} · ${niveau.titre}`} retour={retour} />
      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-or-600">La leçon</p>
        {niveau.lecon.map((p) => <p key={p} className="text-base leading-relaxed text-slate-700">{p}</p>)}
      </section>
      {niveau.lignesLecon && (
        <div className="space-y-2">{niveau.lignesLecon.map((l) => <LigneAEcouter key={l} solfa={l} />)}</div>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        {niveau.notesLecon.map((id) => (
          <button key={id} type="button" onClick={() => toucher(id)}
            className={`flex min-h-16 min-w-16 flex-col items-center justify-center rounded-2xl px-3 shadow-sm ${allumee === id ? "bg-or-400 text-marine-950" : "bg-white text-marine-900"}`}>
            <span className="font-serif text-2xl font-bold">{note(id).texte}</span>
            <span className="text-[11px] text-slate-500">{note(id).nom}</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={jouer} data-commencer
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-or-500 text-lg font-bold text-marine-950 shadow-sm">
        <Play className="size-5" aria-hidden /> Commencer le jeu
      </button>
      <p className="text-center text-xs text-slate-500">{QUESTIONS_PAR_PARTIE} questions · {POINTS_BONNE_REPONSE} points par bonne réponse</p>
    </div>
  );
}

/* ───────────── Une partie de 10 questions ───────────── */

function Partie({ niveau, quitter, terminer }: { niveau: Niveau; quitter: () => void; terminer: (bonnes: number) => void }) {
  const [questions] = useState(() => preparerPartie(niveau));
  const [i, setI] = useState(0);
  const [bonnes, setBonnes] = useState(0);
  const [serie, setSerie] = useState(0);
  const [reponse, setReponse] = useState<{ juste: boolean } | null>(null);
  const q = questions[i];
  const micro = useMicro();

  const ecouter = () => jouerQuestion(q);
  // On fait entendre la question dès qu'elle s'affiche.
  useEffect(() => {
    const question = questions[i];
    const t = setTimeout(() => jouerQuestion(question), 250);
    return () => clearTimeout(t);
  }, [i, questions]);

  const repondre = (juste: boolean) => {
    if (reponse) return;
    jouerSignal(juste);
    setReponse({ juste });
    if (juste) { setBonnes((b) => b + 1); setSerie((s) => s + 1); } else setSerie(0);
  };
  const suivante = () => {
    if (i + 1 >= questions.length) { terminer(bonnes); return; }
    setReponse(null);
    setI(i + 1);
  };

  return (
    <div className="space-y-4" data-jeu-solfa="partie" data-question={i + 1}>
      <div className="flex items-center gap-3">
        <button type="button" onClick={quitter} className="rounded-xl bg-white p-3 text-marine-900 shadow-sm" aria-label="Quitter la partie">
          <X className="size-5" aria-hidden />
        </button>
        <div className="flex-1">
          <div className="h-3 overflow-hidden rounded-full bg-white shadow-inner">
            <div className="h-full rounded-full bg-or-500 transition-all" style={{ width: `${((i + (reponse ? 1 : 0)) / questions.length) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">Question {i + 1} sur {questions.length} · Niveau {niveau.numero}</p>
        </div>
        <div className="rounded-xl bg-marine-900 px-3 py-2 text-center text-white">
          <p className="text-lg font-bold leading-none text-or-400">{bonnes * POINTS_BONNE_REPONSE}</p>
          <p className="text-[10px]">points</p>
        </div>
      </div>

      {serie >= 3 && !reponse && (
        <p className="rounded-full bg-or-100 py-1 text-center text-sm font-semibold text-or-600">🔥 {serie} bonnes réponses de suite !</p>
      )}

      <section className="rounded-2xl bg-white p-5 text-center shadow-sm">
        <p className="text-base font-medium text-marine-900">{q.consigne}</p>
        {q.type === "choix" && q.grand && <p className="mt-4 font-serif text-5xl font-bold tracking-wide text-marine-900">{q.grand}</p>}
        {q.type === "chant" && <p className="mt-3 font-serif text-6xl font-bold text-marine-900">{note(q.cible).texte}</p>}
        {(q.type === "chant" || q.sons || (q.type === "choix" && q.rythme)) && (
          <button type="button" onClick={() => ecouter()} data-ecouter
            className="mx-auto mt-4 flex min-h-14 items-center gap-2 rounded-full bg-marine-900 px-6 text-base font-semibold text-white active:scale-95">
            <Volume2 className="size-5" aria-hidden /> {i === 0 && !reponse ? "Écouter" : "Réécouter"}
          </button>
        )}
      </section>

      {q.type === "choix"
        ? <Choix key={i} q={q} reponse={reponse} repondre={(k) => repondre(k === q.bonne)} />
        : q.type === "chant"
        ? <ChantQuestion key={i} cible={q.cible} micro={micro} bloque={!!reponse} repondre={repondre} />
        : <Dictee key={i} q={q} bloque={!!reponse} valider={(tape) => repondre(dicteeJuste(q.sons, tape))} />}

      {reponse && (
        <section className={`space-y-3 rounded-2xl p-4 ${reponse.juste ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`} data-resultat={reponse.juste ? "juste" : "faux"} aria-live="polite">
          <p className="flex items-center gap-2 text-lg font-bold">
            {reponse.juste ? <><Check className="size-6" aria-hidden /> Bravo ! +{POINTS_BONNE_REPONSE} points</> : <><X className="size-6" aria-hidden /> Pas tout à fait…</>}
          </p>
          <p className="text-sm">{q.explication}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => (q.type === "choix" && !q.rythme ? jouerNotes(q.sonReponse ?? []) : jouerQuestion(q))}
              className="flex min-h-12 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-marine-900 shadow-sm">
              <Volume2 className="size-4" aria-hidden /> Entendre
            </button>
            <button type="button" onClick={suivante} data-suivant
              className="min-h-12 flex-1 rounded-xl bg-marine-900 text-base font-bold text-white">
              {i + 1 >= questions.length ? "Voir mon score" : "Suivant"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Choix({ q, reponse, repondre }: { q: Extract<Question, { type: "choix" }>; reponse: { juste: boolean } | null; repondre: (k: number) => void }) {
  const [choisi, setChoisi] = useState<number | null>(null);
  const colonnes = q.rythme ? "grid-cols-1" : q.choix.length > 4 ? "grid-cols-4" : q.choix.length === 4 ? "grid-cols-2" : q.choix.length === 2 ? "grid-cols-2" : "grid-cols-3";
  return (
    <div className={`grid gap-2 ${colonnes}`} data-choix>
      {q.choix.map((c, k) => {
        const etat = !reponse ? "" : k === q.bonne ? "bg-emerald-500 text-white" : k === choisi ? "bg-red-500 text-white" : "bg-white opacity-50";
        return (
          <button key={c.texte + k} type="button" disabled={!!reponse} onClick={() => { setChoisi(k); repondre(k); }} data-reponse={k === q.bonne ? "bonne" : "autre"}
            className={`flex min-h-20 flex-col items-center justify-center rounded-2xl px-2 py-3 shadow-sm active:scale-95 ${etat || "bg-white text-marine-900"}`}>
            <span className={`font-serif font-bold ${c.texte.length > 12 ? "whitespace-pre text-lg" : c.texte.length > 3 ? "text-xl" : "text-3xl"}`}>{c.texte}</span>
            {c.sous && <span className={`mt-1 text-[11px] leading-tight ${etat ? "" : "text-slate-500"}`}>{c.sous}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Dictee({ q, bloque, valider }: { q: Extract<Question, { type: "dictee" }>; bloque: boolean; valider: (tape: NoteId[]) => void }) {
  const [tape, setTape] = useState<NoteId[]>([]);
  const { allumee, toucher } = useNoteAllumee();
  const ajouter = (n: NoteId) => {
    toucher(n);
    if (!bloque && tape.length < q.sons.length) setTape([...tape, n]);
  };
  return (
    <div className="space-y-3" data-dictee>
      <div className="flex justify-center gap-2">
        {q.sons.map((attendu, k) => {
          const t = tape[k];
          const couleur = !bloque ? (t ? "bg-marine-900 text-white" : "border-2 border-dashed border-slate-300 bg-white text-slate-300")
            : t === attendu ? "bg-emerald-500 text-white" : "bg-red-500 text-white";
          return (
            <span key={k} className={`flex size-16 flex-col items-center justify-center rounded-2xl font-serif text-3xl font-bold ${couleur}`}>
              {t ? note(t).texte : "?"}
              {bloque && t !== attendu && <span className="font-sans text-[10px]">→ {note(attendu).texte}</span>}
            </span>
          );
        })}
      </div>
      {!bloque && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setTape(tape.slice(0, -1))} disabled={!tape.length}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-marine-900 shadow-sm disabled:opacity-40">
            <Delete className="size-4" aria-hidden /> Effacer
          </button>
          <button type="button" onClick={() => valider(tape)} disabled={tape.length < q.sons.length} data-valider
            className="min-h-12 rounded-xl bg-or-500 text-base font-bold text-marine-950 disabled:opacity-40">Valider</button>
        </div>
      )}
      <Modulateur notes={q.touches} onNote={ajouter} allumee={allumee} />
    </div>
  );
}

/* ───────────── Fin de partie ───────────── */

function Fin({ niveau, bonnes, avant, rejouer, suivant, accueil }: {
  niveau: Niveau; bonnes: number; avant: number; rejouer: () => void; suivant?: () => void; accueil: () => void;
}) {
  const e = etoiles(bonnes);
  useEffect(() => {
    if (bonnes >= SEUIL_REUSSITE) jouerNotes(["d", "m", "s", "d1"], { duree: 0.25, pause: 0.03 });
  }, [bonnes]);
  const message = e === 3 ? "Parfait ! Quelle oreille !" : e === 2 ? "Très bien !" : e === 1 ? "Bien joué, niveau réussi !" : "Courage, essayez encore !";
  return (
    <div className="space-y-5 text-center" data-jeu-solfa="fin" data-bonnes={bonnes}>
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Niveau {niveau.numero} · {niveau.titre}</p>
        <div className="mt-4 flex justify-center"><Etoiles n={e} /></div>
        <p className="mt-4 text-2xl font-bold text-marine-900">{message}</p>
        <p className="mt-2 text-lg text-slate-700"><b>{bonnes}</b> bonnes réponses sur {QUESTIONS_PAR_PARTIE}</p>
        <p className="mt-1 text-base font-semibold text-or-600">+{bonnes * POINTS_BONNE_REPONSE} points</p>
        {bonnes > avant && avant > 0 && <p className="mt-2 text-sm text-emerald-700">Nouveau record pour ce niveau !</p>}
        {bonnes < SEUIL_REUSSITE && <p className="mt-3 text-sm text-slate-500">Il faut {SEUIL_REUSSITE} bonnes réponses pour ouvrir le niveau suivant.</p>}
      </section>
      {suivant && (
        <button type="button" onClick={suivant} data-niveau-suivant
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-or-500 text-lg font-bold text-marine-950">
          <Play className="size-5" aria-hidden /> Niveau suivant
        </button>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={rejouer} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-marine-900 font-semibold text-white">
          <RotateCcw className="size-4" aria-hidden /> Rejouer
        </button>
        <button type="button" onClick={accueil} className="min-h-14 rounded-2xl bg-white font-semibold text-marine-900 shadow-sm">Tous les niveaux</button>
      </div>
    </div>
  );
}

/** Fait entendre une question : le Do de départ si besoin, puis les notes. */
function jouerQuestion(q: Question) {
  if (q.type === "choix" && q.rythme) jouerRythme(lireRythme(q.rythme));
  else if (q.type === "chant") jouerNotes([q.cible], { avecDo: true });
  else if (q.sons) jouerNotes(q.sons, { avecDo: !!q.avecDo });
}

/* ───────────── Le micro : le jeu écoute le choriste chanter ───────────── */

type EtatMicro = "arret" | "demande" | "ecoute" | "refuse";

function useMicro() {
  const [etat, setEtat] = useState<EtatMicro>("arret");
  const [chantee, setChantee] = useState<NoteChantee | null>(null);
  const [hz, setHz] = useState<number | null>(null);
  const ouvert = useRef<Micro | null>(null);
  const minuterie = useRef<ReturnType<typeof setInterval> | null>(null);

  const arreter = () => {
    if (minuterie.current) clearInterval(minuterie.current);
    minuterie.current = null;
    ouvert.current?.arreter();
    ouvert.current = null;
    setEtat("arret");
    setChantee(null);
    setHz(null);
  };

  const demarrer = async () => {
    if (ouvert.current) return;
    setEtat("demande");
    try {
      ouvert.current = await ouvrirMicro();
    } catch {
      setEtat("refuse");
      return;
    }
    setEtat("ecoute");
    let precedent: number | null = null;
    let silence = 0;
    minuterie.current = setInterval(() => {
      const m = ouvert.current;
      if (!m) return;
      // On n'écoute pas pendant que le téléphone joue lui-même une note.
      if (sonEnCours()) { setHz(null); return; }
      const { donnees, frequence } = m.lire();
      const f = detecterFrequence(donnees, frequence);
      if (f === null) {
        if (++silence > 3) { setHz(null); precedent = null; }
        return;
      }
      silence = 0;
      // Lissage : on attend deux mesures proches pour éviter que la note saute.
      if (precedent !== null && Math.abs(12 * Math.log2(f / precedent)) < 0.6) setHz(f);
      precedent = f;
    }, 90);
  };

  useEffect(() => () => {
    if (minuterie.current) clearInterval(minuterie.current);
    ouvert.current?.arreter();
  }, []);

  return { etat, hz, demarrer, arreter, chantee, setChantee };
}

type MicroJeu = ReturnType<typeof useMicro>;

/** La note chantée, calculée à partir de la hauteur mesurée et du Do choisi. */
function useNoteChantee(micro: MicroJeu, reglages?: Reglages) {
  const doHz = reglages ? doDe(reglages) : null;
  return useMemo(() => {
    if (micro.hz === null) return null;
    return noteChantee(micro.hz, doHz ?? doActuel());
  }, [micro.hz, doHz]);
}

function BoutonMicro({ micro, texte = "Je chante" }: { micro: MicroJeu; texte?: string }) {
  if (micro.etat === "ecoute") {
    return (
      <button type="button" onClick={micro.arreter} data-micro="arreter"
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-base font-semibold text-red-600 shadow-sm">
        <MicOff className="size-5" aria-hidden /> Arrêter le micro
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <button type="button" onClick={() => void micro.demarrer()} disabled={micro.etat === "demande"} data-micro="demarrer"
        className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-or-500 text-lg font-bold text-marine-950 shadow-sm disabled:opacity-60">
        <Mic className="size-6" aria-hidden /> {micro.etat === "demande" ? "Ouverture du micro…" : texte}
      </button>
      {micro.etat === "refuse" && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          Le micro n&apos;a pas pu s&apos;ouvrir. Touchez « Autoriser » quand le téléphone demande le micro, ou autorisez-le dans les réglages du navigateur, puis réessayez.
        </p>
      )}
    </div>
  );
}

/** Aiguille : trop bas, juste, trop haut. `ecart` en demi-tons (-1 à +1 affiché). */
function Aiguille({ ecart }: { ecart: number | null }) {
  const pos = ecart === null ? 50 : 50 + Math.max(-1, Math.min(1, ecart)) * 45;
  const juste = ecart !== null && Math.abs(ecart) <= 0.35;
  return (
    <div className="space-y-1" aria-hidden>
      <div className="relative h-4 rounded-full bg-gradient-to-r from-sky-200 via-emerald-300 to-rose-200">
        <div className="absolute inset-y-0 left-[41%] w-[18%] rounded-full bg-emerald-400/70" />
        {ecart !== null && (
          <div className={`absolute -top-1 h-6 w-2 -translate-x-1/2 rounded-full transition-all ${juste ? "bg-emerald-700" : "bg-marine-900"}`} style={{ left: `${pos}%` }} />
        )}
      </div>
      <div className="flex justify-between text-[11px] text-slate-500"><span>trop bas</span><span>juste</span><span>trop haut</span></div>
    </div>
  );
}

function ChanterLibre({ reglages, retour }: { reglages: Reglages; retour: () => void }) {
  const micro = useMicro();
  const chantee = useNoteChantee(micro, reglages);
  const ecart = chantee ? chantee.cents / 100 : null;
  return (
    <div className="space-y-4" data-jeu-solfa="chanter">
      <BarreRetour titre="Je chante, le jeu me dit la note" retour={() => { micro.arreter(); retour(); }} />
      <section className="rounded-3xl bg-marine-900 p-5 text-center text-white shadow-lg" aria-live="polite">
        <p className="text-sm text-marine-100/80">
          {micro.etat !== "ecoute" ? "Touchez « Je chante », puis chantez une note sur « a » ou « o »." : chantee ? "Vous chantez :" : "J'écoute… chantez une note."}
        </p>
        <p className="mt-2 font-serif text-8xl font-bold text-or-400" data-note-chantee={chantee?.texte ?? ""}>{chantee?.texte ?? "…"}</p>
        <p className="mt-1 h-7 text-lg font-semibold">{chantee?.nom ?? ""}</p>
        <div className="mt-3 rounded-2xl bg-white/95 p-3 text-left"><Aiguille ecart={ecart} /></div>
        {chantee && (
          <p className="mt-2 text-sm text-marine-100">
            {Math.abs(chantee.cents) <= 15 ? "Bien juste !" : chantee.cents < 0 ? "Un tout petit peu bas : montez légèrement." : "Un tout petit peu haut : descendez légèrement."}
          </p>
        )}
      </section>
      <BoutonMicro micro={micro} />
      <button type="button" onClick={() => jouerNotes(["d"], { duree: 1.2 })}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-base font-semibold text-marine-900 shadow-sm">
        <Volume2 className="size-5" aria-hidden /> Écouter le Do de départ
      </button>
      <Modulateur notes={["s1", "l1", "t1", "d", "r", "m", "f", "s", "l", "t", "d1", "r1"]} onNote={(n) => jouerNotes([n], { duree: 0.8 })} allumee={chantee?.id ?? null} />
      <ChoixReglages reglages={reglages} />
    </div>
  );
}

/** Une question « Chantez la note » : il faut tenir la bonne note un petit moment. */
function ChantQuestion({ cible, micro, bloque, repondre }: { cible: NoteId; micro: MicroJeu; bloque: boolean; repondre: (juste: boolean) => void }) {
  const chantee = useNoteChantee(micro);
  const [tenu, setTenu] = useState(0);
  const ecart = chantee ? ecartAvec(chantee, cible) : null;
  const juste = chantee ? chanteJuste(chantee, cible) : false;
  const TENIR = 6; // environ une demi-seconde de note juste

  // Chaque nouvelle mesure juste remplit la jauge ; elle se vide doucement sinon.
  const [derniereMesure, setDerniereMesure] = useState<number | null>(null);
  if (!bloque && micro.hz !== derniereMesure) {
    setDerniereMesure(micro.hz);
    if (micro.hz !== null) setTenu((t) => (juste ? t + 1 : Math.max(0, t - 1)));
  }
  useEffect(() => {
    if (!bloque && tenu >= TENIR) repondre(true);
  }, [tenu, bloque, repondre]);

  return (
    <div className="space-y-3" data-chant={cible}>
      {micro.etat === "ecoute" && !bloque && (
        <section className="space-y-3 rounded-2xl bg-white p-4 text-center shadow-sm" aria-live="polite">
          <p className="text-sm text-slate-500">Vous chantez :</p>
          <p className="font-serif text-5xl font-bold text-marine-900" data-note-chantee={chantee?.texte ?? ""}>{chantee?.texte ?? "…"}</p>
          <Aiguille ecart={ecart === null ? null : Math.max(-1, Math.min(1, ecart))} />
          <p className={`text-base font-bold ${juste ? "text-emerald-700" : "text-marine-900"}`}>
            {ecart === null ? "Chantez la note…" : juste ? "C'est juste, tenez la note !" : ecart < 0 ? "Plus haut ⬆" : "Plus bas ⬇"}
          </p>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (tenu / TENIR) * 100)}%` }} />
          </div>
        </section>
      )}
      {!bloque && <BoutonMicro micro={micro} />}
      {!bloque && (
        <button type="button" onClick={() => repondre(false)} className="w-full py-2 text-sm font-medium text-slate-500 underline">
          Je n&apos;y arrive pas, passer
        </button>
      )}
    </div>
  );
}

function ChoixReglages({ reglages }: { reglages: Reglages }) {
  const bouton = (actif: boolean) => `min-h-11 rounded-xl px-3 text-sm font-semibold ${actif ? "bg-marine-900 text-white" : "bg-slate-100 text-marine-900"}`;
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm" data-reglages>
      <h2 className="font-semibold text-marine-900">Ma voix et la tonalité</h2>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={bouton(reglages.voix === "femme")} onClick={() => sauverReglages({ ...reglages, voix: "femme" })}>Femme ou enfant (S, A)</button>
        <button type="button" className={bouton(reglages.voix === "homme")} onClick={() => sauverReglages({ ...reglages, voix: "homme" })}>Homme (T, B)</button>
      </div>
      <label className="block text-sm text-slate-600">
        Le Do (d) est sur :
        <select value={reglages.ton} onChange={(e) => sauverReglages({ ...reglages, ton: Number(e.target.value) })}
          className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-marine-900">
          {TONALITES.map((t) => <option key={t.ton} value={t.ton}>{t.nom}{t.ton === 0 ? " (conseillé)" : ""}</option>)}
        </select>
      </label>
      <p className="text-xs text-slate-500">Les notes jouées et la note affichée suivent ce réglage.</p>
    </section>
  );
}

/* ───────────── Chanter un air : le jeu l'écrit en sol-fa avec son rythme ───────────── */

const DUREE_MAX_MS = 40000;
const maintenant = () => performance.now();

function MelodieChantee({ reglages, retour }: { reglages: Reglages; retour: () => void }) {
  const [etat, setEtat] = useState<"pret" | "demande" | "enregistre" | "fini" | "refuse">("pret");
  const [mesures, setMesures] = useState<Mesure[]>([]);
  const [enDirect, setEnDirect] = useState<string | null>(null);
  const [tempsParMesure, setTempsParMesure] = useState(4);
  const [copie, setCopie] = useState(false);
  const micro = useRef<Micro | null>(null);
  const minuterie = useRef<ReturnType<typeof setInterval> | null>(null);
  const tampon = useRef<Mesure[]>([]);
  const doHz = doDe(reglages);

  const arreter = () => {
    if (minuterie.current) clearInterval(minuterie.current);
    minuterie.current = null;
    micro.current?.arreter();
    micro.current = null;
  };
  useEffect(() => arreter, []);

  const commencer = async () => {
    setEtat("demande");
    try { micro.current = await ouvrirMicro(); } catch { setEtat("refuse"); return; }
    tampon.current = [];
    setCopie(false);
    setEtat("enregistre");
    const debut = maintenant();
    minuterie.current = setInterval(() => {
      const m = micro.current;
      if (!m) return;
      const t = maintenant() - debut;
      const { donnees, frequence } = m.lire();
      const f = detecterFrequence(donnees, frequence);
      const demiTons = f === null ? null : 12 * Math.log2(f / doHz);
      tampon.current.push({ t, demiTons });
      setEnDirect(demiTons === null ? null : texteDemiTons(Math.round(demiTons)));
      if (t > DUREE_MAX_MS) terminer();
    }, 40);
  };
  const terminer = () => {
    arreter();
    setMesures([...tampon.current]);
    setEnDirect(null);
    setEtat("fini");
  };

  const resultat = useMemo(() => (mesures.length ? transcrire(mesures, tempsParMesure) : null), [mesures, tempsParMesure]);
  const total = resultat?.notes.reduce((t, n) => t + n.demiTemps, 0) ?? 0;

  return (
    <div className="space-y-4" data-jeu-solfa="melodie">
      <BarreRetour titre="Chantez un air, je l'écris" retour={() => { arreter(); retour(); }} />
      {etat !== "fini" && (
        <section className="space-y-2 rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
          <p>1. Touchez <b>« Commencer »</b>.</p>
          <p>2. Chantez un petit air (sur « la » ou « no »), bien en rythme, dans un endroit calme.</p>
          <p>3. Touchez <b>« J&apos;ai fini »</b> : le jeu écrit vos notes et leur rythme en sol-fa.</p>
        </section>
      )}

      {etat === "enregistre" && (
        <section className="rounded-3xl bg-marine-900 p-5 text-center text-white shadow-lg" aria-live="polite">
          <p className="flex items-center justify-center gap-2 text-sm text-marine-100/80">
            <span className="size-3 animate-pulse rounded-full bg-red-500" aria-hidden /> J&apos;écoute… chantez !
          </p>
          <p className="mt-2 font-serif text-7xl font-bold text-or-400">{enDirect ?? "…"}</p>
        </section>
      )}

      {etat === "enregistre" ? (
        <button type="button" onClick={terminer} data-melodie="finir"
          className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 text-lg font-bold text-white shadow-sm">
          <Check className="size-6" aria-hidden /> J&apos;ai fini
        </button>
      ) : (
        <button type="button" onClick={() => void commencer()} disabled={etat === "demande"} data-melodie="commencer"
          className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-or-500 text-lg font-bold text-marine-950 shadow-sm disabled:opacity-60">
          <Mic className="size-6" aria-hidden /> {etat === "demande" ? "Ouverture du micro…" : etat === "fini" ? "Chanter un autre air" : "Commencer"}
        </button>
      )}
      {etat === "refuse" && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          Le micro n&apos;a pas pu s&apos;ouvrir. Touchez « Autoriser » quand le téléphone demande le micro, puis réessayez.
        </p>
      )}

      {etat === "fini" && resultat && (
        resultat.notes.length === 0 ? (
          <p className="rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">
            Je n&apos;ai entendu aucune note. Chantez un peu plus fort, plus près du téléphone, puis réessayez.
          </p>
        ) : (
          <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm" data-transcription>
            <h2 className="font-semibold text-marine-900">Votre air en sol-fa</h2>
            <p className="break-words rounded-xl bg-or-100 p-4 font-serif text-2xl font-bold leading-relaxed text-marine-900" data-solfa={resultat.solfa}>
              {resultat.solfa}
            </p>
            <div className="flex gap-1" aria-hidden>
              {resultat.notes.map((n, k) => (
                <div key={k} style={{ flexGrow: n.demiTemps }}
                  className={`flex h-10 min-w-0 items-center justify-center rounded-md text-sm font-bold ${n.demiTons === null ? "bg-slate-100 text-slate-300" : "bg-marine-900 text-white"}`}>
                  {n.demiTons === null ? "" : texteDemiTons(n.demiTons)}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {resultat.notes.filter((n) => n.demiTons !== null).length} notes · {Math.ceil(total / 2)} temps · 1 temps ≈ {(resultat.tempsMs / 1000).toFixed(1)} s
            </p>
            <div>
              <p className="mb-1 text-sm text-slate-600">Temps par mesure :</p>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map((n) => (
                  <button key={n} type="button" onClick={() => setTempsParMesure(n)}
                    className={`min-h-11 rounded-xl text-sm font-semibold ${tempsParMesure === n ? "bg-marine-900 text-white" : "bg-slate-100 text-marine-900"}`}>
                    {n} temps
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => jouerMelodie(resultat.notes, resultat.tempsMs)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-marine-900 text-sm font-semibold text-white">
                <Volume2 className="size-4" aria-hidden /> Écouter
              </button>
              <button type="button" onClick={() => { void navigator.clipboard?.writeText(resultat.solfa).then(() => setCopie(true)).catch(() => {}); }}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-semibold text-marine-900">
                <Copy className="size-4" aria-hidden /> {copie ? "Copié !" : "Copier"}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Le téléphone fait de son mieux : vérifiez l&apos;écriture avec votre chef de chœur. « : » sépare les temps, « | » les mesures, « - » prolonge la note, « . » coupe un temps en deux.
            </p>
          </section>
        )
      )}
      <ChoixReglages reglages={reglages} />
    </div>
  );
}

/* ───────────── Le cours de tonic sol-fa ───────────── */

const VITESSES = [{ nom: "Lent", parMinute: 56 }, { nom: "Moyen", parMinute: 72 }, { nom: "Rapide", parMinute: 92 }];
let vitesseChoisie = 72;

/** Une ligne de sol-fa avec un bouton pour l'écouter (avec le tic-tac des temps). */
function LigneAEcouter({ solfa, aide }: { solfa: string; aide?: string }) {
  const [joue, setJoue] = useState(false);
  const ecouter = () => {
    const ms = jouerRythme(lireRythme(solfa), { parMinute: vitesseChoisie });
    setJoue(true);
    setTimeout(() => setJoue(false), ms);
  };
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
      <button type="button" onClick={ecouter} aria-label={`Écouter ${solfa}`} data-ecouter-ligne
        className={`flex size-12 shrink-0 items-center justify-center rounded-full ${joue ? "bg-or-500 text-marine-950" : "bg-marine-900 text-white"}`}>
        <Volume2 className="size-5" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <p className="break-words font-serif text-lg font-bold leading-snug text-marine-900">{solfa}</p>
        {aide && <p className="text-xs text-slate-500">{aide}</p>}
      </div>
    </div>
  );
}

function ChoixVitesse() {
  const [v, setV] = useState(vitesseChoisie);
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">Vitesse :</span>
      {VITESSES.map((x) => (
        <button key={x.nom} type="button" onClick={() => { vitesseChoisie = x.parMinute; setV(x.parMinute); }}
          className={`min-h-10 flex-1 rounded-xl font-semibold ${v === x.parMinute ? "bg-marine-900 text-white" : "bg-white text-marine-900 shadow-sm"}`}>
          {x.nom}
        </button>
      ))}
    </div>
  );
}

function SommaireCours({ retour, ouvrir }: { retour: () => void; ouvrir: (l: LeconCours) => void }) {
  return (
    <div className="space-y-4" data-jeu-solfa="cours">
      <BarreRetour titre="Le cours de tonic sol-fa" retour={retour} />
      <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
        Paix ! Ce cours apprend à lire les notes et le rythme en tonic sol-fa. Chaque leçon a des exemples et des exercices :
        touchez <Volume2 className="inline size-4" aria-label="le haut-parleur" /> pour les écouter, puis chantez-les.
      </p>
      <ol className="space-y-2">
        {COURS.map((l) => (
          <li key={l.id}>
            <button type="button" onClick={() => ouvrir(l)} data-lecon-cours={l.id}
              className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm active:bg-slate-50">
              <span className="flex-1">
                <span className="block text-base font-semibold text-marine-900">{l.titre}</span>
                <span className="block text-xs text-slate-500">{l.resume}</span>
              </span>
              <ChevronRight className="size-5 text-slate-300" aria-hidden />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function LeconDuCours({ lecon, retour, suivante, niveauOuvert: ouvert, jouerNiveau }: {
  lecon: LeconCours; retour: () => void; suivante: () => void; niveauOuvert: (titre: string) => boolean; jouerNiveau: (titre: string) => void;
}) {
  const derniere = COURS[COURS.length - 1] === lecon;
  return (
    <div className="space-y-4" data-jeu-solfa="lecon-cours" data-lecon={lecon.id}>
      <BarreRetour titre={lecon.titre} retour={retour} />
      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        {lecon.explication.map((p) => <p key={p} className="text-base leading-relaxed text-slate-700">{p}</p>)}
      </section>
      {lecon.regles && (
        <table className="w-full overflow-hidden rounded-2xl bg-white text-left text-sm shadow-sm">
          <tbody className="divide-y divide-slate-100">
            {lecon.regles.map((r) => (
              <tr key={r.signe}>
                <td className="whitespace-pre px-4 py-3 font-serif text-lg font-bold text-marine-900">{r.signe}</td>
                <td className="px-4 py-3 text-slate-600">{r.sens}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ChoixVitesse />
      <section className="space-y-2">
        <h2 className="font-semibold text-marine-900">Exemples</h2>
        {lecon.exemples.map((l) => <LigneAEcouter key={l.solfa} {...l} />)}
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-marine-900">Exercices à chanter</h2>
        <p className="text-xs text-slate-500">Écoutez une fois, puis chantez en suivant le tic-tac. Battez le temps avec la main.</p>
        {lecon.exercices.map((l) => <LigneAEcouter key={l.solfa} {...l} />)}
      </section>
      {lecon.niveauJeu && (
        ouvert(lecon.niveauJeu) ? (
          <button type="button" onClick={() => jouerNiveau(lecon.niveauJeu!)}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-or-500 text-base font-bold text-marine-950">
            <Play className="size-5" aria-hidden /> S&apos;entraîner dans le jeu : {lecon.niveauJeu}
          </button>
        ) : (
          <p className="rounded-2xl bg-slate-100 p-3 text-center text-sm text-slate-500">
            Le niveau « {lecon.niveauJeu} » s&apos;ouvrira dans le jeu quand vous aurez réussi les niveaux d&apos;avant.
          </p>
        )
      )}
      {!derniere && (
        <button type="button" onClick={suivante} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-marine-900 text-base font-semibold text-white">
          Leçon suivante <ChevronRight className="size-5" aria-hidden />
        </button>
      )}
    </div>
  );
}
