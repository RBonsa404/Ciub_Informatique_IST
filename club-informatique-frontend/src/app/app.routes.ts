import { Routes } from '@angular/router';
import { environment } from '../environments/environment';
import { featureGuard, guestGuard, spaceHomeGuard } from './core/auth/guards';

/**
 * Les pages du produit sont ajoutées une à une (docs/PROGRESSION.md). Chaque route de module porte
 * featureGuard(module) : un module non opérationnel aboutit à la page introuvable.
 * Gabarits et pages sont chargés à la demande pour contenir le lot initial.
 */
export const routes: Routes = [
  ...environment.internalRoutes,
  {
    path: '',
    canMatch: [featureGuard('authentification')],
    loadComponent: () => import('./layouts/layouts').then((m) => m.AuthLayout),
    children: [
      { path: 'connexion', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/login-page').then((m) => m.LoginPage) },
      { path: 'inscription', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/register-page').then((m) => m.RegisterPage) },
      {
        path: 'mot-de-passe-oublie',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/auth/password-pages').then((m) => m.ForgotPasswordPage),
      },
      { path: 'reinitialisation', loadComponent: () => import('./pages/auth/password-pages').then((m) => m.ResetPasswordPage) },
      { path: 'verification-adresse', loadComponent: () => import('./pages/auth/password-pages').then((m) => m.VerifyEmailPage) },
    ],
  },
  { path: 'espace', pathMatch: 'full', canActivate: [spaceHomeGuard], children: [] },
  {
    path: '',
    loadComponent: () => import('./layouts/layouts').then((m) => m.ErrorLayout),
    children: [
      { path: 'acces-refuse', loadComponent: () => import('./pages/errors/error-pages').then((m) => m.ForbiddenPage) },
      { path: '**', loadComponent: () => import('./pages/errors/error-pages').then((m) => m.NotFoundPage) },
    ],
  },
];
