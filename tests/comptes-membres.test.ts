import { describe, expect, it } from "vitest";
import { baseIdentifiant, cleNom, motDePasseMembre, problemeMotDePasse } from "@/lib/auth/comptes";

describe("comptes des membres", () => {
  it("identifiant prénom.nom sans accents", () => {
    expect(baseIdentifiant("Grâce", "MAVUNGU")).toBe("grace.mavungu");
    expect(baseIdentifiant("Jean-Paul", "Di Zolele")).toBe("jeanpaul.dizolele");
  });
  it("reconnaît le même nom dans un autre ordre ou une autre casse", () => {
    expect(cleNom("REAGAN", "MBUMBA")).toBe(cleNom("Reagan MBUMBA"));
    expect(cleNom("Joel", "NKASA", "LUSALA")).toBe(cleNom("Nkasa Lusala Joel"));
    expect(cleNom("Gérard", "Toko")).toBe(cleNom("Gerard toko"));
    expect(cleNom("Isaac", "Dizolele")).not.toBe(cleNom("Dizolele Isaac Jr"));
  });
  it("mot de passe accepté par les règles, même sans lettre dans le nom", () => {
    expect(motDePasseMembre("TOKO")).toBe("Toko123456");
    expect(problemeMotDePasse(motDePasseMembre("123"))).toBeNull();
  });
});
