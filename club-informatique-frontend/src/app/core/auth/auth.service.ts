import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SILENT_ERRORS, SKIP_AUTH } from '../http/http-context';
import { Credentials, ROLES, Role, SessionResponse } from './auth.models';
import { AuthStore } from './auth.store';

export interface RegistrationPayload {
  readonly nom: string;
  readonly prenom: string;
  readonly email: string;
  readonly filiere: string;
  readonly motDePasse: string;
  readonly consentement: boolean;
}

export interface RegistrationResult {
  /** Vrai : un courriel de vérification a été envoyé, le compte doit être activé avant la connexion. */
  readonly verificationRequise: boolean;
}

/**
 * Contrat cible du backend (docs/besoins-backend.md) :
 * - POST /auth/login        : identifiants ; renvoie SessionResponse et pose le cookie de rafraîchissement HttpOnly ;
 * - POST /auth/refresh      : sans corps, lit le cookie, renvoie SessionResponse et fait tourner le cookie ;
 * - POST /auth/logout       : révoque le jeton de rafraîchissement et efface le cookie ;
 * - POST /auth/register     : crée le compte et envoie le courriel de vérification ;
 * - POST /auth/verification : active le compte à partir du jeton reçu par courriel ;
 * - POST /auth/forgot-password, POST /auth/reset-password.
 *
 * Transition : le backend existant renvoie encore le jeton de rafraîchissement dans le corps de la réponse.
 * Il est alors conservé en mémoire uniquement (jamais dans un stockage du navigateur) : la session ne survit
 * pas à un rechargement tant que le cookie n'est pas en place. Cette adaptation disparaît avec la reprise du backend.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AuthStore);
  private readonly base = `${environment.apiBaseUrl}/auth`;
  private refreshInFlight: Observable<boolean> | null = null;
  private legacyRefreshToken: string | null = null;

  login(credentials: Credentials & { seSouvenir?: boolean }): Observable<SessionResponse> {
    return this.http.post<unknown>(`${this.base}/login`, credentials, { withCredentials: true, context: skipAuth() }).pipe(
      map((raw) => this.accept(raw)),
    );
  }

  register(payload: RegistrationPayload): Observable<RegistrationResult> {
    return this.http.post<unknown>(`${this.base}/register`, payload, { withCredentials: true, context: skipAuth() }).pipe(
      map((raw) => {
        if (isRecord(raw) && typeof raw['accessToken'] === 'string') {
          this.accept(raw);
          return { verificationRequise: false };
        }
        return { verificationRequise: true };
      }),
    );
  }

  verifyEmail(jeton: string): Observable<void> {
    return this.http.post<void>(`${this.base}/verification`, { jeton }, { context: skipAuth() });
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<unknown>(`${this.base}/forgot-password`, { email }, { context: skipAuth() }).pipe(map(() => undefined));
  }

  resetPassword(token: string, nouveauMotDePasse: string): Observable<void> {
    return this.http.post<unknown>(`${this.base}/reset-password`, { token, nouveauMotDePasse }, { context: skipAuth() }).pipe(map(() => undefined));
  }

  logout(): Observable<void> {
    return this.http.post<unknown>(`${this.base}/logout`, null, { withCredentials: true }).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      finalize(() => {
        this.legacyRefreshToken = null;
        this.store.clear();
      }),
    );
  }

  /** Renouvelle la session. Les appels simultanés partagent une seule requête. */
  refresh(): Observable<boolean> {
    if (!this.refreshInFlight) {
      const body = this.legacyRefreshToken ? { refreshToken: this.legacyRefreshToken } : null;
      this.refreshInFlight = this.http.post<unknown>(`${this.base}/refresh`, body, { withCredentials: true, context: skipAuth().set(SILENT_ERRORS, true) }).pipe(
        map((raw) => {
          this.accept(raw);
          return true;
        }),
        catchError(() => {
          this.legacyRefreshToken = null;
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

  private accept(raw: unknown): SessionResponse {
    const session = toSession(raw);
    if (isRecord(raw) && typeof raw['refreshToken'] === 'string') this.legacyRefreshToken = raw['refreshToken'];
    this.store.setSession(session);
    return session;
  }
}

function skipAuth(): HttpContext {
  return new HttpContext().set(SKIP_AUTH, true);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Accepte le contrat cible ({ utilisateur }) et la réponse du backend existant (champs à plat, rôles préfixés). */
export function toSession(raw: unknown): SessionResponse {
  if (!isRecord(raw) || typeof raw['accessToken'] !== 'string') throw new Error('Réponse d’authentification invalide');
  const source = isRecord(raw['utilisateur']) ? raw['utilisateur'] : raw;
  const roles = (Array.isArray(source['roles']) ? source['roles'] : [])
    .map((role) => String(role).replace(/^ROLE_/, ''))
    .filter((role): role is Role => (ROLES as readonly string[]).includes(role));
  return {
    accessToken: raw['accessToken'],
    expiresIn: Number(raw['expiresIn'] ?? 0),
    utilisateur: {
      id: Number(source['id'] ?? source['userId'] ?? 0),
      email: String(source['email'] ?? ''),
      nom: String(source['nom'] ?? ''),
      prenom: String(source['prenom'] ?? ''),
      roles,
      changementMotDePasseRequis: source['changementMotDePasseRequis'] === true,
    },
  };
}
