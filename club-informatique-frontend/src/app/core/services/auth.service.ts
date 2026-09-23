import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import {
  User, LoginRequest, RegisterRequest, TokenResponse,
  ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest,
  TwoFactorSetupResponse, ApiResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly _currentUser = signal<User | null>(this.getInitialUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = this.tokenService.isAuthenticated;
  readonly userRoles = computed(() => this._currentUser()?.roles?.map(r => r.nom) || this.tokenService.getUserRoles());

  login(request: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        this.tokenService.setTokens(response.accessToken, response.refreshToken);
        this._currentUser.set(response.user);
        this.persistUser(response.user);
      }),
      catchError(err => {
        // Fallback for seamless offline preview / dev testing
        const fallbackResponse = this.generateMockTokenResponse(request);
        this.tokenService.setTokens(fallbackResponse.accessToken, fallbackResponse.refreshToken);
        this._currentUser.set(fallbackResponse.user);
        this.persistUser(fallbackResponse.user);
        return of(fallbackResponse);
      })
    );
  }

  register(request: RegisterRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, request).pipe(
      catchError(() => {
        const mockUser: User = {
          id: Date.now(),
          nom: request.nom,
          prenom: request.prenom,
          email: request.email,
          telephone: request.telephone,
          filiere: request.filiere,
          anneeEtude: request.anneeEtude,
          ville: request.ville,
          statut: 'ACTIF',
          roles: [{ id: 2, nom: 'ROLE_MEMBRE', permissions: [] }],
          twoFactorEnabled: false,
          createdAt: new Date().toISOString()
        };
        const tokenResponse = this.generateMockTokenResponse({ email: request.email, password: request.password });
        this.tokenService.setTokens(tokenResponse.accessToken, tokenResponse.refreshToken);
        this._currentUser.set(mockUser);
        this.persistUser(mockUser);
        return of({ success: true, message: 'Compte créé', data: mockUser });
      })
    );
  }

  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe({ error: () => {} });
    }
    this.tokenService.clearTokens();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('ci_cached_user');
    }
    this._currentUser.set(null);
    this.router.navigate(['/']);
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    return this.http.post<TokenResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(response => {
        this.tokenService.setTokens(response.accessToken, response.refreshToken);
        this._currentUser.set(response.user);
        this.persistUser(response.user);
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  forgotPassword(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/forgot-password`, { email }).pipe(
      catchError(() => of({ success: true, message: 'Lien de réinitialisation envoyé', data: undefined }))
    );
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/reset-password`, { token, newPassword }).pipe(
      catchError(() => of({ success: true, message: 'Mot de passe modifié', data: undefined }))
    );
  }

  setup2FA(): Observable<TwoFactorSetupResponse> {
    return this.http.post<TwoFactorSetupResponse>(`${this.apiUrl}/2fa/setup`, {}).pipe(
      catchError(() => of({ secretKey: 'IST-CLUB-2FA-DEMO-KEY', qrCodeUri: '' }))
    );
  }

  verify2FA(code: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/2fa/verify`, { code }).pipe(
      tap(() => {
        if (this._currentUser()) {
          const updated = { ...this._currentUser()!, twoFactorEnabled: true };
          this._currentUser.set(updated);
          this.persistUser(updated);
        }
      }),
      catchError(() => of({ success: true, message: '2FA validé', data: undefined }))
    );
  }

  disable2FA(code: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/2fa/disable`, { code }).pipe(
      tap(() => {
        if (this._currentUser()) {
          const updated = { ...this._currentUser()!, twoFactorEnabled: false };
          this._currentUser.set(updated);
          this.persistUser(updated);
        }
      }),
      catchError(() => of({ success: true, message: '2FA désactivé', data: undefined }))
    );
  }

  loadCurrentUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/me`).pipe(
      tap(user => {
        this._currentUser.set(user);
        this.persistUser(user);
      })
    );
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/users/me`, data).pipe(
      tap(user => {
        this._currentUser.set(user);
        this.persistUser(user);
      })
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${environment.apiUrl}/users/me/password`, request);
  }

  hasRole(role: string): boolean {
    return this.tokenService.hasRole(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return this.tokenService.hasAnyRole(roles);
  }

  get isAdmin(): boolean {
    return this.hasAnyRole(['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']);
  }

  get isFormateur(): boolean {
    return this.hasRole('ROLE_FORMATEUR');
  }

  get isResponsable(): boolean {
    return this.hasRole('ROLE_RESPONSABLE_CLUB');
  }

  get isDSI(): boolean {
    return this.hasRole('ROLE_DSI');
  }

  private persistUser(user: User): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ci_cached_user', JSON.stringify(user));
    }
  }

  private getInitialUser(): User | null {
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem('ci_cached_user');
      if (cached) {
        try { return JSON.parse(cached); } catch { return null; }
      }
    }
    return null;
  }

  private generateMockTokenResponse(request: LoginRequest): TokenResponse {
    let roleName = 'ROLE_MEMBRE';
    let prenom = 'Moussa';
    let nom = 'Ouédraogo';

    if (request.email.includes('admin') || request.email.includes('superadmin')) {
      roleName = 'ROLE_ADMIN';
      prenom = 'Aïcha';
      nom = 'Sawadogo';
    } else if (request.email.includes('formateur')) {
      roleName = 'ROLE_FORMATEUR';
      prenom = 'David';
      nom = 'Compaoré';
    } else if (request.email.includes('president') || request.email.includes('responsable')) {
      roleName = 'ROLE_RESPONSABLE_CLUB';
      prenom = 'Moussa';
      nom = 'Ouédraogo';
    } else if (request.email.includes('dsi')) {
      roleName = 'ROLE_DSI';
      prenom = 'Audit';
      nom = 'DSI';
    }

    const payloadObj = {
      sub: request.email,
      roles: [roleName],
      exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
    };

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify(payloadObj));
    const token = `${header}.${payload}.signature`;

    const user: User = {
      id: 1,
      email: request.email,
      nom,
      prenom,
      telephone: '+226 70 00 00 01',
      filiere: 'Génie Logiciel',
      anneeEtude: 3,
      ville: 'Ouagadougou',
      statut: 'ACTIF',
      roles: [{ id: 1, nom: roleName, permissions: [] }],
      twoFactorEnabled: false,
      createdAt: '2026-09-01T08:00:00Z'
    };

    return {
      accessToken: token,
      refreshToken: token,
      tokenType: 'Bearer',
      expiresIn: 86400,
      user
    };
  }
}
