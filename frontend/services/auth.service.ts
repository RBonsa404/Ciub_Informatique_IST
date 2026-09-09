import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginResponse, UserSummary } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:9000/api/v1/auth';

  private readonly TOKEN_KEY = 'clubinfo_jwt_token';
  private readonly USER_KEY = 'clubinfo_current_user';

  currentUser = signal<UserSummary | null>(this.getStoredUser());

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(credentials: { email: string; motDePasse: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (!res.requires2FA && res.accessToken && res.user) {
          this.setSession(res.accessToken, res.user);
        }
      })
    );
  }

  verify2FA(tempToken: string, code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/2fa/verify`, { tempToken, code }).pipe(
      tap(res => {
        if (res.accessToken && res.user) {
          this.setSession(res.accessToken, res.user);
        }
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/password/forgot`, { email });
  }

  resetPassword(token: string, nouveauMotDePasse: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/password/reset`, { token, nouveauMotDePasse });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    if (!user || !user.roles) return false;
    const formatted = role.startsWith('ROLE_') ? role : 'ROLE_' + role;
    return user.roles.includes(formatted);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  private setSession(token: string, user: UserSummary): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private getStoredUser(): UserSummary | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}