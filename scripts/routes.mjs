// Liste des routes à exporter, lue depuis les sources pour rester synchronisée.
import fs from "node:fs";

const nav = fs.readFileSync("src/lib/navigation.ts", "utf8");
const [staff, choriste] = nav.split("export const menuChoriste");
const hrefs = (s) => [...s.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]);

export const menuStaff = hrefs(staff);
export const menuChoriste = hrefs(choriste);
export const references = [
  ...fs.readFileSync("src/lib/demo-data.ts", "utf8").matchAll(/reference: "([^"]+)"/g),
].map((m) => m[1]);

const demo = fs.readFileSync("src/lib/demo-data.ts", "utf8");
export const correspondances = Object.fromEntries(
  [...demo.matchAll(/matricule: "([^"]+)"[\s\S]*?reference: "([^"]+)"/g)].map((m) => [m[1], m[2]]),
);
