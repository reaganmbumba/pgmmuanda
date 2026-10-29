import "server-only";
import {
  clip, endPath, PDFDocument, popGraphicsState, pushGraphicsState, rectangle, rgb, StandardFonts,
  type PDFFont, type PDFImage, type PDFPage,
} from "pdf-lib";
import QRCode from "qrcode";
import { formatDate, libelleParoisse } from "@/lib/format";
import type { CarteImprimable } from "./depot";
import { lienVerification } from "./lien";
import { LOGO_PNG_BASE64 } from "./logo-png";

// Format carte bancaire ISO 7810 ID-1 : 85,6 × 54 mm.
const MM = 72 / 25.4;
export const LARGEUR = 85.6 * MM;
export const HAUTEUR = 54 * MM;

const MARINE = rgb(0x0b / 255, 0x1f / 255, 0x4b / 255);
const MARINE_CLAIR = rgb(0.78, 0.83, 0.92);
const OR = rgb(0xd4 / 255, 0xa6 / 255, 0x2a / 255);
const OR_CLAIR = rgb(0xf3 / 255, 0xd2 / 255, 0x7a / 255);
const BLANC = rgb(1, 1, 1);
const GRIS = rgb(0.35, 0.39, 0.45);

type Ressources = { normal: PDFFont; gras: PDFFont; logo: PDFImage };

/** Les polices PDF standard ne couvrent que l'alphabet latin : on retire ce qu'elles ne savent pas écrire. */
function texteSur(police: PDFFont, s: string): string {
  return [...s].map((c) => {
    try { police.encodeText(c); return c; } catch {
      const simple = c.normalize("NFD").replace(/[̀-ͯ]/g, "");
      try { police.encodeText(simple); return simple; } catch { return "?"; }
    }
  }).join("");
}

/** Réduit la taille du texte pour qu'il tienne dans la largeur donnée. */
function ecrire(page: PDFPage, texte: string, x: number, y: number, police: PDFFont, taille: number, couleur = BLANC, largeurMax?: number) {
  const t = texteSur(police, texte);
  let s = taille;
  while (largeurMax && s > 4 && police.widthOfTextAtSize(t, s) > largeurMax) s -= 0.25;
  page.drawText(t, { x, y, size: s, font: police, color: couleur });
}

function dessinerQr(page: PDFPage, texte: string, x: number, y: number, cote: number) {
  const qr = QRCode.create(texte, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const marge = 1;
  const m = cote / (n + 2 * marge);
  page.drawRectangle({ x, y, width: cote, height: cote, color: BLANC });
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (qr.modules.get(r, c))
        page.drawRectangle({ x: x + (c + marge) * m, y: y + cote - (r + 1 + marge) * m, width: m + 0.05, height: m + 0.05, color: MARINE });
}

async function photoPdf(doc: PDFDocument, photo: string | null): Promise<PDFImage | null> {
  const m = photo?.match(/^data:image\/(jpeg|png);base64,(.+)$/);
  if (!m) return null;
  const octets = Buffer.from(m[2], "base64");
  try {
    return m[1] === "png" ? await doc.embedPng(octets) : await doc.embedJpg(octets);
  } catch (e) {
    console.error("Photo de carte illisible", e);
    return null; // image illisible : la carte est imprimée avec les initiales
  }
}

/** Recto de la carte, dessiné à partir du coin (x, y). */
async function recto(doc: PDFDocument, page: PDFPage, c: CarteImprimable, r: Ressources, x = 0, y = 0) {
  const W = LARGEUR, H = HAUTEUR;
  page.drawRectangle({ x, y, width: W, height: H, color: MARINE });
  page.drawCircle({ x: x + W - 6, y: y + H - 6, size: 40, borderColor: OR, borderWidth: 5, opacity: 0, borderOpacity: 0.4 });
  page.drawRectangle({ x, y, width: W, height: 3.2, color: OR });

  // En-tête
  page.drawImage(r.logo, { x: x + 9, y: y + H - 29, width: 21, height: 21 });
  ecrire(page, "PGM ANTENNE DE MUANDA", x + 34, y + H - 17, r.gras, 7.2);
  ecrire(page, "EBNM KCC · CARTE DE CHORISTE", x + 34, y + H - 25, r.normal, 4.6, OR_CLAIR);

  // Photo ou initiales
  const px = x + 10, py = y + 12, pw = 50, ph = 64;
  page.drawRectangle({ x: px - 1.5, y: py - 1.5, width: pw + 3, height: ph + 3, color: OR });
  const img = await photoPdf(doc, c.photo);
  if (img) {
    // Recadrage centré au format de la case
    const echelle = Math.max(pw / img.width, ph / img.height);
    const w = img.width * echelle, h = img.height * echelle;
    page.drawRectangle({ x: px, y: py, width: pw, height: ph, color: BLANC });
    page.pushOperators(pushGraphicsState(), rectangle(px, py, pw, ph), clip(), endPath());
    page.drawImage(img, { x: px + (pw - w) / 2, y: py + (ph - h) / 2, width: w, height: h });
    page.pushOperators(popGraphicsState());
  } else {
    page.drawRectangle({ x: px, y: py, width: pw, height: ph, color: rgb(0.86, 0.9, 0.96) });
    const ini = texteSur(r.gras, `${c.prenom[0] ?? ""}${c.nom[0] ?? ""}`.toUpperCase());
    page.drawText(ini, { x: px + pw / 2 - r.gras.widthOfTextAtSize(ini, 16) / 2, y: py + ph / 2 - 6, size: 16, font: r.gras, color: MARINE });
  }

  // Identité
  const tx = px + pw + 8, largeurTexte = W - (tx - x) - 78;
  ecrire(page, `${c.prenom} ${c.nom}`, tx, y + 66, r.gras, 8.5, BLANC, largeurTexte);
  if (c.postnom) ecrire(page, c.postnom, tx, y + 57, r.normal, 6.2, MARINE_CLAIR, largeurTexte);
  ecrire(page, c.matricule, tx, y + 43, r.gras, 8, OR_CLAIR, largeurTexte);
  ecrire(page, c.fonction, tx, y + 27, r.normal, 5.4, MARINE_CLAIR, largeurTexte);
  ecrire(page, libelleParoisse(c.paroisse), tx, y + 20, r.normal, 5.4, MARINE_CLAIR, largeurTexte);
  ecrire(page, `Émise le ${formatDate(c.dateEmission)}`, tx, y + 11, r.normal, 4.6, MARINE_CLAIR, largeurTexte);

  // QR code : uniquement le lien de vérification
  const cote = 68;
  page.drawRectangle({ x: x + W - cote - 12, y: y + 10, width: cote + 4, height: cote + 4, color: BLANC });
  dessinerQr(page, lienVerification(c.reference), x + W - cote - 10, y + 12, cote);
}

function verso(page: PDFPage, c: CarteImprimable, r: Ressources) {
  const W = LARGEUR, H = HAUTEUR;
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: BLANC });
  page.drawRectangle({ x: 0, y: H - 3.2, width: W, height: 3.2, color: OR });
  page.drawRectangle({ x: 0, y: 0, width: W, height: 14, color: MARINE });
  ecrire(page, "Présidence générale de la musique de Muanda", 12, H - 20, r.gras, 6.6, MARINE, W - 24);
  const lignes = [
    "Cette carte est personnelle. Elle atteste que son titulaire",
    "est membre de la PGM Muanda (EBNM-KCC).",
    "Pour vérifier sa validité, scannez le QR code au recto :",
    "la page de vérification indique si la carte est valide.",
    "En cas de perte, prévenez votre responsable de paroisse :",
    "la carte sera révoquée et une nouvelle vous sera remise.",
  ];
  lignes.forEach((l, i) => ecrire(page, l, 12, H - 34 - i * 8.5, r.normal, 5.4, GRIS, W - 24));
  ecrire(page, c.matricule, 12, 4.5, r.gras, 6, OR_CLAIR);
  ecrire(page, "PGM ANTENNE DE MUANDA", W - 12 - r.gras.widthOfTextAtSize("PGM ANTENNE DE MUANDA", 5), 4.5, r.gras, 5, BLANC);
}

async function preparer() {
  const doc = await PDFDocument.create();
  doc.setProducer("PGM ANTENNE DE MUANDA");
  doc.setCreator("PGM ANTENNE DE MUANDA");
  const r: Ressources = {
    normal: await doc.embedFont(StandardFonts.Helvetica),
    gras: await doc.embedFont(StandardFonts.HelveticaBold),
    logo: await doc.embedPng(Buffer.from(LOGO_PNG_BASE64, "base64")),
  };
  return { doc, r };
}

/** Une carte : page 1 recto, page 2 verso, au format exact de la carte. */
export async function pdfCarte(c: CarteImprimable): Promise<Uint8Array> {
  const { doc, r } = await preparer();
  doc.setTitle(`Carte ${c.matricule}`);
  await recto(doc, doc.addPage([LARGEUR, HAUTEUR]), c, r);
  verso(doc.addPage([LARGEUR, HAUTEUR]), c, r);
  return doc.save();
}

/** Planche A4 de 10 cartes (recto) avec traits de coupe, pour l'impression en série. */
export async function pdfPlanche(cartes: CarteImprimable[]): Promise<Uint8Array> {
  const { doc, r } = await preparer();
  doc.setTitle(`Cartes PGM Muanda (${cartes.length})`);
  const A4 = [595.28, 841.89] as const;
  const colonnes = 2, rangees = 5;
  const ecartX = 14, ecartY = 12;
  const x0 = (A4[0] - colonnes * LARGEUR - ecartX) / 2;
  const y0 = (A4[1] - rangees * HAUTEUR - (rangees - 1) * ecartY) / 2;
  for (let i = 0; i < cartes.length; i += colonnes * rangees) {
    const page = doc.addPage([...A4]);
    const lot = cartes.slice(i, i + colonnes * rangees);
    for (const [j, c] of lot.entries()) {
      const col = j % colonnes, rang = Math.floor(j / colonnes);
      const x = x0 + col * (LARGEUR + ecartX);
      const y = A4[1] - y0 - (rang + 1) * HAUTEUR - rang * ecartY;
      await recto(doc, page, c, r, x, y);
      // Traits de coupe aux quatre coins
      for (const [cx, cy] of [[x, y], [x + LARGEUR, y], [x, y + HAUTEUR], [x + LARGEUR, y + HAUTEUR]]) {
        page.drawLine({ start: { x: cx - 5, y: cy }, end: { x: cx + 5, y: cy }, thickness: 0.3, color: GRIS });
        page.drawLine({ start: { x: cx, y: cy - 5 }, end: { x: cx, y: cy + 5 }, thickness: 0.3, color: GRIS });
      }
    }
    ecrire(page, `PGM ANTENNE DE MUANDA · planche ${i / (colonnes * rangees) + 1} · ${lot.length} carte(s)`, x0, 18, r.normal, 7, GRIS);
  }
  return doc.save();
}
