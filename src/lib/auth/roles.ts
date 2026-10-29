export const ROLES = [
  "super_admin",
  "presidence",
  "responsable_paroisse",
  "responsable_commission",
  "controleur",
  "choriste",
] as const;

export type Role = (typeof ROLES)[number];

export const LIBELLES_ROLES: Record<Role, string> = {
  super_admin: "Super administrateur",
  presidence: "Présidence PGM",
  responsable_paroisse: "Responsable de paroisse",
  responsable_commission: "Responsable de commission",
  controleur: "Contrôleur",
  choriste: "Choriste",
};

export type Espace = "staff" | "choriste";

export const estStaff = (role: Role | null | undefined) => !!role && role !== "choriste";
export const estAdmin = (role: Role | null | undefined) =>
  role === "super_admin" || role === "presidence";

/** Page d'arrivée après connexion. */
export const accueilPourRole = (role: Role) =>
  role === "controleur" ? "/staff/scanner" : estStaff(role) ? "/staff" : "/choriste";

/** Le contrôleur n'a accès qu'au scanner et au pointage des présences dans l'espace staff. */
export function peutOuvrir(role: Role, chemin: string): boolean {
  if (chemin.startsWith("/choriste")) return role === "choriste";
  if (!chemin.startsWith("/staff")) return true;
  if (!estStaff(role)) return false;
  if (role === "controleur") return chemin === "/staff/scanner" || chemin === "/staff/presences";
  if (chemin.startsWith("/staff/utilisateurs") || chemin.startsWith("/staff/hebergement")) return estAdmin(role);
  if (chemin.startsWith("/staff/projets")) return peutGererCommission(role);
  if (chemin.startsWith("/staff/finances")) return peutSuivreFinances(role);
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

/** Voir les finances, enregistrer entrées et sorties, joindre les reçus : tout le staff sauf le contrôleur. */
export const peutSuivreFinances = (role: Role | null | undefined) => estStaff(role) && role !== "controleur";

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
