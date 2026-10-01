import { TestBed } from '@angular/core/testing';
import { CurrentUser } from '../auth/auth.models';
import { AuthStore } from '../auth/auth.store';
import { FeatureService } from '../config/feature.service';
import { ModuleKey } from '../config/features';
import { NavigationService } from './navigation.service';

function setup(enabled: readonly ModuleKey[] | 'all') {
  const features = { isEnabled: (module: ModuleKey) => enabled === 'all' || enabled.includes(module) };
  TestBed.configureTestingModule({ providers: [{ provide: FeatureService, useValue: features }] });
  return { nav: TestBed.inject(NavigationService), store: TestBed.inject(AuthStore) };
}

const session = (roles: CurrentUser['roles']) => ({
  accessToken: 't',
  expiresIn: 900,
  utilisateur: { id: 1, email: 'a@exemple.invalid', nom: 'Nom', prenom: 'Prénom', roles },
});

const routes = (nav: NavigationService) => nav.space().flatMap((section) => section.entries.map((entry) => entry.route));

describe('politique de visibilité de la navigation', () => {
  beforeEach(() => localStorage.clear());

  it('n’affiche aucune entrée publique quand aucun module n’est opérationnel', () => {
    const { nav } = setup([]);
    expect(nav.publicHeader()).toEqual([]);
    expect(nav.publicFooter()).toEqual([]);
  });

  it('n’affiche que les entrées publiques dont le module est opérationnel', () => {
    const { nav } = setup(['evenements', 'contact']);
    expect(nav.publicHeader().map((entry) => entry.label)).toEqual(['Événements', 'Contact']);
  });

  it('n’affiche aucune entrée d’espace à un visiteur', () => {
    const { nav } = setup('all');
    expect(nav.space()).toEqual([]);
  });

  it('limite un Membre à son espace et à son compte', () => {
    const { nav, store } = setup('all');
    store.setSession(session(['MEMBRE']));

    const visible = routes(nav);
    expect(visible).toContain('/espace/membre');
    expect(visible).toContain('/espace/profil');
    expect(visible.some((route) => route.startsWith('/espace/admin'))).toBe(false);
    expect(visible.some((route) => route.startsWith('/espace/gestion'))).toBe(false);
    expect(visible.some((route) => route.startsWith('/espace/formateur'))).toBe(false);
    expect(visible).not.toContain('/espace/systeme');
    expect(visible).not.toContain('/espace/dsi');
  });

  it('donne au Formateur son espace en plus de celui du Membre', () => {
    const { nav, store } = setup('all');
    store.setSession(session(['FORMATEUR']));

    const visible = routes(nav);
    expect(visible).toContain('/espace/formateur/cours');
    expect(visible).toContain('/espace/membre');
  });

  it('réserve la configuration système au Super Admin, qui hérite de l’administration', () => {
    const { nav, store } = setup('all');
    store.setSession(session(['ADMIN']));
    expect(routes(nav)).not.toContain('/espace/systeme');

    store.setSession(session(['SUPER_ADMIN']));
    const visible = routes(nav);
    expect(visible).toContain('/espace/systeme');
    expect(visible).toContain('/espace/admin/utilisateurs');
    expect(visible).not.toContain('/espace/membre');
  });

  it('limite la DSI à la supervision et à son compte', () => {
    const { nav, store } = setup('all');
    store.setSession(session(['DSI']));

    const visible = routes(nav);
    expect(visible).toContain('/espace/dsi');
    expect(visible.filter((route) => !['/espace/dsi', '/espace/notifications', '/espace/profil', '/espace/parametres'].includes(route))).toEqual([]);
  });

  it('masque une entrée autorisée par le rôle si son module n’est pas opérationnel', () => {
    const { nav, store } = setup(['inscriptions']);
    store.setSession(session(['MEMBRE']));

    expect(routes(nav)).toEqual(['/espace/membre', '/espace/inscriptions']);
  });

  it('ouvre les messages de contact à l’Administrateur et au Responsable du Club', () => {
    const { nav, store } = setup('all');
    store.setSession(session(['RESPONSABLE_CLUB']));
    expect(routes(nav)).toContain('/espace/admin/messages');
    expect(routes(nav)).not.toContain('/espace/admin/utilisateurs');
  });
});
