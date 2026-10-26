import { describe, expect, it } from "vitest";
import { peutGererMembres } from "@/lib/auth/roles";
import { schemaDemandeCorrection, schemaMembre, versLigne } from "@/lib/validation/membres";

const base = {
  id: "",
  nom: " Mavungu ",
  postnom: "",
  prenom: "Grace",
  sexe: "F",
  telephone: "+243 81 111 1111",
  email: "",
  paroisseId: "6f1c2a52-5b0f-4c55-9f3e-6a1d2b3c4d5e",
  choraleId: "",
  voix: "soprano",
  fonction: "Choriste",
  dateAdhesion: "2024-05-01",
  statut: "en_attente",
};

describe("fiche membre", () => {
  it("accepte une fiche complète et nettoie les champs vides", () => {
    const d = schemaMembre.parse(base);
    expect(d.nom).toBe("Mavungu");
    expect(d.id).toBeNull();
    expect(d.email).toBeNull();
    expect(d.choraleId).toBeNull();
    expect(versLigne(d)).toMatchObject({ nom: "Mavungu", paroisse_id: base.paroisseId, voix: "soprano", chorale_id: null });
  });

  it("n'envoie jamais de matricule : il est attribué par la base", () => {
    const d = schemaMembre.parse({ ...base, matricule: "PGM-MUA-0001" });
    expect(Object.keys(versLigne(d))).not.toContain("matricule");
  });

  it("refuse les données invalides avec un message en français", () => {
    const erreur = (champs: object) => schemaMembre.safeParse({ ...base, ...champs }).error?.issues[0].message;
    expect(erreur({ nom: "  " })).toBe("Indiquez le nom.");
    expect(erreur({ telephone: "abc" })).toMatch(/Téléphone/);
    expect(erreur({ email: "pas-un-email" })).toBe("Adresse e-mail invalide.");
    expect(erreur({ paroisseId: "" })).toBe("Choisissez la paroisse.");
    expect(erreur({ voix: "baryton" })).toBe("Voix invalide.");
    expect(erreur({ statut: "supprime" })).toBe("Statut invalide.");
  });
});

describe("demande de correction", () => {
  it("vérifie la valeur selon l'information corrigée", () => {
    expect(schemaDemandeCorrection.safeParse({ champ: "telephone", valeur: "+243 99 222 3333", motif: "" }).success).toBe(true);
    expect(schemaDemandeCorrection.safeParse({ champ: "telephone", valeur: "appelez-moi", motif: "" }).success).toBe(false);
    expect(schemaDemandeCorrection.safeParse({ champ: "voix", valeur: "alto", motif: "" }).success).toBe(true);
    expect(schemaDemandeCorrection.safeParse({ champ: "voix", valeur: "Alto chantée", motif: "" }).success).toBe(false);
    expect(schemaDemandeCorrection.safeParse({ champ: "matricule", valeur: "PGM-MUA-0001", motif: "" }).success).toBe(false);
  });
});

describe("droits sur les membres", () => {
  it("réserve l'inscription à l'administration et aux responsables de paroisse", () => {
    expect(peutGererMembres("super_admin")).toBe(true);
    expect(peutGererMembres("presidence")).toBe(true);
    expect(peutGererMembres("responsable_paroisse")).toBe(true);
    expect(peutGererMembres("responsable_commission")).toBe(false);
    expect(peutGererMembres("controleur")).toBe(false);
    expect(peutGererMembres("choriste")).toBe(false);
  });
});
