import { describe, expect, it } from "vitest";
import { idVideo } from "@/lib/site/video";
import { schemaReglagesSite } from "@/lib/site/schema";

describe("lien du direct YouTube", () => {
  it.each([
    "https://www.youtube.com/live/VS1umwf42II?si=4PnHLXw3tpbCzHTl",
    "https://youtube.com/live/VS1umwf42II",
    "https://www.youtube.com/watch?v=VS1umwf42II",
    "https://m.youtube.com/watch?feature=share&v=VS1umwf42II",
    "https://youtu.be/VS1umwf42II?si=abc",
    "https://www.youtube.com/shorts/VS1umwf42II",
    "https://www.youtube-nocookie.com/embed/VS1umwf42II",
    "  VS1umwf42II  ",
  ])("lit l'identifiant dans %s", (lien) => {
    expect(idVideo(lien)).toBe("VS1umwf42II");
  });

  it.each(["", "https://www.youtube.com/@pgmmuanda", "https://example.com/live/VS1umwf42II", "VS1umwf42IIX"])("refuse %s", (lien) => {
    expect(idVideo(lien)).toBeNull();
  });

  const base = {
    accueil_titre: "Titre", accueil_texte: "Texte", telephone: "+243 825 717 444", whatsapp_message: "",
    youtube_chaine: "pgmmuanda", causerie_ouverte: "oui", youtube_id: "",
  };

  it("garde seulement l'identifiant dans les réglages, et accepte une case vide", () => {
    expect(schemaReglagesSite.parse({ ...base, youtube_direct: "https://www.youtube.com/live/VS1umwf42II?si=x" }).youtube_direct).toBe("VS1umwf42II");
    expect(schemaReglagesSite.parse({ ...base, youtube_direct: "" }).youtube_direct).toBe("");
    expect(schemaReglagesSite.safeParse({ ...base, youtube_direct: "pas un lien" }).success).toBe(false);
  });
});
