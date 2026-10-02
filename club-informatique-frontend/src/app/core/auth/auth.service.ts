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
 * Session : le jeton d'accès vit en mémoire ; le jeton de rafraîchissement voyage dans un cookie HttpOnly
 * que le serveur pose à la connexion et remplace à chaque renouvellement. Aucun jeton n'est écrit dans un stockage du navigateur.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AuthStore);
  private readonly base = `${environment.apiBaseUrl}/auth`;
  private refreshInFlight: Observable<boolean> | null = null;

  login(credentials: Credentials & { seSouvenir?: boolean }): Observable<SessionResponse> {
    return this.http.post<unknown>(`${this.base}/login`, credentials, { withCredentials: true, context: skipAuth() }).pipe(
      map((raw) => this.accept(raw)),
    );
  }

  register(payload: RegistrationPayload): Observable<RegistrationResult> {
    return this.http.post<unknown>(`${this.base}/register`, payload, { withCredentials: true, context: skipAuth() }).pipe(
      map(() => ({ verificationRequise: true })),
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
      finalize(() => this.store.clear()),
    );
  }

  /** Renouvelle la session. Les appels simultanés partagent une seule requête. */
  refresh(): Observable<boolean> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.http.post<unknown>(`${this.base}/refresh`, null, { withCredentials: true, context: skipAuth().set(SILENT_ERRORS, true) }).pipe(
        map((raw) => {
          this.accept(raw);
          return true;
        }),
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

  private accept(raw: unknown): SessionResponse {
    const session = toSession(raw);
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

/** Lit la réponse de session ; un rôle inconnu de l'application est ignoré. */
export function toSession(raw: unknown): SessionResponse {
  if (!isRecord(raw) || typeof raw['accessToken'] !== 'string' || !isRecord(raw['utilisateur'])) throw new Error('Réponse d’authentification invalide');
  const source = raw['utilisateur'];
  const roles = (Array.isArray(source['roles']) ? source['roles'] : []).filter((role): role is Role => (ROLES as readonly string[]).includes(String(role)));
  return {
    accessToken: raw['accessToken'],
    expiresIn: Number(raw['expiresIn'] ?? 0),
    utilisateur: {
      id: Number(source['id'] ?? 0),
      email: String(source['email'] ?? ''),
      nom: String(source['nom'] ?? ''),
      prenom: String(source['prenom'] ?? ''),
      roles,
      changementMotDePasseRequis: source['changementMotDePasseRequis'] === true,
    },
  };
}
