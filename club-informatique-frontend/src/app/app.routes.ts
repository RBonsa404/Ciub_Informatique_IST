import { Routes } from '@angular/router';
import { environment } from '../environments/environment';

/**
 * Les pages du produit sont ajoutées une à une (docs/PROGRESSION.md). Chaque route de module porte
 * featureGuard(module) : un module non opérationnel aboutit à la page introuvable.
 * Gabarits et pages sont chargés à la demande pour contenir le lot initial.
 */
export const routes: Routes = [
  ...environment.internalRoutes,
  {
    path: '',
    loadComponent: () => import('./layouts/layouts').then((m) => m.ErrorLayout),
    children: [
      { path: 'acces-refuse', loadComponent: () => import('./pages/errors/error-pages').then((m) => m.ForbiddenPage) },
      { path: '**', loadComponent: () => import('./pages/errors/error-pages').then((m) => m.NotFoundPage) },
    ],
  },
];
