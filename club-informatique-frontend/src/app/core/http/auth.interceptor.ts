import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../auth/auth.store';
import { SKIP_AUTH } from './http-context';

/**
 * Ajoute le jeton d'accès aux appels d'API. Sur une réponse 401, tente un rafraîchissement unique
 * puis rejoue la requête ; en cas d'échec, la session est fermée et l'utilisateur renvoyé à la connexion.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl) || req.context.get(SKIP_AUTH)) {
    return next(req);
  }

  const store = inject(AuthStore);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(withToken(req, store.accessToken())).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !store.hadSession()) {
        return throwError(() => error);
      }
      return auth.refresh().pipe(
        switchMap((renewed) => {
          if (renewed) return next(withToken(req, store.accessToken()));
          void router.navigate(['/connexion'], {
            queryParams: { motif: 'session-expiree', retour: router.url },
          });
          return throwError(() => error);
        }),
      );
    }),
  );
};

function withToken<T>(req: HttpRequest<T>, token: string | null): HttpRequest<T> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}
