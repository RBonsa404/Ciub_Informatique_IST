import { Route, Routes, UrlSegment } from '@angular/router';
import { environment } from '../environments/environment';
import { authGuard, featureGuard, guestGuard, passwordChangeGuard, roleGuard, spaceHomeGuard } from './core/auth/guards';

const publicPages = () => import('./pages/public/about-pages');
const actualites = () => import('./pages/public/actualites-pages');
const evenements = () => import('./pages/public/evenements-pages');
const projets = () => import('./pages/public/projets-pages');
const formations = () => import('./pages/public/formations-pages');
const legal = () => import('./pages/public/legal-pages');
const errors = () => import('./pages/errors/error-pages');
const passwords = () => import('./pages/auth/password-pages');
const profile = () => import('./pages/member/profile-pages');
const supports = () => import('./pages/member/supports-pages');

const courses = () => import('./pages/trainer/courses-pages');
const news = () => import('./pages/management/news-pages');
const publications = () => import('./pages/member/publications-pages');
const memberProjects = () => import('./pages/member/projects-pages');
const trainerProjects = () => import('./pages/trainer/trainer-projects-pages');
const projectsReview = () => import('./pages/management/projects-review-pages');
const adminUsers = () => import('./pages/admin/users-pages');
const adminReference = () => import('./pages/admin/reference-pages');
const adminInsight = () => import('./pages/admin/insight-pages');

const USERS_CRUMB = { label: 'Utilisateurs', route: '/espace/admin/utilisateurs' };

const NEWS_CRUMB = { label: 'Actualités', route: '/espace/gestion/actualites' };

const COURSES_CRUMB = { label: 'Mes cours', route: '/espace/formateur/cours' };
const SUPPORTS_CRUMB = { label: 'Supports et devoirs', route: '/espace/supports' };

const AUTH_PATHS = new Set(['connexion', 'inscription', 'mot-de-passe-oublie', 'reinitialisation', 'verification-adresse']);

/**
 * Les pages du produit sont ajoutées une à une (docs/PROGRESSION.md). Chaque route de module porte
 * featureGuard(module) : un module non opérationnel aboutit à la page introuvable.
 * Gabarits et pages sont chargés à la demande pour contenir le lot initial.
 */
export const routes: Routes = [
  ...environment.internalRoutes,
  {
    path: '',
    // Le groupe ne correspond qu'à ses propres chemins : un parent à chemin vide capterait sinon la racine du site.
    canMatch: [featureGuard('authentification'), (_route: Route, segments: UrlSegment[]) => AUTH_PATHS.has(segments[0]?.path ?? '')],
    loadComponent: () => import('./layouts/layouts').then((m) => m.AuthLayout),
    children: [
      { path: 'connexion', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/login-page').then((m) => m.LoginPage) },
      { path: 'inscription', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/register-page').then((m) => m.RegisterPage) },
      { path: 'mot-de-passe-oublie', canActivate: [guestGuard], loadComponent: () => passwords().then((m) => m.ForgotPasswordPage) },
      { path: 'reinitialisation', loadComponent: () => passwords().then((m) => m.ResetPasswordPage) },
      { path: 'verification-adresse', loadComponent: () => passwords().then((m) => m.VerifyEmailPage) },
    ],
  },
  { path: 'espace', pathMatch: 'full', canActivate: [spaceHomeGuard], children: [] },
  {
    path: 'espace',
    canActivate: [authGuard],
    canActivateChild: [passwordChangeGuard],
    loadComponent: () => import('./layouts/layouts').then((m) => m.DashboardLayout),
    children: [
      {
        path: 'mot-de-passe',
        data: { fil: [{ label: 'Choix du mot de passe' }] },
        loadComponent: () => import('./pages/system/forced-password-page').then((m) => m.ForcedPasswordPage),
      },
      {
        path: 'systeme',
        canMatch: [featureGuard('systeme')],
        canActivate: [roleGuard('SUPER_ADMIN')],
        data: { fil: [{ label: 'Configuration du système' }] },
        loadComponent: () => import('./pages/system/system-pages').then((m) => m.SystemConfigPage),
      },
      {
        path: 'dsi',
        canMatch: [featureGuard('conformite')],
        canActivate: [roleGuard('DSI')],
        data: { fil: [{ label: 'Supervision technique' }] },
        loadComponent: () => import('./pages/system/system-pages').then((m) => m.CompliancePage),
      },
      {
        path: 'membre',
        canMatch: [featureGuard('inscriptions')],
        canActivate: [roleGuard('MEMBRE')],
        data: { fil: [{ label: 'Tableau de bord' }] },
        loadComponent: () => import('./pages/member/dashboard-page').then((m) => m.MemberDashboardPage),
      },
      {
        path: 'inscriptions',
        canMatch: [featureGuard('inscriptions')],
        canActivate: [roleGuard('MEMBRE')],
        data: { fil: [{ label: 'Mes inscriptions' }] },
        loadComponent: () => import('./pages/member/inscriptions-page').then((m) => m.InscriptionsPage),
      },
      {
        path: 'projets',
        canMatch: [featureGuard('projets')],
        canActivate: [roleGuard('MEMBRE')],
        data: { fil: [{ label: 'Mes projets' }] },
        loadComponent: () => memberProjects().then((m) => m.MyProjectsPage),
      },
      {
        path: 'projets/proposer',
        canMatch: [featureGuard('projets')],
        canActivate: [roleGuard('MEMBRE')],
        data: { fil: [{ label: 'Mes projets', route: '/espace/projets' }, { label: 'Proposition' }] },
        loadComponent: () => memberProjects().then((m) => m.ProposeProjectPage),
      },
      {
        path: 'supports',
        canMatch: [featureGuard('supports')],
        canActivate: [roleGuard('MEMBRE')],
        data: { fil: [{ label: 'Supports et devoirs' }] },
        loadComponent: () => supports().then((m) => m.SupportsListPage),
      },
      {
        path: 'supports/ressources/:id',
        canMatch: [featureGuard('supports')],
        canActivate: [roleGuard('MEMBRE')],
        data: { kind: 'ressource', fil: [SUPPORTS_CRUMB, { label: 'Support' }] },
        loadComponent: () => supports().then((m) => m.SupportDetailPage),
      },
      {
        path: 'supports/devoirs/:formationId/:devoirId',
        canMatch: [featureGuard('supports')],
        canActivate: [roleGuard('MEMBRE')],
        data: { kind: 'devoir', fil: [SUPPORTS_CRUMB, { label: 'Devoir' }] },
        loadComponent: () => supports().then((m) => m.SupportDetailPage),
      },
      {
        path: 'formateur',
        canMatch: [featureGuard('formations')],
        canActivate: [roleGuard('FORMATEUR')],
        children: [
          {
            path: '',
            pathMatch: 'full',
            data: { fil: [{ label: 'Tableau de bord formateur' }] },
            loadComponent: () => import('./pages/trainer/trainer-dashboard-page').then((m) => m.TrainerDashboardPage),
          },
          {
            path: 'projets',
            canMatch: [featureGuard('projets')],
            data: { fil: [{ label: 'Projets suivis' }] },
            loadComponent: () => trainerProjects().then((m) => m.TrainerProjectsPage),
          },
          {
            path: 'projets/:id',
            canMatch: [featureGuard('projets')],
            data: { fil: [{ label: 'Projets suivis', route: '/espace/formateur/projets' }, { label: 'Suivi' }] },
            loadComponent: () => trainerProjects().then((m) => m.TrainerProjectFollowPage),
          },
          { path: 'cours', data: { fil: [{ label: 'Mes cours' }] }, loadComponent: () => courses().then((m) => m.CoursesListPage) },
          { path: 'cours/nouveau', data: { fil: [COURSES_CRUMB, { label: 'Création' }] }, loadComponent: () => courses().then((m) => m.CourseFormPage) },
          { path: 'cours/:id/modifier', data: { fil: [COURSES_CRUMB, { label: 'Édition' }] }, loadComponent: () => courses().then((m) => m.CourseFormPage) },
          {
            path: 'cours/:id/publier',
            data: { fil: [COURSES_CRUMB, { label: 'Publication' }] },
            loadComponent: () => import('./pages/trainer/publish-page').then((m) => m.PublishPage),
          },
          {
            path: 'cours/:id/sessions/:sessionId/presences',
            data: { fil: [COURSES_CRUMB, { label: 'Émargement' }] },
            loadComponent: () => import('./pages/trainer/attendance-page').then((m) => m.AttendancePage),
          },
          {
            path: 'cours/:id',
            data: { fil: [COURSES_CRUMB, { label: 'Détail' }] },
            loadComponent: () => import('./pages/trainer/course-detail-page').then((m) => m.CourseDetailPage),
          },
        ],
      },
      {
        path: 'gestion',
        canMatch: [featureGuard('gestion-club')],
        canActivate: [roleGuard('RESPONSABLE_CLUB')],
        children: [
          {
            path: '',
            pathMatch: 'full',
            data: { fil: [{ label: 'Tableau de bord du Responsable' }] },
            loadComponent: () => import('./pages/management/management-dashboard-page').then((m) => m.ManagementDashboardPage),
          },
          {
            path: 'bureau',
            canMatch: [featureGuard('bureau')],
            data: { fil: [{ label: 'Composition du bureau' }] },
            loadComponent: () => import('./pages/management/bureau-management-page').then((m) => m.BureauManagementPage),
          },
          {
            path: 'actualites',
            canMatch: [featureGuard('actualites')],
            data: { fil: [{ label: 'Gestion des actualités' }] },
            loadComponent: () => news().then((m) => m.NewsListPage),
          },
          {
            path: 'actualites/nouvelle',
            canMatch: [featureGuard('actualites')],
            data: { fil: [NEWS_CRUMB, { label: 'Nouvelle actualité' }] },
            loadComponent: () => news().then((m) => m.NewsEditorPage),
          },
          {
            path: 'actualites/:id/modifier',
            canMatch: [featureGuard('actualites')],
            data: { fil: [NEWS_CRUMB, { label: 'Modification' }] },
            loadComponent: () => news().then((m) => m.NewsEditorPage),
          },
          {
            path: 'notifications',
            canMatch: [featureGuard('notifications')],
            data: { fil: [{ label: 'Notification globale' }] },
            loadComponent: () => import('./pages/management/broadcast-page').then((m) => m.BroadcastPage),
          },
          {
            path: 'projets',
            canMatch: [featureGuard('projets')],
            data: { fil: [{ label: 'Projets à valider' }] },
            loadComponent: () => projectsReview().then((m) => m.ProjectsReviewListPage),
          },
          {
            path: 'projets/:id',
            canMatch: [featureGuard('projets')],
            data: { fil: [{ label: 'Projets à valider', route: '/espace/gestion/projets' }, { label: 'Examen' }] },
            loadComponent: () => projectsReview().then((m) => m.ProjectReviewPage),
          },
          {
            path: 'evenements',
            canMatch: [featureGuard('evenements')],
            data: { fil: [{ label: 'Gestion des événements' }] },
            loadComponent: () => import('./pages/management/events-page').then((m) => m.EventsManagementPage),
          },
          {
            path: 'inscriptions',
            canMatch: [featureGuard('inscriptions')],
            data: { fil: [{ label: 'Inscriptions et listes d’attente' }] },
            loadComponent: () => import('./pages/management/registrations-page').then((m) => m.RegistrationsPage),
          },
        ],
      },
      {
        path: 'admin/messages',
        canMatch: [featureGuard('contact')],
        canActivate: [roleGuard('ADMIN', 'RESPONSABLE_CLUB')],
        data: { fil: [{ label: 'Messages de contact' }] },
        loadComponent: () => import('./pages/management/contact-messages-page').then((m) => m.ContactMessagesPage),
      },
      {
        path: 'admin',
        canMatch: [featureGuard('administration')],
        canActivate: [roleGuard('ADMIN')],
        children: [
          {
            path: '',
            pathMatch: 'full',
            data: { fil: [{ label: 'Administration' }] },
            loadComponent: () => import('./pages/admin/admin-dashboard-page').then((m) => m.AdminDashboardPage),
          },
          { path: 'utilisateurs', data: { fil: [{ label: 'Utilisateurs' }] }, loadComponent: () => adminUsers().then((m) => m.UsersListPage) },
          { path: 'utilisateurs/:id', data: { fil: [USERS_CRUMB, { label: 'Compte' }] }, loadComponent: () => adminUsers().then((m) => m.UserDetailPage) },
          { path: 'roles', data: { fil: [{ label: 'Rôles et permissions' }] }, loadComponent: () => adminReference().then((m) => m.RolesMatrixPage) },
          { path: 'categories', data: { fil: [{ label: 'Catégories' }] }, loadComponent: () => adminReference().then((m) => m.CategoriesPage) },
          {
            path: 'statistiques',
            canMatch: [featureGuard('statistiques')],
            data: { fil: [{ label: 'Statistiques' }] },
            loadComponent: () => adminInsight().then((m) => m.StatisticsPage),
          },
          { path: 'securite', data: { fil: [{ label: 'Sécurité des comptes' }] }, loadComponent: () => adminInsight().then((m) => m.AccountSecurityPage) },
          { path: 'journal', data: { fil: [{ label: 'Journal d’audit' }] }, loadComponent: () => adminInsight().then((m) => m.AuditLogPage) },
        ],
      },
      {
        path: 'notifications',
        canMatch: [featureGuard('notifications')],
        data: { fil: [{ label: 'Notifications' }] },
        loadComponent: () => import('./pages/member/notifications-page').then((m) => m.NotificationsPage),
      },
      {
        path: 'publications',
        canMatch: [featureGuard('publications-membres')],
        canActivate: [roleGuard('MEMBRE')],
        data: { fil: [{ label: 'Publications' }] },
        loadComponent: () => publications().then((m) => m.PublicationsListPage),
      },
      {
        path: 'publications/:slug',
        canMatch: [featureGuard('publications-membres')],
        canActivate: [roleGuard('MEMBRE')],
        data: { fil: [{ label: 'Publications', route: '/espace/publications' }, { label: 'Publication' }] },
        loadComponent: () => publications().then((m) => m.PublicationDetailPage),
      },
      {
        path: 'profil',
        canMatch: [featureGuard('profil')],
        data: { fil: [{ label: 'Mon profil' }] },
        loadComponent: () => profile().then((m) => m.ProfilePage),
      },
      {
        path: 'profil/modifier',
        canMatch: [featureGuard('profil')],
        data: { fil: [{ label: 'Mon profil', route: '/espace/profil' }, { label: 'Édition' }] },
        loadComponent: () => profile().then((m) => m.ProfileEditPage),
      },
      {
        path: 'parametres',
        canMatch: [featureGuard('profil')],
        data: { fil: [{ label: 'Paramètres du compte' }] },
        loadComponent: () => import('./pages/member/settings-page').then((m) => m.SettingsPage),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layouts/layouts').then((m) => m.PublicLayout),
    children: [
      { path: '', pathMatch: 'full', canMatch: [featureGuard('contenu-public')], loadComponent: () => import('./pages/public/home-page').then((m) => m.HomePage) },
      { path: 'presentation', canMatch: [featureGuard('contenu-public')], loadComponent: () => publicPages().then((m) => m.PresentationPage) },
      { path: 'bureau', canMatch: [featureGuard('bureau')], loadComponent: () => publicPages().then((m) => m.BureauPage) },
      { path: 'actualites', canMatch: [featureGuard('actualites')], loadComponent: () => actualites().then((m) => m.ActualitesListPage) },
      { path: 'actualites/:slug', canMatch: [featureGuard('actualites')], loadComponent: () => actualites().then((m) => m.ActualiteDetailPage) },
      { path: 'evenements', canMatch: [featureGuard('evenements')], loadComponent: () => evenements().then((m) => m.EvenementsListPage) },
      { path: 'evenements/:slug', canMatch: [featureGuard('evenements')], loadComponent: () => evenements().then((m) => m.EvenementDetailPage) },
      { path: 'projets', canMatch: [featureGuard('projets')], loadComponent: () => projets().then((m) => m.ProjetsListPage) },
      { path: 'projets/:slug', canMatch: [featureGuard('projets')], loadComponent: () => projets().then((m) => m.ProjetDetailPage) },
      { path: 'formations', canMatch: [featureGuard('formations')], loadComponent: () => formations().then((m) => m.FormationsListPage) },
      { path: 'formations/:slug', canMatch: [featureGuard('formations')], loadComponent: () => formations().then((m) => m.FormationDetailPage) },
      { path: 'ressources', canMatch: [featureGuard('ressources')], loadComponent: () => formations().then((m) => m.RessourcesPage) },
      { path: 'contact', canMatch: [featureGuard('contact')], loadComponent: () => import('./pages/public/contact-page').then((m) => m.ContactPage) },
      { path: 'mentions-legales', loadComponent: () => legal().then((m) => m.MentionsLegalesPage) },
      { path: 'confidentialite', loadComponent: () => legal().then((m) => m.ConfidentialitePage) },
      { path: 'conditions-utilisation', loadComponent: () => legal().then((m) => m.ConditionsPage) },
      { path: 'acces-refuse', loadComponent: () => errors().then((m) => m.ForbiddenPage) },
      { path: 'erreur', loadComponent: () => errors().then((m) => m.ServiceErrorPage) },
      { path: '**', loadComponent: () => errors().then((m) => m.NotFoundPage) },
    ],
  },
];
