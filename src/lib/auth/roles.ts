export const ROLES = [
  "super_admin",
  "presidence",
  "responsable_paroisse",
  "responsable_commission",
  "controleur",
  "choriste",
  "president_antenne",
] as const;

export type Role = (typeof ROLES)[number];

export const LIBELLES_ROLES: Record<Role, string> = {
  super_admin: "Super administrateur",
  presidence: "Présidence PGM",
  responsable_paroisse: "Responsable de paroisse",
  responsable_commission: "Responsable de commission",
  controleur: "Contrôleur",
  choriste: "Choriste",
  president_antenne: "Président de l'antenne PGM Muanda",
};

/** Les trois niveaux affichés : le détail (périmètre staff, type d'admin) se choisit ensuite. */
export type Niveau = "membre" | "staff" | "admin";
export const LIBELLES_NIVEAUX: Record<Niveau, string> = { membre: "Membre", staff: "Membre staff", admin: "Admin" };
export const ROLES_PAR_NIVEAU: Record<Niveau, Role[]> = {
  membre: ["choriste"],
  staff: ["responsable_paroisse", "responsable_commission", "controleur"],
  admin: ["presidence", "super_admin", "president_antenne"],
};
export const niveauDe = (role: Role): Niveau =>
  (Object.keys(ROLES_PAR_NIVEAU) as Niveau[]).find((n) => ROLES_PAR_NIVEAU[n].includes(role)) ?? "membre";

export type Espace = "staff" | "choriste";

export const estStaff = (role: Role | null | undefined) => !!role && role !== "choriste";
export const estAdmin = (role: Role | null | undefined) =>
  role === "super_admin" || role === "presidence";

/** Président de l'antenne : voit tout comme l'administration, mais ne modifie rien. */
export const estLecteurGeneral = (role: Role | null | undefined) => role === "president_antenne";
/** Voir tout ce que voit l'administration (sans forcément pouvoir modifier). */
export const voitTout = (role: Role | null | undefined) => estAdmin(role) || estLecteurGeneral(role);

/** Page d'arrivée après connexion. */
export const accueilPourRole = (role: Role) =>
  role === "controleur" ? "/staff/scanner" : estStaff(role) ? "/staff" : "/choriste";

/** Le contrôleur n'a accès qu'au scanner et au pointage des présences dans l'espace staff. */
export function peutOuvrir(role: Role, chemin: string, accesFinances = false): boolean {
  if (chemin.startsWith("/choriste")) return role === "choriste";
  if (!chemin.startsWith("/staff")) return true;
  if (!estStaff(role)) return false;
  if (role === "controleur") return chemin === "/staff/scanner" || chemin === "/staff/presences";
  if (estLecteurGeneral(role)) return true;
  if (chemin.startsWith("/staff/utilisateurs") || chemin.startsWith("/staff/hebergement")) return estAdmin(role);
  if (chemin.startsWith("/staff/projets")) return peutGererCommission(role);
  if (chemin.startsWith("/staff/discipline")) return peutGererMembres(role);
  if (chemin.startsWith("/staff/cotisations")) return peutSuivreFinances(role, accesFinances);
  if (chemin.startsWith("/staff/finances")) return peutSuivreFinances(role, accesFinances) || peutGererCommission(role);
  return true;
}

/** Inscrire et modifier des membres (la base limite le responsable à sa paroisse). */
export const peutGererMembres = (role: Role | null | undefined) =>
  estAdmin(role) || role === "responsable_paroisse";

/** Créer et modifier des activités (la base limite chacun à sa paroisse ou à sa commission). */
export const peutGererProgramme = (role: Role | null | undefined) =>
  estAdmin(role) || role === "responsable_paroisse" || role === "responsable_commission";

/** Gérer formations, projets et chants (la base limite le responsable à sa commission). */
export const peutGererCommission = (role: Role | null | undefined) => estAdmin(role) || role === "responsable_commission";

/**
 * Suivre toutes les finances (voir, enregistrer, joindre les reçus) : l'administration, et les
 * responsables que l'administration a choisis (case « Accès aux finances »). Sans cette case,
 * le responsable de commission ne voit que l'argent des projets de sa commission.
 */
export const peutSuivreFinances = (role: Role | null | undefined, accesFinances = false) =>
  estAdmin(role) || (accesFinances && peutRecevoirAccesFinances(role));

/** Rôles pour lesquels l'administration peut cocher « Accès aux finances ». */
export const peutRecevoirAccesFinances = (role: Role | null | undefined) =>
  role === "responsable_paroisse" || role === "responsable_commission";

/** Publier des annonces (le responsable de paroisse publie vers sa paroisse). */
export const peutPublier = (role: Role | null | undefined) => estAdmin(role) || role === "responsable_paroisse";

/** Rôles qu'un administrateur peut attribuer (la présidence ne crée pas de super admin). */
export const rolesAttribuables = (role: Role): Role[] =>
  role === "super_admin" ? [...ROLES] : role === "presidence" ? ROLES.filter((r) => r !== "super_admin") : [];

/** N'accepte qu'une redirection interne, pour éviter les redirections vers un site tiers. */
export function cheminSur(suite: string | null | undefined, defaut = "/"): string {
  if (!suite || !suite.startsWith("/") || suite.startsWith("//") || suite.includes("\\")) return defaut;
  return suite;
}
