import { describe, expect, it } from "vitest";
import { schemaConnexion, schemaEmail, schemaNouveauMotDePasse } from "@/lib/validation/auth";
import { schemaInvitation, schemaModification } from "@/lib/validation/utilisateurs";

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
  const base = { email: "resp@exemple.cd", nom: "Ruth Makiadi", identifiant: "", role: "choriste", paroisseId: "", commissionId: "" };

  it("accepte une invitation simple", () => {
    const r = schemaInvitation.parse(base);
    expect(r.identifiant).toBeNull();
    expect(r.paroisseId).toBeNull();
  });

  it("exige la paroisse d'un responsable de paroisse", () => {
    expect(schemaInvitation.safeParse({ ...base, role: "responsable_paroisse" }).success).toBe(false);
    expect(schemaInvitation.safeParse({ ...base, role: "responsable_paroisse", paroisseId: UUID }).success).toBe(true);
  });

  it("exige la commission d'un responsable de commission", () => {
    expect(schemaInvitation.safeParse({ ...base, role: "responsable_commission" }).success).toBe(false);
  });

  it("refuse un rôle inconnu et un identifiant invalide", () => {
    expect(schemaInvitation.safeParse({ ...base, role: "pirate" }).success).toBe(false);
    expect(schemaInvitation.safeParse({ ...base, identifiant: "Nom Avec Espaces" }).success).toBe(false);
  });

  it("convertit le statut actif", () => {
    const r = schemaModification.parse({ id: UUID, role: "controleur", paroisseId: "", commissionId: "", actif: "non" });
    expect(r.actif).toBe(false);
  });
});
