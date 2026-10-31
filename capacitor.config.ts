import type { CapacitorConfig } from "@capacitor/cli";

// Application mobile (Android et iOS) : elle ouvre le site en ligne
// www.pgmmuanda.com. Le dossier app-mobile/ ne sert qu'à afficher une page
// d'attente quand le téléphone n'a pas Internet.
const config: CapacitorConfig = {
  appId: "org.ebnmkcc.pgmmuanda",
  appName: "PGM Muanda",
  webDir: "app-mobile",
  backgroundColor: "#0b1f4b",
  server: {
    url: "https://www.pgmmuanda.com",
    allowNavigation: ["www.pgmmuanda.com", "pgmmuanda.com"],
    errorPath: "hors-ligne.html",
  },
  android: { allowMixedContent: false },
};

export default config;
