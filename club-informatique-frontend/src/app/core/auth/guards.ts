import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, CanMatchFn, Router } from '@angular/router';
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

export const FORCED_PASSWORD_ROUTE = '/espace/mot-de-passe';

/**
 * Changement de mot de passe imposé : tant qu'il n'est pas fait, toute page de l'espace renvoie vers la page de choix
 * du mot de passe ; une fois fait, cette page n'est plus accessible.
 */
export const passwordChangeGuard: CanActivateChildFn = (_route, state) => {
  const required = inject(AuthStore).user()?.changementMotDePasseRequis === true;
  const onPage = state.url.split('?')[0] === FORCED_PASSWORD_ROUTE;
  if (required && !onPage) return inject(Router).createUrlTree([FORCED_PASSWORD_ROUTE]);
  if (!required && onPage) return inject(Router).createUrlTree(['/espace']);
  return true;
};

/** Point d'entrée /espace : redirige vers l'accueil propre au rôle le plus élevé. */
export const spaceHomeGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const user = store.user();
  if (!user) return router.createUrlTree(['/connexion'], { queryParams: { retour: '/espace' } });
  if (user.changementMotDePasseRequis) return router.createUrlTree([FORCED_PASSWORD_ROUTE]);
  return router.createUrlTree([homeRouteFor(user.roles)]);
};
