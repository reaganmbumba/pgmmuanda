import { describe, expect, it } from "vitest";
import { motDePasseDuNom, problemeMotDePasse } from "@/lib/auth/comptes";

describe("motDePasseDuNom", () => {
  it("donne le nom + 123456", () => {
    expect(motDePasseDuNom("DIZOLELE")).toBe("Dizolele123456");
    expect(motDePasseDuNom("  mbumba ")).toBe("Mbumba123456");
  });
  it("enlève accents, espaces et tirets", () => {
    expect(motDePasseDuNom("Mbélé-Ntedi ka")).toBe("Mbelentedika123456");
  });
  it("complète les chiffres pour un nom court", () => {
    expect(motDePasseDuNom("Ba")).toBe("Ba12345678");
  });
  it("respecte toujours les règles du mot de passe", () => {
    for (const n of ["Ba", "Lo", "Kumuena", "NTEDIKA"]) expect(problemeMotDePasse(motDePasseDuNom(n))).toBeNull();
  });
  it("vide si pas de lettre", () => {
    expect(motDePasseDuNom("  ")).toBe("");
  });
});
