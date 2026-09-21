import { Routes } from '@angular/router';

/**
 * Racine des routes. Chaque module ajoute sa propre route en lazy-loading
 * (loadComponent) dans sa section -- ne pas tout importer en eager pour
 * garder un bundle initial léger (BNF-01 Performance, cahier des charges).
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/accueil/accueil.component').then((m) => m.AccueilComponent),
  },

  // --- À décommenter / compléter par chaque module owner ---
  // { path: 'actualites', loadComponent: () => import('./features/actualites/actualites.component')... },
  // { path: 'evenements', loadComponent: () => import('./features/evenements/evenements.component')... },
  // { path: 'formations', loadComponent: () => import('./features/formations/formations.component')... },
  // { path: 'projets', loadComponent: () => import('./features/projets/projets.component')... },
  // { path: 'profil', canActivate: [authGuard], loadComponent: () => import('./features/profil/profil.component')... },
  // { path: 'administration', canActivate: [authGuard, adminGuard], loadComponent: () => ... },
  // { path: 'contact', loadComponent: () => import('./features/contact/contact.component')... },

  { path: '**', redirectTo: '' },
];
