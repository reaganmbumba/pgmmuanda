import { describe, expect, it } from "vitest";
import { schemaConnexion, schemaEmail, schemaNouveauMotDePasse } from "@/lib/validation/auth";
import { schemaNouveauCompte, schemaModification } from "@/lib/validation/utilisateurs";

const UUID = "10000000-0000-4000-8000-00000000000a";

describe("formulaires d'authentification", () => {
  it("exige identifiant et mot de passe", () => {
    expect(schemaConnexion.safeParse({ identifiant: "ab", motDePasse: "x" }).success).toBe(false);
    expect(schemaConnexion.safeParse({ identifiant: "admin.pgm", motDePasse: "x" }).success).toBe(true);
  });

  it("normalise l'adresse e-mail", () => {
    expect(schemaEmail.parse({ email: "  Daniel@Exemple.CD " }).email).toBe("daniel@exemple.cd");
    expect(schemaEmail.safeParse({ email: "pas-un-email" }).success).toBe(false);
  });

  it("impose un mot de passe solide et confirmé", () => {
    const essai = (motDePasse: string, confirmation = motDePasse) =>
      schemaNouveauMotDePasse.safeParse({ motDePasse, confirmation });
    expect(essai("court1").success).toBe(false);
    expect(essai("seulementdeslettres").success).toBe(false);
    expect(essai("1234567890").success).toBe(false);
    expect(essai("Chorale2026!", "Chorale2026?").success).toBe(false);
    expect(essai("Chorale2026!").success).toBe(true);
  });
});

describe("gestion des utilisateurs", () => {
  const base = { email: "", nom: "Ruth Makiadi", identifiant: "ruth.makiadi", role: "choriste", paroisseId: "", commissionId: "" };

  it("crée un compte sans e-mail, avec un identifiant", () => {
    const r = schemaNouveauCompte.parse(base);
    expect(r.email).toBeNull();
    expect(r.identifiant).toBe("ruth.makiadi");
    expect(r.paroisseId).toBeNull();
    expect(schemaNouveauCompte.parse({ ...base, email: " Resp@Exemple.cd " }).email).toBe("resp@exemple.cd");
  });

  it("exige un identifiant et refuse un e-mail invalide", () => {
    const sans = schemaNouveauCompte.safeParse({ ...base, identifiant: "" });
    expect(sans.success).toBe(false);
    expect(sans.error?.issues[0].message).toContain("identifiant");
    expect(schemaNouveauCompte.safeParse({ ...base, email: "pas-un-email" }).success).toBe(false);
  });

  it("exige la paroisse d'un responsable de paroisse", () => {
    expect(schemaNouveauCompte.safeParse({ ...base, role: "responsable_paroisse" }).success).toBe(false);
    expect(schemaNouveauCompte.safeParse({ ...base, role: "responsable_paroisse", paroisseId: UUID }).success).toBe(true);
  });

  it("exige la commission d'un responsable de commission", () => {
    expect(schemaNouveauCompte.safeParse({ ...base, role: "responsable_commission" }).success).toBe(false);
  });

  it("refuse un rôle inconnu et un identifiant invalide", () => {
    expect(schemaNouveauCompte.safeParse({ ...base, role: "pirate" }).success).toBe(false);
    expect(schemaNouveauCompte.safeParse({ ...base, identifiant: "Nom Avec Espaces" }).success).toBe(false);
  });

  it("convertit le statut actif", () => {
    const r = schemaModification.parse({ id: UUID, role: "controleur", paroisseId: "", commissionId: "", actif: "non" });
    expect(r.actif).toBe(false);
  });
});
