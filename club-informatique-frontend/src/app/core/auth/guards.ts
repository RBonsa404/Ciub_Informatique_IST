import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { ModuleKey } from '../config/features';
import { FeatureService } from '../config/feature.service';
import { Role, homeRouteFor } from './auth.models';
import { AuthStore } from './auth.store';

/** Réservé aux utilisateurs connectés ; sinon retour à la connexion en conservant la destination. */
export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.isAuthenticated()) return true;
  return router.createUrlTree(['/connexion'], { queryParams: { retour: state.url } });
};

/** Réservé aux visiteurs : un utilisateur connecté est renvoyé vers son espace. */
export const guestGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  return store.isAuthenticated() ? router.createUrlTree(['/espace']) : true;
};

/** Exige l'un des rôles indiqués (hiérarchie des acteurs prise en compte). Le backend reste seul juge des droits. */
export function roleGuard(...roles: Role[]): CanActivateFn {
  return () => {
    const store = inject(AuthStore);
    const router = inject(Router);
    if (store.hasAnyRole(roles)) return true;
    return router.createUrlTree(['/acces-refuse']);
  };
}

/** Une route dont le module est désactivé n'existe pas : le routeur poursuit jusqu'à la page introuvable. */
export function featureGuard(module: ModuleKey): CanMatchFn {
  return () => inject(FeatureService).isEnabled(module);
}

/** Point d'entrée /espace : redirige vers l'accueil propre au rôle le plus élevé. */
export const spaceHomeGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const user = store.user();
  if (!user) return router.createUrlTree(['/connexion'], { queryParams: { retour: '/espace' } });
  return router.createUrlTree([homeRouteFor(user.roles)]);
};
