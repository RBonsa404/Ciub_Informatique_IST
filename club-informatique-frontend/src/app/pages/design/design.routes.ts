import { inject } from '@angular/core';
import { CanActivateFn, Routes } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { AuthLayout, DashboardLayout, ErrorLayout, PublicLayout } from '../../layouts/layouts';
import { NotFoundPage } from '../errors/error-pages';
import { DesignPage, LayoutPlaceholder } from './design-page';

/**
 * Recette interne uniquement (route absente de la production) : ouvre une session factice en mémoire
 * pour afficher la barre latérale complète. Les libellés sont des gabarits, non des données.
 */
const previewSession: CanActivateFn = () => {
  inject(AuthStore).setSession(
    {
      accessToken: '',
      expiresIn: 0,
      utilisateur: { id: 0, email: '', nom: 'Nom', prenom: 'Prénom', roles: ['SUPER_ADMIN', 'RESPONSABLE_CLUB', 'FORMATEUR', 'DSI'] },
    },
    false,
  );
  return true;
};

const clearSession: CanActivateFn = () => {
  inject(AuthStore).clear();
  return true;
};

export const DESIGN_ROUTES: Routes = [
  { path: '', component: PublicLayout, canActivate: [clearSession], children: [{ path: '', component: DesignPage }] },
  { path: 'public', component: PublicLayout, canActivate: [clearSession], children: [{ path: '', component: LayoutPlaceholder }] },
  { path: 'public-connecte', component: PublicLayout, canActivate: [previewSession], children: [{ path: '', component: LayoutPlaceholder }] },
  { path: 'authentification', component: AuthLayout, canActivate: [clearSession], children: [{ path: '', component: LayoutPlaceholder }] },
  {
    path: 'espace',
    component: DashboardLayout,
    canActivate: [previewSession],
    data: { fil: [{ label: 'Espace', route: '/__design/espace' }, { label: 'Page courante' }] },
    children: [{ path: '', component: LayoutPlaceholder }],
  },
  { path: 'erreur', component: ErrorLayout, canActivate: [clearSession], children: [{ path: '', component: NotFoundPage }] },
];
