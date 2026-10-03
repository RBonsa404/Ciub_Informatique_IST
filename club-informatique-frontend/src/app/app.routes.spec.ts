import { Route } from '@angular/router';
import { routes } from './app.routes';

/** Vrai si l'adresse correspond à une route déclarée (segments fixes ou paramètres « :nom »). */
function existe(adresse: string, liste: readonly Route[] = routes, segments = adresse.split('/').filter(Boolean)): boolean {
  return liste.some((route) => {
    if (route.path === '**' || route.redirectTo !== undefined) return false;
    const attendus = (route.path ?? '').split('/').filter(Boolean);
    if (attendus.length > segments.length) return false;
    if (!attendus.every((segment, i) => segment.startsWith(':') || segment === segments[i])) return false;
    const reste = segments.slice(attendus.length);
    if (route.children) return existe(adresse, route.children, reste);
    return reste.length === 0;
  });
}

describe('Routes', () => {
  // Adresses écrites par le serveur dans le champ « lien » des notifications : chacune doit ouvrir une page du site.
  const LIENS_DES_NOTIFICATIONS = ['/espace/projets', '/espace/supports', '/espace/gestion/projets', '/evenements', '/evenements/un-evenement', '/formations/une-formation'];

  it.each(LIENS_DES_NOTIFICATIONS)('le lien de notification %s mène à une page existante', (lien) => {
    expect(existe(lien)).toBe(true);
  });

  it('ne reconnaît pas les anciennes adresses erronées', () => {
    expect(existe('/espace/membre/projets')).toBe(false);
    expect(existe('/espace/membre/supports')).toBe(false);
  });
});
