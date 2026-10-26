import { describe, expect, it } from "vitest";
import { accueilPourRole, cheminSur, peutOuvrir, rolesAttribuables } from "@/lib/auth/roles";

describe("accès par rôle", () => {
  it("envoie le staff vers /staff et le choriste vers /choriste", () => {
    expect(accueilPourRole("presidence")).toBe("/staff");
    expect(accueilPourRole("choriste")).toBe("/choriste");
    expect(accueilPourRole("controleur")).toBe("/staff/scanner");
  });

  it("interdit l'espace staff au choriste et l'espace choriste au staff", () => {
    expect(peutOuvrir("choriste", "/staff")).toBe(false);
    expect(peutOuvrir("choriste", "/choriste/carte")).toBe(true);
    expect(peutOuvrir("presidence", "/choriste")).toBe(false);
  });

  it("limite le contrôleur au scanner", () => {
    expect(peutOuvrir("controleur", "/staff/scanner")).toBe(true);
    expect(peutOuvrir("controleur", "/staff")).toBe(false);
    expect(peutOuvrir("controleur", "/staff/membres")).toBe(false);
  });

  it("réserve la gestion des utilisateurs à l'administration", () => {
    expect(peutOuvrir("super_admin", "/staff/utilisateurs")).toBe(true);
    expect(peutOuvrir("presidence", "/staff/utilisateurs")).toBe(true);
    expect(peutOuvrir("responsable_paroisse", "/staff/utilisateurs")).toBe(false);
  });

  it("empêche la présidence de créer un super administrateur", () => {
    expect(rolesAttribuables("presidence")).not.toContain("super_admin");
    expect(rolesAttribuables("super_admin")).toContain("super_admin");
    expect(rolesAttribuables("responsable_paroisse")).toEqual([]);
  });

  it("refuse les redirections vers un autre site", () => {
    expect(cheminSur("/staff/membres")).toBe("/staff/membres");
    expect(cheminSur("https://pirate.example")).toBe("/");
    expect(cheminSur("//pirate.example")).toBe("/");
    expect(cheminSur("/\\pirate.example")).toBe("/");
    expect(cheminSur(null, "/choriste")).toBe("/choriste");
  });
});
