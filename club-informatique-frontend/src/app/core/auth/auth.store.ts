import { Injectable, computed, signal } from '@angular/core';
import { CurrentUser, ROLE_LABELS, ROLE_PRIORITY, Role, SessionResponse, effectiveRoles } from './auth.models';

/** Indice non sensible signalant qu'une session a existé : évite un appel de rafraîchissement inutile pour un visiteur. */
const SESSION_HINT_KEY = 'ci_ist_session';

/** État d'authentification. Le jeton d'accès n'est conservé qu'en mémoire, jamais dans un stockage du navigateur. */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly token = signal<string | null>(null);
  private readonly currentUser = signal<CurrentUser | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly roles = computed(() => effectiveRoles(this.currentUser()?.roles ?? []));
  readonly primaryRole = computed<Role | null>(() => {
    const roles = this.currentUser()?.roles ?? [];
    return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
  });
  readonly primaryRoleLabel = computed(() => {
    const role = this.primaryRole();
    return role ? ROLE_LABELS[role] : '';
  });
  readonly initials = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
  });

  accessToken(): string | null {
    return this.token();
  }

  hasAnyRole(required: readonly Role[]): boolean {
    if (required.length === 0) return this.isAuthenticated();
    const roles = this.roles();
    return required.some((role) => roles.has(role));
  }

  /** remember = false : session de recette interne, sans indice persistant. */
  setSession(session: SessionResponse, remember = true): void {
    this.token.set(session.accessToken);
    this.currentUser.set(session.utilisateur);
    if (remember) this.writeHint(true);
  }

  /** Répercute sur la session en cours une modification du profil ou la levée du changement de mot de passe imposé. */
  patchUser(changes: Partial<Pick<CurrentUser, 'nom' | 'prenom' | 'changementMotDePasseRequis'>>): void {
    this.currentUser.update((user) => (user ? { ...user, ...changes } : user));
  }

  clear(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.writeHint(false);
  }

  hadSession(): boolean {
    try {
      return localStorage.getItem(SESSION_HINT_KEY) === '1';
    } catch {
      return false;
    }
  }

  private writeHint(active: boolean): void {
    try {
      if (active) localStorage.setItem(SESSION_HINT_KEY, '1');
      else localStorage.removeItem(SESSION_HINT_KEY);
    } catch {
      // Stockage indisponible : sans conséquence, la session reste portée par le cookie.
    }
  }
}
