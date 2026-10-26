/** Cellule CSV (séparateur « ; » pour Excel en français). Neutralise les formules (=, +, -, @) qu'Excel exécuterait. */
export const cellule = (v: string) => {
  const t = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

/** Fichier CSV avec BOM, pour qu'Excel lise correctement les accents. */
export const fichierCsv = (entete: string[], lignes: string[][]) =>
  "﻿" + [entete, ...lignes].map((l) => l.map(cellule).join(";")).join("\r\n");
