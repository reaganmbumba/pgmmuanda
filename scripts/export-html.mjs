/**
 * Génère une version HTML statique de la maquette (dossier `export-html/`),
 * consultable d'un double-clic sur index.html, sans serveur ni installation.
 * Usage : npm run build && npm start (port 3000), puis node scripts/export-html.mjs [url]
 */
import fs from "node:fs/promises";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000";
const SORTIE = path.resolve("export-html");
const ROUTES_EXCLUES = new Set(["/"]);

const { menuStaff, menuChoriste, references } = await import("./routes.mjs");

const routes = [
  "/connexion",
  "/mot-de-passe-oublie",
  ...menuStaff,
  ...menuChoriste,
  "/choriste/menu",
  ...references.map((r) => `/verifier/${r}`),
  "/verifier/inconnue",
].filter((r) => !ROUTES_EXCLUES.has(r));

const fichier = (route) =>
  route === "/connexion" ? "index.html" : `${route.slice(1).replaceAll("/", "-")}.html`;

const lien = (href) => {
  if (href === "/") return "index.html";
  const [chemin, ancre] = href.split("#");
  if (!routes.includes(chemin)) return href;
  return fichier(chemin) + (ancre ? `#${ancre}` : "");
};

await fs.rm(SORTIE, { recursive: true, force: true });
await fs.mkdir(SORTIE, { recursive: true });
await fs.copyFile("public/logo-pgm.png", path.join(SORTIE, "logo-pgm.png"));

let css = "";
const { correspondances } = await import("./routes.mjs");
const interactif =
  `window.__REFS__=${JSON.stringify(correspondances)};` +
  (await fs.readFile("scripts/maquette.js", "utf8"));

for (const route of routes) {
  const res = await fetch(BASE + route);
  let html = await res.text();
  if (!css) {
    const href = html.match(/<link rel="stylesheet" href="([^"]+)"/)[1];
    css = await (await fetch(BASE + href)).text();
    css += `
.menu-ouvert{display:block!important;position:fixed;inset:0 auto 0 0;z-index:50;width:18rem;box-shadow:0 0 0 100vmax rgba(6,18,46,.6)}`;
    await fs.writeFile(path.join(SORTIE, "styles.css"), css);
  }
  html = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<link rel="(?:preload|stylesheet|modulepreload)"[^>]*>/g, "")
    .replace(/<link rel="manifest"[^>]*>/g, "")
    .replace(/<link rel="(?:icon|apple-touch-icon)"[^>]*>/g, "")
    .replace(/src="\/logo-pgm\.png"/g, 'src="logo-pgm.png"')
    .replace(/href="(\/[^"]*)"/g, (_, h) => `href="${lien(h)}"`)
    .replace("</head>", '<link rel="stylesheet" href="styles.css"/><link rel="icon" href="logo-pgm.png"/></head>')
    .replace("</body>", `<script>${interactif}</script></body>`);
  await fs.writeFile(path.join(SORTIE, fichier(route)), html);
}
console.log(`${routes.length} pages écrites dans ${SORTIE}`);
