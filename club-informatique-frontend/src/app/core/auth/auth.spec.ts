import { TestBed } from '@angular/core/testing';
import { CurrentUser, effectiveRoles, homeRouteFor } from './auth.models';
import { AuthStore } from './auth.store';

const user = (roles: CurrentUser['roles']): CurrentUser => ({ id: 1, email: 'a@exemple.invalid', nom: 'Nom', prenom: 'Prénom', roles });

describe('hiérarchie des rôles', () => {
  it('Formateur et Responsable du Club héritent de Membre', () => {
    expect(effectiveRoles(['FORMATEUR']).has('MEMBRE')).toBe(true);
    expect(effectiveRoles(['RESPONSABLE_CLUB']).has('MEMBRE')).toBe(true);
  });

  it('Super Admin hérite d’Administrateur mais pas de Membre', () => {
    const roles = effectiveRoles(['SUPER_ADMIN']);
    expect(roles.has('ADMIN')).toBe(true);
    expect(roles.has('MEMBRE')).toBe(false);
  });

  it('DSI et Administrateur n’héritent d’aucun autre rôle', () => {
    expect([...effectiveRoles(['DSI'])]).toEqual(['DSI']);
    expect([...effectiveRoles(['ADMIN'])]).toEqual(['ADMIN']);
  });

  it('l’accueil de l’espace suit le rôle le plus élevé', () => {
    expect(homeRouteFor(['MEMBRE'])).toBe('/espace/membre');
    expect(homeRouteFor(['MEMBRE', 'FORMATEUR'])).toBe('/espace/formateur');
    expect(homeRouteFor(['RESPONSABLE_CLUB', 'FORMATEUR'])).toBe('/espace/gestion');
    expect(homeRouteFor(['ADMIN'])).toBe('/espace/admin');
    expect(homeRouteFor(['SUPER_ADMIN', 'MEMBRE'])).toBe('/espace/admin');
    expect(homeRouteFor(['DSI'])).toBe('/espace/dsi');
  });
});

describe('AuthStore', () => {
  let store: AuthStore;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    store = TestBed.inject(AuthStore);
  });

  it('ne conserve jamais le jeton d’accès dans un stockage du navigateur', () => {
    store.setSession({ accessToken: 'jeton-secret', expiresIn: 900, utilisateur: user(['MEMBRE']) });

    expect(store.accessToken()).toBe('jeton-secret');
    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
    expect(stored).not.toContain('jeton-secret');
    expect(localStorage.getItem('ci_ist_session')).toBe('1');
  });

  it('expose les initiales, le rôle principal et les droits hérités', () => {
    store.setSession({ accessToken: 't', expiresIn: 900, utilisateur: user(['FORMATEUR', 'MEMBRE']) });

    expect(store.initials()).toBe('PN');
    expect(store.primaryRoleLabel()).toBe('Formateur');
    expect(store.hasAnyRole(['MEMBRE'])).toBe(true);
    expect(store.hasAnyRole(['ADMIN'])).toBe(false);
  });

  it('efface la session et l’indice de session', () => {
    store.setSession({ accessToken: 't', expiresIn: 900, utilisateur: user(['MEMBRE']) });
    store.clear();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.accessToken()).toBeNull();
    expect(store.hadSession()).toBe(false);
  });
});
