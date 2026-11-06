import "server-only";
import {
  clip, endPath, PDFDocument, popGraphicsState, pushGraphicsState, rectangle, rgb, StandardFonts,
  type PDFFont, type PDFImage, type PDFPage, type RGB,
} from "pdf-lib";
import QRCode from "qrcode";
import { formatDate, libelleParoisse } from "@/lib/format";
import type { CarteImprimable } from "./depot";
import { lienVerification } from "./lien";
import { LOGO_KCC_PNG_BASE64, LOGO_PNG_BASE64 } from "./logo-png";

// Format carte bancaire ISO 7810 ID-1 : 85,6 × 54 mm.
const MM = 72 / 25.4;
export const LARGEUR = 85.6 * MM;
export const HAUTEUR = 54 * MM;

const MARINE = rgb(0x0b / 255, 0x1f / 255, 0x4b / 255);
const MARINE_FONCE = rgb(0x06 / 255, 0x12 / 255, 0x2e / 255);
const MARINE_CLAIR = rgb(0.78, 0.83, 0.92);
const OR = rgb(0xd4 / 255, 0xa6 / 255, 0x2a / 255);
const OR_CLAIR = rgb(0xf3 / 255, 0xd2 / 255, 0x7a / 255);
const CREME = rgb(0xfb / 255, 0xf8 / 255, 0xf0 / 255);
const BLANC = rgb(1, 1, 1);
const GRIS = rgb(0.35, 0.39, 0.45);
const SITE = "www.pgmmuanda.com";
const PRESIDENT_ANTENNE = "Joel NKASA Lusala";

type Ressources = { normal: PDFFont; gras: PDFFont; logo: PDFImage; kcc: PDFImage };

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

/** Texte centré sur l'abscisse cx. */
function centrer(page: PDFPage, texte: string, cx: number, y: number, police: PDFFont, taille: number, couleur = BLANC) {
  const t = texteSur(police, texte);
  page.drawText(t, { x: cx - police.widthOfTextAtSize(t, taille) / 2, y, size: taille, font: police, color: couleur });
}

/** Coupe un texte en lignes qui tiennent dans la largeur donnée. */
function couper(police: PDFFont, texte: string, taille: number, largeur: number): string[] {
  const lignes: string[] = [];
  let ligne = "";
  for (const mot of texteSur(police, texte).split(" ")) {
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (ligne && police.widthOfTextAtSize(essai, taille) > largeur) { lignes.push(ligne); ligne = mot; } else ligne = essai;
  }
  if (ligne) lignes.push(ligne);
  return lignes;
}

/** Rectangle aux coins arrondis ; (x, y) est le coin inférieur gauche. */
function arrondi(page: PDFPage, x: number, y: number, w: number, h: number, r: number, options: { color?: RGB; borderColor?: RGB; borderWidth?: number; opacity?: number; borderOpacity?: number }) {
  const chemin = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  page.drawSvgPath(chemin, { x, y: y + h, ...options });
}

/** Fond en dégradé vertical (bandes fines, compatibles avec toutes les imprimantes). */
function degrade(page: PDFPage, x: number, y: number, w: number, h: number, haut: RGB, bas: RGB) {
  const n = 48;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const c = rgb(bas.red + (haut.red - bas.red) * t, bas.green + (haut.green - bas.green) * t, bas.blue + (haut.blue - bas.blue) * t);
    page.drawRectangle({ x, y: y + (i * h) / n, width: w, height: h / n + 0.2, color: c });
  }
}

/** Portée musicale en vagues : le motif décoratif de la PGM. */
function portee(page: PDFPage, x: number, y: number, w: number, opacite: number) {
  const chemin = [0, 1, 2, 3, 4].map((i) => {
    const d = i * 2.4;
    return `M 0 ${d} C ${w * 0.25} ${d - 14} ${w * 0.45} ${d + 14} ${w * 0.7} ${d} S ${w * 0.95} ${d - 8} ${w} ${d}`;
  }).join(" ");
  page.drawSvgPath(chemin, { x, y, borderColor: OR, borderWidth: 0.35, borderOpacity: opacite });
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

/** Petit titre doré au-dessus d'une information (MATRICULE, PAROISSE…). */
function champ(page: PDFPage, r: Ressources, libelle: string, valeur: string, x: number, y: number, largeur: number, taille = 6, couleur = BLANC) {
  ecrire(page, libelle, x, y + 7.2, r.gras, 3.6, OR);
  ecrire(page, valeur, x, y, r.gras, taille, couleur, largeur);
}

/** Recto de la carte, dessiné à partir du coin (x, y). */
async function recto(doc: PDFDocument, page: PDFPage, c: CarteImprimable, r: Ressources, x = 0, y = 0) {
  const W = LARGEUR, H = HAUTEUR;

  // Fond : dégradé marine, filigrane du logo et portée musicale
  degrade(page, x, y, W, H, MARINE, MARINE_FONCE);
  page.drawImage(r.logo, { x: x + W * 0.36, y: y + 6, width: 104, height: 104, opacity: 0.05 });
  portee(page, x, y + H - 44, W, 0.22);

  // En-tête : logo PGM, nom de l'antenne, logo KCC
  page.drawImage(r.logo, { x: x + 9, y: y + H - 31, width: 24, height: 24 });
  ecrire(page, "PGM ANTENNE DE MUANDA", x + 38, y + H - 17.5, r.gras, 8, BLANC, W - 80);
  ecrire(page, "PRÉSIDENCE GÉNÉRALE DE LA MUSIQUE · EBNM KCC", x + 38, y + H - 25.5, r.normal, 4.1, OR_CLAIR, W - 80);
  page.drawImage(r.kcc, { x: x + W - 30, y: y + H - 29, width: 20, height: 20 });
  page.drawLine({ start: { x: x + 9, y: y + H - 36 }, end: { x: x + W - 9, y: y + H - 36 }, thickness: 0.6, color: OR, opacity: 0.8 });

  // Bandeau « CARTE DE MEMBRE »
  const bandeau = "CARTE DE MEMBRE";
  const lb = r.gras.widthOfTextAtSize(bandeau, 4.8) + 12;
  arrondi(page, x + 9, y + H - 50, lb, 9, 4.5, { color: OR });
  ecrire(page, bandeau, x + 15, y + H - 47.2, r.gras, 4.8, MARINE_FONCE);

  // Photo ou initiales, dans un cadre doré
  const px = x + 10, py = y + 20, pw = 54, ph = 70;
  arrondi(page, px - 2, py - 2, pw + 4, ph + 4, 3, { color: OR });
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
    page.drawText(ini, { x: px + pw / 2 - r.gras.widthOfTextAtSize(ini, 18) / 2, y: py + ph / 2 - 6.5, size: 18, font: r.gras, color: MARINE });
  }

  // Identité
  const cote = 56, qx = x + W - cote - 13;
  const tx = px + pw + 9, largeur = qx - tx - 8, demi = largeur / 2 - 2;
  ecrire(page, `${c.prenom} ${c.nom.toUpperCase()}`, tx, y + 82, r.gras, 8.6, BLANC, largeur);
  if (c.postnom) ecrire(page, c.postnom.toUpperCase(), tx, y + 74.5, r.normal, 5.4, MARINE_CLAIR, largeur);
  champ(page, r, "MATRICULE", c.matricule, tx, y + 56, largeur, 7.4, OR_CLAIR);
  champ(page, r, "FONCTION", c.fonction, tx, y + 39, demi);
  champ(page, r, "ÉMISE LE", formatDate(c.dateEmission), tx + demi + 4, y + 39, demi);
  champ(page, r, "PAROISSE", libelleParoisse(c.paroisse), tx, y + 22, largeur);

  // QR code (uniquement le lien de vérification) dans un cadre blanc arrondi
  arrondi(page, qx - 3, y + 25, cote + 6, cote + 6, 3.5, { color: BLANC, borderColor: OR, borderWidth: 0.8 });
  dessinerQr(page, lienVerification(c.reference), qx, y + 28, cote);
  centrer(page, "SCANNER POUR VÉRIFIER", qx + cote / 2, y + 18.5, r.gras, 3.6, OR_CLAIR);

  // Pied : bande dorée et adresse du site
  page.drawRectangle({ x, y, width: W, height: 11, color: MARINE_FONCE });
  page.drawRectangle({ x, y: y + 11, width: W, height: 1.2, color: OR });
  ecrire(page, "Membre de la Présidence générale de la Musique Antenne de Muanda", x + 10, y + 4, r.normal, 3.9, MARINE_CLAIR);
  const ls = r.gras.widthOfTextAtSize(SITE, 4.2);
  ecrire(page, SITE, x + W - 10 - ls, y + 4, r.gras, 4.2, OR_CLAIR);
}

function verso(page: PDFPage, c: CarteImprimable, r: Ressources) {
  const W = LARGEUR, H = HAUTEUR;
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CREME });
  page.drawImage(r.logo, { x: W / 2 - 50, y: H / 2 - 56, width: 100, height: 100, opacity: 0.06 });

  // En-tête marine
  degrade(page, 0, H - 28, W, 28, MARINE, MARINE_FONCE);
  page.drawRectangle({ x: 0, y: H - 29.2, width: W, height: 1.2, color: OR });
  page.drawImage(r.logo, { x: 10, y: H - 24.5, width: 20, height: 20 });
  page.drawImage(r.kcc, { x: W - 28, y: H - 23, width: 17, height: 17 });
  centrer(page, "PRÉSIDENCE GÉNÉRALE DE LA MUSIQUE", W / 2, H - 13.5, r.gras, 6.4);
  centrer(page, "ANTENNE DE MUANDA · EBNM KCC", W / 2, H - 21, r.normal, 4.4, OR_CLAIR);

  // Informations
  const points = [
    "Cette carte est personnelle. Elle atteste que son titulaire est membre de la PGM Muanda (EBNM-KCC).",
    "Pour vérifier sa validité, scannez le QR code au recto : la page de vérification indique si la carte est valide.",
    "En cas de perte, prévenez votre responsable de paroisse : la carte sera révoquée et une nouvelle vous sera remise.",
  ];
  let ly = H - 42;
  for (const p of points) {
    page.drawRectangle({ x: 13, y: ly + 1.2, width: 2.4, height: 2.4, color: OR });
    for (const l of couper(r.normal, p, 5.1, W - 34)) {
      page.drawText(l, { x: 20, y: ly, size: 5.1, font: r.normal, color: GRIS });
      ly -= 7;
    }
    ly -= 2.5;
  }

  // Nom du président de l'antenne (à la place d'une signature)
  centrer(page, PRESIDENT_ANTENNE, W - 52.5, 25.5, r.gras, 6, MARINE);
  centrer(page, "Président de l'antenne", W - 52.5, 19.5, r.normal, 4.4, GRIS);
  ecrire(page, "Carte trouvée ? Merci de la remettre", 13, 26, r.normal, 4.2, GRIS);
  ecrire(page, "à la PGM Muanda.", 13, 20.5, r.normal, 4.2, GRIS);

  // Pied
  page.drawRectangle({ x: 0, y: 11, width: W, height: 1.2, color: OR });
  page.drawRectangle({ x: 0, y: 0, width: W, height: 11, color: MARINE_FONCE });
  ecrire(page, c.matricule, 12, 3.8, r.gras, 5.4, OR_CLAIR);
  const ls = r.gras.widthOfTextAtSize(SITE, 4.6);
  ecrire(page, SITE, W - 12 - ls, 3.8, r.gras, 4.6, BLANC);
}

async function preparer() {
  const doc = await PDFDocument.create();
  doc.setProducer("PGM ANTENNE DE MUANDA");
  doc.setCreator("PGM ANTENNE DE MUANDA");
  const r: Ressources = {
    normal: await doc.embedFont(StandardFonts.Helvetica),
    gras: await doc.embedFont(StandardFonts.HelveticaBold),
    logo: await doc.embedPng(Buffer.from(LOGO_PNG_BASE64, "base64")),
    kcc: await doc.embedPng(Buffer.from(LOGO_KCC_PNG_BASE64, "base64")),
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
