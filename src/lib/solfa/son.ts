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
  sortie.gain.exponentialRampToValueAtTime(volume, debut + 0.03);
  sortie.gain.exponentialRampToValueAtTime(volume * 0.6, debut + 0.25);
  sortie.gain.setValueAtTime(volume * 0.6, debut + duree - 0.12);
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
