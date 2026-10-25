const dateFr = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const dateHeureFr = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDate = (iso: string) => dateFr.format(new Date(iso));
export const formatDateHeure = (iso: string) => dateHeureFr.format(new Date(iso));
export const nomComplet = (m: { prenom: string; nom: string; postnom: string }) =>
  `${m.prenom} ${m.nom} ${m.postnom}`;
export const initiales = (m: { prenom: string; nom: string }) =>
  `${m.prenom[0]}${m.nom[0]}`.toUpperCase();
