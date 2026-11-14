/**
 * Identifiant d'une vidéo YouTube (11 caractères) tiré d'un lien collé tel quel :
 * youtube.com/live/…, watch?v=…, youtu.be/…, shorts/…, embed/… ou l'identifiant seul.
 */
export function idVideo(texte: string): string | null {
  const t = texte.trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  const m = t.match(/(?:youtube(?:-nocookie)?\.com\/(?:live\/|shorts\/|embed\/|watch\?(?:[^#]*&)?v=)|youtu\.be\/)([\w-]{11})(?![\w-])/i);
  return m?.[1] ?? null;
}
