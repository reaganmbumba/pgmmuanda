import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import jsQR from "jsqr";
import { extraireReference, lienVerification } from "@/lib/cartes/lien";
import { HAUTEUR, LARGEUR, pdfCarte, pdfPlanche } from "@/lib/cartes/pdf";
import type { CarteImprimable } from "@/lib/cartes/depot";

const carte: CarteImprimable = {
  reference: "Xk3Dm7Qw9Zr4TyAb1Cd2Ef",
  dateEmission: "2026-10-26T10:00:00Z",
  prenom: "Grâce",
  nom: "Mavungu",
  postnom: "Nsimba",
  matricule: "PGM-MUA-0001",
  fonction: "Choriste",
  paroisse: "Muanda-Centre",
  photo: null,
};

describe("lien du QR code", () => {
  it("ne contient que l'adresse de vérification et la référence", () => {
    const lien = lienVerification(carte.reference);
    expect(lien).toMatch(/\/verifier\/Xk3Dm7Qw9Zr4TyAb1Cd2Ef$/);
    expect(lien).not.toContain("PGM-MUA");
    expect(lien).not.toContain("Mavungu");
  });

  it("reconnaît une carte scannée et rejette le reste", () => {
    expect(extraireReference("https://pgm-muanda.org/verifier/Xk3Dm7Qw9Zr4TyAb1Cd2Ef")).toBe(carte.reference);
    expect(extraireReference("http://localhost:3000/verifier/Xk3Dm7Qw9Zr4TyAb1Cd2Ef?x=1")).toBe(carte.reference);
    expect(extraireReference("  Xk3Dm7Qw9Zr4TyAb1Cd2Ef ")).toBe(carte.reference);
    expect(extraireReference("https://exemple.org/autre")).toBeNull();
    expect(extraireReference("<script>")).toBeNull();
    expect(extraireReference("WIFI:S:reseau;T:WPA;P:secret;;")).toBeNull();
  });
});

describe("carte PDF", () => {
  it("produit un recto et un verso au format carte bancaire", async () => {
    const octets = await pdfCarte(carte);
    const doc = await PDFDocument.load(octets);
    expect(doc.getPageCount()).toBe(2);
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBeCloseTo(LARGEUR, 1);
    expect(height).toBeCloseTo(HAUTEUR, 1);
    expect(doc.getTitle()).toBe("Carte PGM-MUA-0001");
    if (process.env.APERCU_PDF) fs.writeFileSync(process.env.APERCU_PDF, octets);
  });

  it("accepte une photo JPEG et ignore une image illisible", async () => {
    const jpeg = fs.readFileSync("tests/e2e/photo-test.jpg").toString("base64");
    await expect(pdfCarte({ ...carte, photo: `data:image/jpeg;base64,${jpeg}` })).resolves.toBeInstanceOf(Uint8Array);
    await expect(pdfCarte({ ...carte, photo: "data:image/jpeg;base64,AAAA" })).resolves.toBeInstanceOf(Uint8Array);
  });

  it("répartit les cartes par planches A4 de 10", async () => {
    const doc = await PDFDocument.load(await pdfPlanche(Array.from({ length: 23 }, (_, i) => ({ ...carte, matricule: `PGM-MUA-${String(i + 1).padStart(4, "0")}` }))));
    expect(doc.getPageCount()).toBe(3);
  });
});

describe("décodage d'un QR", () => {
  it("jsQR lit un QR généré par la bibliothèque des cartes", async () => {
    const QRCode = (await import("qrcode")).default;
    const qr = QRCode.create(lienVerification(carte.reference), { errorCorrectionLevel: "M" });
    const n = qr.modules.size, e = 8, cote = (n + 8) * e;
    const pixels = new Uint8ClampedArray(cote * cote * 4).fill(255);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.modules.get(r, c))
      for (let y = 0; y < e; y++) for (let x = 0; x < e; x++) {
        const i = (((r + 4) * e + y) * cote + (c + 4) * e + x) * 4;
        pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
      }
    expect(extraireReference(jsQR(pixels, cote, cote)!.data)).toBe(carte.reference);
  });
});
