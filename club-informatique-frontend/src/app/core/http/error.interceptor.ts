import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { SILENT_ERRORS } from './http-context';
import { toApiError } from './problem';

/**
 * Convertit toute erreur HTTP en ApiError typée. Les pannes de réseau, les erreurs serveur et les dépassements
 * de débit donnent lieu à une notification ; les autres erreurs sont restituées par la zone qui a émis la requête.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toasts = inject(ToastService);
  return next(req).pipe(
    catchError((error: unknown) => {
      const apiError = toApiError(error);
      const notify = apiError.kind === 'server' || apiError.kind === 'rate-limit';
      if (notify && !req.context.get(SILENT_ERRORS)) {
        toasts.danger(apiError.userMessage);
      }
      return throwError(() => apiError);
    }),
  );
};
