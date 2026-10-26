/** Types de fichiers acceptés, reconnus par leur contenu (et non par leur nom). */
export const TYPES_FICHIER = {
  "application/pdf": "PDF",
  "image/jpeg": "Photo",
  "image/png": "Image",
  "audio/mpeg": "Audio MP3",
} as const;
export type TypeFichier = keyof typeof TYPES_FICHIER;

export const TAILLE_MAX = 4 * 1024 * 1024;

const commencePar = (o: Uint8Array, signature: number[]) => signature.every((b, i) => o[i] === b);

/** Type réel d'un fichier d'après ses premiers octets, ou null s'il n'est pas accepté. */
export function detecterType(o: Uint8Array): TypeFichier | null {
  if (commencePar(o, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // %PDF-
  if (commencePar(o, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (commencePar(o, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (commencePar(o, [0x49, 0x44, 0x33]) || (o[0] === 0xff && (o[1] & 0xe0) === 0xe0)) return "audio/mpeg"; // ID3 ou trame MP3
  return null;
}

const EXTENSIONS: Record<TypeFichier, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "audio/mpeg": "mp3" };

/** Nom de fichier sans chemin ni caractère spécial, avec la bonne extension. */
export function nomFichierSur(nom: string, type: TypeFichier): string {
  const base = (nom.split(/[\\/]/).pop() ?? "")
    .replace(/\.[^.]*$/, "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z0-9 _-]+/g, " ").trim().replace(/\s+/g, "-")
    .slice(0, 100) || "fichier";
  return `${base}.${EXTENSIONS[type]}`;
}

/** « 1,2 Mo », « 350 Ko » */
export function formatTaille(octets: number): string {
  if (octets >= 1024 * 1024) return `${(octets / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
  return `${Math.max(1, Math.round(octets / 1024))} Ko`;
}

export type FichierLu = { type: TypeFichier; nom: string; taille: number; base64: string };

/** Vérifie un fichier envoyé par formulaire : taille et type réel. */
export async function lireFichier(f: FormDataEntryValue | null): Promise<FichierLu | string> {
  if (!(f instanceof File) || f.size === 0) return "Choisissez un fichier.";
  if (f.size > TAILLE_MAX) return `Fichier trop lourd (${formatTaille(f.size)}). La limite est de 4 Mo.`;
  const octets = new Uint8Array(await f.arrayBuffer());
  const type = detecterType(octets);
  if (!type) return "Format non accepté. Envoyez un PDF, une photo (JPEG ou PNG) ou un MP3.";
  return { type, nom: nomFichierSur(f.name, type), taille: octets.length, base64: Buffer.from(octets).toString("base64") };
}
