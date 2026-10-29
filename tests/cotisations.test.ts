import { describe, expect, it } from "vitest";
import { decaler, libelleMois, lienWhatsAppVers, lireMois, messageRappel, moisCourant } from "@/lib/cotisations/mois";
import { peutOuvrir } from "@/lib/auth/roles";

describe("cotisations", () => {
  it("calcule les mois", () => {
    expect(decaler("2026-01-01", -1)).toBe("2025-12-01");
    expect(decaler("2026-12-01", 1)).toBe("2027-01-01");
    expect(libelleMois("2026-08-01")).toBe("août 2026");
    expect(lireMois("2026-10")).toBe("2026-10-01");
    expect(lireMois("2026-13")).toBeNull();
    expect(lireMois("x")).toBeNull();
    // 31 octobre 23 h 30 à Muanda (UTC+1) = 22 h 30 UTC : encore octobre
    expect(moisCourant(new Date("2026-10-31T22:30:00Z"))).toBe("2026-10-01");
    expect(moisCourant(new Date("2026-10-31T23:30:00Z"))).toBe("2026-11-01");
  });

  it("prépare le rappel du règlement pour WhatsApp", () => {
    const m = messageRappel("Daniel", "2026-10-01");
    expect(m).toContain("octobre 2026");
    expect(m).toContain("Art. 27");
    expect(lienWhatsAppVers("081 234 5678", "x")).toBe("https://wa.me/243812345678?text=x");
    expect(lienWhatsAppVers("+243 81 234 5678", "x")).toBe("https://wa.me/243812345678?text=x");
    expect(lienWhatsAppVers(null, "a b")).toBe("https://wa.me/?text=a%20b");
  });

  it("réserve la page aux personnes qui suivent les finances", () => {
    expect(peutOuvrir("presidence", "/staff/cotisations")).toBe(true);
    expect(peutOuvrir("responsable_paroisse", "/staff/cotisations")).toBe(false);
    expect(peutOuvrir("responsable_paroisse", "/staff/cotisations", true)).toBe(true);
    expect(peutOuvrir("responsable_commission", "/staff/cotisations")).toBe(false);
    expect(peutOuvrir("choriste", "/choriste/cotisations")).toBe(true);
  });
});
