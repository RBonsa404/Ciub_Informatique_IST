import { Route, Routes, UrlSegment } from '@angular/router';
import { environment } from '../environments/environment';
import { authGuard, featureGuard, guestGuard, roleGuard, spaceHomeGuard } from './core/auth/guards';

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
    loadComponent: () => import('./layouts/layouts').then((m) => m.DashboardLayout),
    children: [
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
