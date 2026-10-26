const dateFr = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Kinshasa",
});
const dateHeureFr = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Kinshasa",
});

export const formatDate = (iso: string) => dateFr.format(new Date(iso));
export const formatDateHeure = (iso: string) => dateHeureFr.format(new Date(iso));
export const nomComplet = (m: { prenom: string; nom: string; postnom: string }) =>
  `${m.prenom} ${m.nom} ${m.postnom}`;
export const initiales = (m: { prenom: string; nom: string }) =>
  `${m.prenom[0]}${m.nom[0]}`.toUpperCase();
/** « Paroisse X », sans doubler le mot si le nom le contient déjà. */
export const libelleParoisse = (nom: string) => (/^paroisse\b/i.test(nom.trim()) ? nom : `Paroisse ${nom}`);
const heureFr = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Kinshasa" });
export const formatHeure = (iso: string) => heureFr.format(new Date(iso));
