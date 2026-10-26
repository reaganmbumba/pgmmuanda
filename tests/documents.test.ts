import { describe, expect, it } from "vitest";
import { detecterType, formatTaille, lireFichier, nomFichierSur, TAILLE_MAX } from "@/lib/documents/fichiers";

const octets = (...b: number[]) => new Uint8Array([...b, 0, 0, 0, 0, 0, 0, 0, 0]);

describe("fichiers déposés", () => {
  it("reconnaît le vrai type d'après le contenu", () => {
    expect(detecterType(new TextEncoder().encode("%PDF-1.7 ..."))).toBe("application/pdf");
    expect(detecterType(octets(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detecterType(octets(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(detecterType(new TextEncoder().encode("ID3\u0004"))).toBe("audio/mpeg");
    expect(detecterType(new TextEncoder().encode("MZ\u0090"))).toBeNull(); // programme Windows
    expect(detecterType(new TextEncoder().encode("<html><script>"))).toBeNull();
  });

  it("nettoie le nom du fichier et impose la bonne extension", () => {
    expect(nomFichierSur("C:\\Users\\Reagan\\Partition Noël (v2).PDF", "application/pdf")).toBe("Partition-Noel-v2.pdf");
    expect(nomFichierSur("../../etc/passwd", "image/png")).toBe("passwd.png");
    expect(nomFichierSur("photo.exe", "image/jpeg")).toBe("photo.jpg");
    expect(nomFichierSur("!!!", "application/pdf")).toBe("fichier.pdf");
  });

  it("affiche la taille simplement", () => {
    expect(formatTaille(350 * 1024)).toBe("350 Ko");
    expect(formatTaille(1.25 * 1024 * 1024)).toBe("1,3 Mo");
  });

  it("refuse un fichier trop lourd, vide ou d'un format non accepté", async () => {
    expect(await lireFichier(null)).toBe("Choisissez un fichier.");
    expect(await lireFichier(new File([], "vide.pdf"))).toBe("Choisissez un fichier.");
    expect(await lireFichier(new File([new Uint8Array(TAILLE_MAX + 1)], "gros.pdf"))).toMatch(/trop lourd/);
    expect(await lireFichier(new File(["<script>alert(1)</script>"], "faux.pdf"))).toMatch(/Format non accepté/);
    const ok = await lireFichier(new File(["%PDF-1.4 test"], "Règlement.pdf"));
    expect(ok).toEqual({ type: "application/pdf", nom: "Reglement.pdf", taille: 13, base64: Buffer.from("%PDF-1.4 test").toString("base64") });
  });
});
