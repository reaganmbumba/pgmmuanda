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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type EntreeMenu = {
  href: string;
  label: string;
  icone: LucideIcon;
  /** Étape du plan de réalisation où le module devient fonctionnel. */
  etape: number;
  description: string;
};

export const menuStaff: EntreeMenu[] = [
  { href: "/staff", label: "Tableau de bord", icone: LayoutDashboard, etape: 5, description: "Vue d'ensemble de la PGM." },
  { href: "/staff/membres", label: "Membres", icone: Users, etape: 3, description: "Fiches des choristes, recherche, filtres et export." },
  { href: "/staff/cartes", label: "Cartes et QR codes", icone: IdCard, etape: 4, description: "Génération, réédition et révocation des cartes." },
  { href: "/staff/scanner", label: "Scanner", icone: ScanLine, etape: 4, description: "Vérifier une carte par QR code ou matricule." },
  { href: "/staff/presences", label: "Présences", icone: ClipboardCheck, etape: 6, description: "Présences aux répétitions, réunions et manifestations." },
  { href: "/staff/paroisses", label: "Paroisses", icone: Church, etape: 3, description: "Paroisses et leurs responsables." },
  { href: "/staff/chorales", label: "Chorales", icone: Music, etape: 3, description: "Chorales rattachées à chaque paroisse." },
  { href: "/staff/commissions", label: "Commissions", icone: UsersRound, etape: 7, description: "Commissions, responsables et tâches." },
  { href: "/staff/programmes", label: "Programmes", icone: CalendarDays, etape: 6, description: "Calendrier des activités." },
  { href: "/staff/hebergement", label: "Chambres et hébergement", icone: BedDouble, etape: 7, description: "Chambres, places et affectations." },
  { href: "/staff/chants", label: "Chants et partitions", icone: BookOpen, etape: 7, description: "Répertoire, partitions et enregistrements." },
  { href: "/staff/formations", label: "Formations", icone: GraduationCap, etape: 7, description: "Formations, supports et évaluations." },
  { href: "/staff/communication", label: "Communication", icone: Megaphone, etape: 6, description: "Annonces, communiqués et invitations." },
  { href: "/staff/projets", label: "Projets", icone: FolderKanban, etape: 7, description: "Projets, calendrier et rapports d'avancement." },
  { href: "/staff/finances", label: "Finances", icone: Wallet, etape: 7, description: "Budgets, dépenses et justificatifs." },
  { href: "/staff/rapports", label: "Rapports", icone: BarChart3, etape: 6, description: "Statistiques et rapports exportables." },
  { href: "/staff/utilisateurs", label: "Utilisateurs et permissions", icone: ShieldCheck, etape: 2, description: "Comptes du staff, rôles et accès." },
  { href: "/staff/parametres", label: "Paramètres", icone: Settings, etape: 8, description: "Configuration de la plateforme." },
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
  { href: "/choriste/documents", label: "Mes documents", icone: FileText, etape: 6, description: "Documents mis à votre disposition." },
  { href: "/choriste/notifications", label: "Notifications", icone: Bell, etape: 6, description: "Vos notifications." },
  { href: "/choriste/parametres", label: "Paramètres du compte", icone: Settings, etape: 2, description: "Mot de passe et préférences." },
];

export const ongletsChoriste = ["/choriste", "/choriste/carte", "/choriste/programme", "/choriste/annonces"];
