/** Réduit une photo dans le navigateur : portrait 4:5, 360 × 450 px, JPEG ≈ 30 Ko. */
async function lireImage(fichier: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(fichier);
  } catch {
    // Certains téléphones (photos HEIC de l'iPhone) : on passe par une image classique
    const url = URL.createObjectURL(fichier);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function reduirePhoto(fichier: File): Promise<string> {
  const image = await lireImage(fichier);
  const L = 360, H = 450;
  const echelle = Math.max(L / image.width, H / image.height);
  const w = image.width * echelle, h = image.height * echelle;
  const canvas = document.createElement("canvas");
  canvas.width = L;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, L, H);
  ctx.drawImage(image, (L - w) / 2, (H - h) / 2, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/** Photo réduite valable (même contrôle que la base). */
export const photoValable = (p: string) => /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(p) && p.length <= 400000;
