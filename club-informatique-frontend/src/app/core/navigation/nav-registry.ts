import { IconName } from '../../shared/ui/icon/icon-names';
import { Role } from '../auth/auth.models';
import { ModuleKey } from '../config/features';

export interface NavEntry {
  readonly label: string;
  readonly route: string;
  readonly module: ModuleKey;
  readonly icon?: IconName;
  /** Rôles autorisés ; absent : tout utilisateur (ou tout utilisateur connecté dans l'espace). */
  readonly roles?: readonly Role[];
  /** Correspondance exacte de la route pour l'état actif. */
  readonly exact?: boolean;
}

export interface NavSection {
  readonly title: string;
  readonly entries: readonly NavEntry[];
}

/** Registre unique des entrées de navigation : en-tête, pied de page et barre latérale en dérivent. */
export const PUBLIC_HEADER_NAV: readonly NavEntry[] = [
  { label: 'Accueil', route: '/', module: 'contenu-public', exact: true },
  { label: 'Présentation', route: '/presentation', module: 'contenu-public' },
  { label: 'Formations', route: '/formations', module: 'formations' },
  { label: 'Événements', route: '/evenements', module: 'evenements' },
  { label: 'Projets', route: '/projets', module: 'projets' },
  { label: 'Actualités', route: '/actualites', module: 'actualites' },
  { label: 'Contact', route: '/contact', module: 'contact' },
];

export const PUBLIC_FOOTER_NAV: readonly NavEntry[] = [
  { label: 'Accueil', route: '/', module: 'contenu-public', exact: true },
  { label: 'Présentation', route: '/presentation', module: 'contenu-public' },
  { label: 'Bureau', route: '/bureau', module: 'bureau' },
  { label: 'Formations', route: '/formations', module: 'formations' },
  { label: 'Événements', route: '/evenements', module: 'evenements' },
  { label: 'Projets', route: '/projets', module: 'projets' },
  { label: 'Actualités', route: '/actualites', module: 'actualites' },
  { label: 'Ressources', route: '/ressources', module: 'ressources' },
];

/** Pages légales : statiques, sans module backend. */
export const LEGAL_NAV: readonly { label: string; route: string }[] = [
  { label: 'Mentions légales', route: '/mentions-legales' },
  { label: 'Politique de confidentialité', route: '/confidentialite' },
  { label: 'Conditions d’utilisation', route: '/conditions-utilisation' },
];

const MEMBRE: readonly Role[] = ['MEMBRE'];
const FORMATEUR: readonly Role[] = ['FORMATEUR'];
const RESPONSABLE: readonly Role[] = ['RESPONSABLE_CLUB'];
const ADMIN: readonly Role[] = ['ADMIN'];

export const SPACE_NAV: readonly NavSection[] = [
  {
    title: 'Mon espace',
    entries: [
      { label: 'Tableau de bord', route: '/espace/membre', module: 'inscriptions', icon: 'grid', roles: MEMBRE },
      { label: 'Publications', route: '/espace/publications', module: 'publications-membres', icon: 'rss', roles: MEMBRE },
      { label: 'Mes inscriptions', route: '/espace/inscriptions', module: 'inscriptions', icon: 'file', roles: MEMBRE },
      { label: 'Supports et devoirs', route: '/espace/supports', module: 'supports', icon: 'book', roles: MEMBRE },
      { label: 'Proposer un projet', route: '/espace/projets/proposer', module: 'projets', icon: 'plus-circle', roles: MEMBRE },
      { label: 'Mes projets', route: '/espace/projets', module: 'projets', icon: 'activity', roles: MEMBRE, exact: true },
    ],
  },
  {
    title: 'Formation',
    entries: [
      { label: 'Tableau de bord formateur', route: '/espace/formateur', module: 'formations', icon: 'grid', roles: FORMATEUR, exact: true },
      { label: 'Mes cours', route: '/espace/formateur/cours', module: 'formations', icon: 'book-open', roles: FORMATEUR },
      { label: 'Projets suivis', route: '/espace/formateur/projets', module: 'projets', icon: 'activity', roles: FORMATEUR },
    ],
  },
  {
    title: 'Gestion du club',
    entries: [
      { label: 'Tableau de bord', route: '/espace/gestion', module: 'gestion-club', icon: 'grid', roles: RESPONSABLE, exact: true },
      { label: 'Actualités', route: '/espace/gestion/actualites', module: 'actualites', icon: 'newspaper', roles: RESPONSABLE },
      { label: 'Événements', route: '/espace/gestion/evenements', module: 'evenements', icon: 'calendar', roles: RESPONSABLE },
      { label: 'Projets à valider', route: '/espace/gestion/projets', module: 'projets', icon: 'check-square', roles: RESPONSABLE },
      { label: 'Inscriptions', route: '/espace/gestion/inscriptions', module: 'inscriptions', icon: 'users', roles: RESPONSABLE },
      { label: 'Bureau', route: '/espace/gestion/bureau', module: 'bureau', icon: 'award', roles: RESPONSABLE },
      { label: 'Notification globale', route: '/espace/gestion/notifications', module: 'notifications', icon: 'volume-2', roles: RESPONSABLE },
    ],
  },
  {
    title: 'Administration',
    entries: [
      { label: 'Tableau de bord', route: '/espace/admin', module: 'administration', icon: 'grid', roles: ADMIN, exact: true },
      { label: 'Utilisateurs', route: '/espace/admin/utilisateurs', module: 'administration', icon: 'users', roles: ADMIN },
      { label: 'Rôles et permissions', route: '/espace/admin/roles', module: 'administration', icon: 'shield', roles: ADMIN },
      { label: 'Catégories', route: '/espace/admin/categories', module: 'administration', icon: 'folder', roles: ADMIN },
      { label: 'Textes du site', route: '/espace/admin/textes', module: 'administration', icon: 'edit', roles: ADMIN },
      { label: 'Messages de contact', route: '/espace/admin/messages', module: 'contact', icon: 'inbox', roles: ['ADMIN', 'RESPONSABLE_CLUB'] },
      { label: 'Statistiques', route: '/espace/admin/statistiques', module: 'statistiques', icon: 'bar-chart-2', roles: ADMIN },
      { label: 'Sécurité des comptes', route: '/espace/admin/securite', module: 'administration', icon: 'lock', roles: ADMIN },
      { label: 'Journal d’audit', route: '/espace/admin/journal', module: 'administration', icon: 'clipboard', roles: ADMIN },
    ],
  },
  {
    title: 'Système',
    entries: [
      { label: 'Configuration et sauvegardes', route: '/espace/systeme', module: 'systeme', icon: 'database', roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    title: 'Conformité',
    entries: [{ label: 'Supervision technique', route: '/espace/dsi', module: 'conformite', icon: 'server', roles: ['DSI'] }],
  },
  {
    title: 'Compte',
    entries: [
      { label: 'Notifications', route: '/espace/notifications', module: 'notifications', icon: 'bell' },
      { label: 'Mon profil', route: '/espace/profil', module: 'profil', icon: 'user' },
      { label: 'Paramètres', route: '/espace/parametres', module: 'profil', icon: 'settings' },
    ],
  },
];
