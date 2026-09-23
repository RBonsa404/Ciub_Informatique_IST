import { Injectable, signal, computed } from '@angular/core';

const ACCESS_TOKEN_KEY = 'ci_access_token';
const REFRESH_TOKEN_KEY = 'ci_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly _accessToken = signal<string | null>(this.getStoredToken(ACCESS_TOKEN_KEY));
  readonly accessToken = this._accessToken.asReadonly();
  readonly isAuthenticated = computed(() => !!this._accessToken() && !this.isTokenExpired());

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    this._accessToken.set(accessToken);
  }

  getAccessToken(): string | null {
    return this._accessToken();
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this._accessToken.set(null);
  }

  getTokenPayload(): Record<string, unknown> | null {
    const token = this._accessToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  isTokenExpired(): boolean {
    const payload = this.getTokenPayload();
    if (!payload || !payload['exp']) return true;
    const exp = payload['exp'] as number;
    return Date.now() >= exp * 1000;
  }

  getUserRoles(): string[] {
    const payload = this.getTokenPayload();
    if (!payload) return [];
    return (payload['roles'] as string[]) || [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getUserRoles();
    return roles.some(role => userRoles.includes(role));
  }

  private getStoredToken(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  }
}
