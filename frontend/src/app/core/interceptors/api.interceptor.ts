import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Préfixe automatiquement les requêtes relatives (ex. 'evenements') avec
 * l'URL de base de l'API (environment.apiUrl), et prépare l'ajout du
 * jeton d'authentification une fois le module auth (PAMOUSSO) branché.
 *
 * Squelette transverse -- OUARE, cf. section 2.6.3 du document de dispatch.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const isAbsolute = /^https?:\/\//i.test(req.url);
  const apiReq = isAbsolute
    ? req
    : req.clone({ url: `${environment.apiUrl}/${req.url.replace(/^\//, '')}` });

  // TODO (PAMOUSSO) : ajouter l'en-tête Authorization: Bearer <token> ici
  // une fois le service d'authentification disponible (core/auth).

  return next(apiReq);
};
