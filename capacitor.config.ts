import type { CapacitorConfig } from "@capacitor/cli";

// Application mobile (Android et iOS) : elle embarque la version HTML
// générée par `npm run export:html` dans le dossier export-html/.
const config: CapacitorConfig = {
  appId: "org.ebnmkcc.pgmmuanda",
  appName: "PGM Muanda",
  webDir: "export-html",
  backgroundColor: "#0b1f4b",
  android: { allowMixedContent: false },
};

export default config;
