import fs from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { pdfCarte } = await import("@/lib/cartes/pdf");

const carte = {
  reference: "ref-test-0123456789", dateEmission: "2026-10-29T08:00:00Z", prenom: "Ruth", nom: "Mbala", postnom: "",
  matricule: "PGM-MUA-0005", fonction: "Choriste", paroisse: "Paroisse Atlantique",
};

describe("carte PDF", () => {
  it("contient la photo du membre", async () => {
    const photo = `data:image/jpeg;base64,${fs.readFileSync("tests/e2e/photo-test.jpg").toString("base64")}`;
    const avec = await pdfCarte({ ...carte, photo });
    const sans = await pdfCarte({ ...carte, photo: null });
    if (process.env.PDF_SORTIE) fs.writeFileSync(process.env.PDF_SORTIE, avec);
    const images = (pdf: Uint8Array) => (Buffer.from(pdf).toString("latin1").match(/\/Subtype \/Image/g) ?? []).length;
    expect(images(avec)).toBe(images(sans) + 1);
  });
});
