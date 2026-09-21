import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorNotificationService } from '../services/error-notification.service';

/**
 * Intercepte toutes les erreurs HTTP et les transforme en message lisible,
 * en s'appuyant sur le format ErrorResponse homogène renvoyé par l'API
 * (voir backend GlobalExceptionHandler). Gère explicitement succès /
 * chargement / erreur côté UX comme l'exige la Definition of Done
 * (section 4.6 du document de dispatch).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifier = inject(ErrorNotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiMessage = error.error?.message as string | undefined;

      if (error.status === 0) {
        notifier.show('Impossible de contacter le serveur. Vérifiez votre connexion.');
      } else if (error.status === 401) {
        notifier.show('Session expirée, veuillez vous reconnecter.', 401);
      } else if (error.status === 403) {
        notifier.show("Vous n'avez pas les droits nécessaires pour cette action.", 403);
      } else {
        notifier.show(apiMessage ?? 'Une erreur inattendue est survenue.', error.status);
      }

      return throwError(() => error);
    }),
  );
};
