"use client";

import { frequence, type NoteId } from "./jeu";

/**
 * Sons du jeu, fabriqués directement par le téléphone (Web Audio) :
 * aucun fichier audio à télécharger, cela marche aussi avec peu de connexion.
 */
let contexte: AudioContext | null = null;

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
    jouerA(ctx, frequence(n), t, duree);
    t += duree + pause;
  }
  return Math.round((t - ctx.currentTime) * 1000);
}

/** Petit son de réussite ou d'erreur. */
export function jouerSignal(juste: boolean) {
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime + 0.02;
  if (juste) {
    jouerA(ctx, 523.25, t, 0.16, 0.18);
    jouerA(ctx, 783.99, t + 0.12, 0.3, 0.18);
  } else {
    jouerA(ctx, 220, t, 0.35, 0.16);
  }
}
