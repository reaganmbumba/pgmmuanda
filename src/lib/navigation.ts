import {
  BarChart3,
  BedDouble,
  BookOpen,
  Building2,
  CalendarDays,
  CircleUserRound,
  ClipboardCheck,
  CreditCard,
  FileText,
  FolderKanban,
  GraduationCap,
  Home,
  IdCard,
  LayoutDashboard,
  Megaphone,
  Music,
  QrCode,
  ScanLine,
  Settings,
  ShieldCheck,
  Bell,
  Users,
  UsersRound,
  Wallet,
  Church,
  Coins,
  Gavel,
  Landmark,
  Presentation,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type EntreeMenu = {
  href: string;
  label: string;
  icone: LucideIcon;
  /** Étape du plan de réalisation où le module devient fonctionnel. */
  etape: number;
  description: string;
  /** Rubrique du menu du staff, pour s'y retrouver d'un coup d'œil. */
  groupe?: string;
};

export const menuStaff: EntreeMenu[] = [
  { href: "/staff", label: "Tableau de bord", icone: LayoutDashboard, etape: 5, description: "Vue d'ensemble de la PGM." },
  { href: "/staff/membres", label: "Membres", icone: Users, etape: 3, description: "Fiches des choristes, recherche, filtres et export.", groupe: "Membres" },
  { href: "/staff/cartes", label: "Cartes et QR codes", icone: IdCard, etape: 4, description: "Génération, réédition et révocation des cartes.", groupe: "Membres" },
  { href: "/staff/scanner", label: "Scanner", icone: ScanLine, etape: 4, description: "Vérifier une carte par QR code ou matricule.", groupe: "Membres" },
  { href: "/staff/presences", label: "Présences", icone: ClipboardCheck, etape: 6, description: "Présences aux répétitions, réunions et manifestations.", groupe: "Membres" },
  { href: "/staff/discipline", label: "Discipline", icone: Gavel, etape: 9, description: "Absences sans motif et sanctions du Règlement intérieur.", groupe: "Membres" },
  { href: "/staff/conseil", label: "Conseil de la PGM", icone: Landmark, etape: 9, description: "Les fonctions du Conseil et les mandats de 4 ans.", groupe: "Organisation" },
  { href: "/staff/paroisses", label: "Paroisses", icone: Church, etape: 3, description: "Paroisses et leurs responsables.", groupe: "Organisation" },
  { href: "/staff/chorales", label: "Chorales", icone: Music, etape: 3, description: "Chorales rattachées à chaque paroisse.", groupe: "Organisation" },
  { href: "/staff/commissions", label: "Commissions", icone: UsersRound, etape: 7, description: "Commissions, responsables et tâches.", groupe: "Organisation" },
  { href: "/staff/hebergement", label: "Chambres et hébergement", icone: BedDouble, etape: 7, description: "Chambres, places et affectations.", groupe: "Organisation" },
  { href: "/staff/programmes", label: "Programmes", icone: CalendarDays, etape: 6, description: "Calendrier des activités.", groupe: "Activités" },
  { href: "/staff/reunions", label: "Réunions et AG", icone: Presentation, etape: 9, description: "Convocations, ordre du jour, présence et compte rendu.", groupe: "Activités" },
  { href: "/staff/chants", label: "Chants et partitions", icone: BookOpen, etape: 7, description: "Répertoire, partitions et enregistrements.", groupe: "Activités" },
  { href: "/staff/formations", label: "Formations", icone: GraduationCap, etape: 7, description: "Formations, supports et évaluations.", groupe: "Activités" },
  { href: "/staff/communication", label: "Communication", icone: Megaphone, etape: 6, description: "Annonces, communiqués et invitations.", groupe: "Activités" },
  { href: "/staff/documents", label: "Documents", icone: FileText, etape: 8, description: "Documents à disposition des choristes.", groupe: "Activités" },
  { href: "/staff/projets", label: "Projets", icone: FolderKanban, etape: 7, description: "Projets, calendrier et rapports d'avancement.", groupe: "Gestion" },
  { href: "/staff/cotisations", label: "Cotisations", icone: Coins, etape: 9, description: "Qui a payé sa cotisation du mois, qui est en retard.", groupe: "Gestion" },
  { href: "/staff/finances", label: "Finances", icone: Wallet, etape: 7, description: "Budgets, dépenses et justificatifs.", groupe: "Gestion" },
  { href: "/staff/rapports", label: "Rapports", icone: BarChart3, etape: 6, description: "Statistiques et rapports exportables.", groupe: "Gestion" },
  { href: "/staff/utilisateurs", label: "Utilisateurs et permissions", icone: ShieldCheck, etape: 2, description: "Comptes du staff, rôles et accès.", groupe: "Gestion" },
  { href: "/staff/parametres", label: "Paramètres", icone: Settings, etape: 8, description: "Votre compte et votre mot de passe.", groupe: "Gestion" },
];

export const menuChoriste: EntreeMenu[] = [
  { href: "/choriste", label: "Accueil", icone: Home, etape: 5, description: "Votre résumé du jour." },
  { href: "/choriste/carte", label: "Ma carte de choriste", icone: CreditCard, etape: 4, description: "Votre carte numérique." },
  { href: "/choriste/qr", label: "Mon QR code", icone: QrCode, etape: 4, description: "À présenter lors des contrôles." },
  { href: "/choriste/profil", label: "Mon profil", icone: CircleUserRound, etape: 5, description: "Vos informations personnelles." },
  { href: "/choriste/programme", label: "Mon programme", icone: CalendarDays, etape: 6, description: "Les activités qui vous concernent." },
  { href: "/choriste/presences", label: "Mes présences", icone: ClipboardCheck, etape: 6, description: "Votre historique de présence." },
  { href: "/choriste/annonces", label: "Mes annonces", icone: Megaphone, etape: 6, description: "Communications de la PGM." },
  { href: "/choriste/chants", label: "Mes chants et partitions", icone: BookOpen, etape: 7, description: "Répertoire et partitions de votre voix." },
  { href: "/choriste/formations", label: "Mes formations", icone: GraduationCap, etape: 7, description: "Vos formations et évaluations." },
  { href: "/choriste/paroisse", label: "Ma paroisse", icone: Building2, etape: 5, description: "Votre paroisse et votre chorale." },
  { href: "/choriste/chambre", label: "Ma chambre", icone: BedDouble, etape: 7, description: "Votre hébergement, si applicable." },
  { href: "/choriste/cotisations", label: "Mes cotisations", icone: Coins, etape: 9, description: "Les mois que vous avez payés." },
  { href: "/choriste/reunions", label: "Mes réunions", icone: Presentation, etape: 9, description: "Convocations du Conseil, si vous en êtes membre." },
  { href: "/choriste/documents", label: "Mes documents", icone: FileText, etape: 8, description: "Documents mis à votre disposition." },
  { href: "/choriste/notifications", label: "Notifications", icone: Bell, etape: 5, description: "Vos notifications." },
  { href: "/choriste/parametres", label: "Paramètres du compte", icone: Settings, etape: 2, description: "Mot de passe et préférences." },
];

/** Entrée de menu (staff ou choriste) correspondant à un chemin. */
export const entreeMenu = (href: string) => [...menuStaff, ...menuChoriste].find((e) => e.href === href)!;

export const ongletsChoriste = ["/choriste", "/choriste/carte", "/choriste/programme", "/choriste/annonces"];
