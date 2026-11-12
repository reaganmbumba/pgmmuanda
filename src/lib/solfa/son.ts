"use client";

import { frequence, type NoteId } from "./jeu";

/**
 * Sons du jeu, fabriqués directement par le téléphone (Web Audio) :
 * aucun fichier audio à télécharger, cela marche aussi avec peu de connexion.
 */
let contexte: AudioContext | null = null;
/** Hauteur du Do (change selon la voix et la tonalité choisies). */
let doHz = 261.63;
export const reglerDo = (hz: number) => { doHz = hz; };
export const doActuel = () => doHz;
/** Jusqu'à quand le téléphone joue un son (pour ne pas l'écouter au micro). */
let finDuSon = 0;
export const sonEnCours = () => (typeof performance !== "undefined" ? performance.now() : 0) < finDuSon;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!contexte) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    contexte = new Ctx();
  }
  if (contexte.state === "suspended") void contexte.resume();
  return contexte;
}

/** Une note douce, proche d'un orgue léger. */
function jouerA(ctx: AudioContext, hz: number, debut: number, duree: number, volume = 0.28) {
  const sortie = ctx.createGain();
  sortie.gain.setValueAtTime(0.0001, debut);
  // Attaque, petite baisse, tenue puis fin : proportionnées pour les notes très courtes.
  const attaque = Math.min(0.03, duree * 0.2);
  const baisse = Math.min(0.25, duree * 0.5);
  const fin = Math.min(0.12, duree * 0.35);
  sortie.gain.exponentialRampToValueAtTime(volume, debut + attaque);
  sortie.gain.exponentialRampToValueAtTime(volume * 0.6, debut + Math.max(attaque + 0.001, baisse));
  sortie.gain.setValueAtTime(volume * 0.6, debut + Math.max(baisse, duree - fin));
  sortie.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
  sortie.connect(ctx.destination);
  for (const [type, multiple, part] of [["triangle", 1, 1], ["sine", 2, 0.25], ["sine", 3, 0.08]] as const) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz * multiple, debut);
    g.gain.value = part;
    osc.connect(g).connect(sortie);
    osc.start(debut);
    osc.stop(debut + duree + 0.05);
  }
}

/** Joue une suite de notes. Renvoie la durée totale en millisecondes. */
export function jouerNotes(notes: NoteId[], { avecDo = false, duree = 0.7, pause = 0.12 } = {}): number {
  const ctx = audio();
  if (!ctx) return 0;
  let t = ctx.currentTime + 0.05;
  const suite: (NoteId | null)[] = avecDo ? ["d", null, ...notes] : notes;
  for (const n of suite) {
    if (n === null) { t += 0.35; continue; } // petit silence après le Do de départ
    jouerA(ctx, frequence(n, doHz), t, duree);
    t += duree + pause;
  }
  const ms = Math.round((t - ctx.currentTime) * 1000);
  finDuSon = Math.max(finDuSon, performance.now() + ms + 150);
  return ms;
}

/** Petit son de réussite ou d'erreur. */
export function jouerSignal(juste: boolean) {
  const ctx = audio();
  if (!ctx) return;
  finDuSon = Math.max(finDuSon, performance.now() + 600);
  const t = ctx.currentTime + 0.02;
  if (juste) {
    jouerA(ctx, 523.25, t, 0.16, 0.18);
    jouerA(ctx, 783.99, t + 0.12, 0.3, 0.18);
  } else {
    jouerA(ctx, 220, t, 0.35, 0.16);
  }
}

/* ───────────── Le micro : écouter le choriste chanter ───────────── */

export type Micro = { lire: () => { donnees: Float32Array; frequence: number }; arreter: () => void };

/** Ouvre le micro. Lance une erreur si le choriste refuse ou si le téléphone n'a pas de micro. */
export async function ouvrirMicro(): Promise<Micro> {
  const ctx = audio();
  if (!ctx || !navigator.mediaDevices?.getUserMedia) throw new Error("micro-indisponible");
  const flux = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const source = ctx.createMediaStreamSource(flux);
  const analyse = ctx.createAnalyser();
  analyse.fftSize = 2048;
  source.connect(analyse);
  const donnees = new Float32Array(analyse.fftSize);
  return {
    lire: () => { analyse.getFloatTimeDomainData(donnees); return { donnees, frequence: ctx.sampleRate }; },
    arreter: () => { source.disconnect(); flux.getTracks().forEach((p) => p.stop()); },
  };
}

/** Rejoue une mélodie transcrite : demi-tons depuis le Do et durées en demi-temps. */
export function jouerMelodie(notes: { demiTons: number | null; demiTemps: number }[], tempsMs: number): number {
  const ctx = audio();
  if (!ctx) return 0;
  const demi = Math.min(Math.max(tempsMs, 250), 1500) / 2000; // en secondes
  let t = ctx.currentTime + 0.05;
  for (const n of notes) {
    const duree = n.demiTemps * demi;
    if (n.demiTons !== null) jouerA(ctx, doHz * 2 ** (n.demiTons / 12), t, Math.max(0.15, duree - 0.03));
    t += duree;
  }
  const ms = Math.round((t - ctx.currentTime) * 1000);
  finDuSon = Math.max(finDuSon, performance.now() + ms + 150);
  return ms;
}

/** Petit « tic » du battement des temps (plus fort sur le premier temps). */
function tic(ctx: AudioContext, debut: number, fort: boolean) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(fort ? 1800 : 1300, debut);
  g.gain.setValueAtTime(0.0001, debut);
  g.gain.exponentialRampToValueAtTime(fort ? 0.12 : 0.07, debut + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, debut + 0.05);
  osc.connect(g).connect(ctx.destination);
  osc.start(debut);
  osc.stop(debut + 0.06);
}

/**
 * Joue une ligne de rythme déjà lue (voir rythme.ts), avec le tic-tac des temps.
 * `parMinute` : nombre de temps par minute. Un temps d'annonce (« tic ») est joué avant.
 */
export function jouerRythme(evenements: { demiTons: number | null; temps: number }[], { parMinute = 72, annonce = 1 } = {}): number {
  const ctx = audio();
  if (!ctx) return 0;
  const unTemps = 60 / parMinute;
  const debut = ctx.currentTime + 0.08;
  const total = evenements.reduce((t, e) => t + e.temps, 0);
  for (let k = 0; k < annonce + Math.ceil(total - 1e-6); k++) tic(ctx, debut + k * unTemps, k === 0);
  let t = debut + annonce * unTemps;
  for (const e of evenements) {
    const duree = e.temps * unTemps;
    if (e.demiTons !== null) jouerA(ctx, doHz * 2 ** (e.demiTons / 12), t, Math.max(0.09, duree - 0.04), 0.26);
    t += duree;
  }
  const ms = Math.round((t - ctx.currentTime) * 1000);
  finDuSon = Math.max(finDuSon, performance.now() + ms + 150);
  return ms;
}
