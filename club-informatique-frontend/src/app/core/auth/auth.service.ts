import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_AUTH } from '../http/http-context';
import { Credentials, SessionResponse } from './auth.models';
import { AuthStore } from './auth.store';

/**
 * Contrat attendu du backend (à confirmer en Phase 2) :
 * - POST /auth/login    : identifiants, renvoie SessionResponse et pose le cookie de rafraîchissement HttpOnly ;
 * - POST /auth/refresh  : sans corps, lit le cookie, renvoie SessionResponse et fait tourner le cookie ;
 * - POST /auth/logout   : révoque le jeton de rafraîchissement et efface le cookie.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AuthStore);
  private readonly base = `${environment.apiBaseUrl}/auth`;
  private refreshInFlight: Observable<boolean> | null = null;

  login(credentials: Credentials): Observable<SessionResponse> {
    return this.http
      .post<SessionResponse>(`${this.base}/login`, credentials, { withCredentials: true, context: skipAuth() })
      .pipe(tap((session) => this.store.setSession(session)));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, null, { withCredentials: true }).pipe(
      catchError(() => of(undefined)),
      finalize(() => this.store.clear()),
    );
  }

  /** Renouvelle la session à partir du cookie. Les appels simultanés partagent une seule requête. */
  refresh(): Observable<boolean> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.http
        .post<SessionResponse>(`${this.base}/refresh`, null, { withCredentials: true, context: skipAuth() })
        .pipe(
          tap((session) => this.store.setSession(session)),
          map(() => true),
          catchError(() => {
            this.store.clear();
            return of(false);
          }),
          finalize(() => (this.refreshInFlight = null)),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }
    return this.refreshInFlight;
  }

  /** Au démarrage : tente de restaurer la session seulement si une session a déjà existé sur cet appareil. */
  restore(): Observable<boolean> {
    return this.store.hadSession() ? this.refresh() : of(false);
  }
}

function skipAuth(): HttpContext {
  return new HttpContext().set(SKIP_AUTH, true);
}
