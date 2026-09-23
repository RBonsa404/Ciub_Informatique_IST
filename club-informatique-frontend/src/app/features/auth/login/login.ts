import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card glass-card">
        <!-- Logo & Header -->
        <div class="auth-header">
          <div class="auth-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <h1 class="auth-title">Connexion à votre Espace</h1>
          <p class="auth-subtitle">Accédez à votre tableau de bord, vos formations et devoirs</p>
        </div>

        @if (requires2FA()) {
          <!-- Étape 2FA TOTP -->
          <form [formGroup]="totpForm" (ngSubmit)="submit2FA()" class="auth-form">
            <div class="two-factor-notice">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <div>
                <strong>Authentification à deux facteurs</strong>
                <p>Entrez le code à 6 chiffres généré par votre application (Google Authenticator, Authy).</p>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="totpCode">Code de vérification (6 chiffres)</label>
              <input
                id="totpCode"
                type="text"
                formControlName="totpCode"
                class="form-control text-center tracking-widest font-mono text-xl"
                maxlength="6"
                placeholder="123456"
                autocomplete="one-time-code"
              />
            </div>

            <button type="submit" class="btn btn-primary w-full" [disabled]="totpForm.invalid || loading()">
              @if (loading()) {
                Vérification...
              } @else {
                Valider & Accéder
              }
            </button>

            <button type="button" class="btn btn-ghost btn-sm w-full mt-2" (click)="requires2FA.set(false)">
              Retour à la saisie des identifiants
            </button>
          </form>
        } @else {
          <!-- Formulaire Login standard -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
            <div class="form-group">
              <label class="form-label" for="email">Adresse E-mail</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-control"
                placeholder="nom.prenom@ist.bf"
              />
              @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
                <span class="form-error">Veuillez entrer une adresse email valide</span>
              }
            </div>

            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="password">Mot de passe</label>
                <a routerLink="/auth/forgot-password" class="forgot-link">Mot de passe oublié ?</a>
              </div>
              <div class="input-password-wrap">
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  class="form-control"
                  placeholder="••••••••"
                />
                <button type="button" class="toggle-pwd-btn" (click)="showPassword.set(!showPassword())" aria-label="Afficher le mot de passe">
                  @if (showPassword()) {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  } @else {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <!-- Role demo switcher buttons for quick testing -->
            <div class="demo-login-box">
              <span class="demo-title">Connexion rapide démo :</span>
              <div class="demo-buttons">
                <button type="button" class="demo-btn" (click)="fillDemo('membre@ist.bf')">Membre</button>
                <button type="button" class="demo-btn" (click)="fillDemo('formateur@ist.bf')">Formateur</button>
                <button type="button" class="demo-btn" (click)="fillDemo('president@ist.bf')">Resp. Club</button>
                <button type="button" class="demo-btn" (click)="fillDemo('admin@ist.bf')">Admin</button>
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-full btn-lg" [disabled]="loginForm.invalid || loading()">
              @if (loading()) {
                Connexion en cours...
              } @else {
                Se Connecter
              }
            </button>
          </form>
        }

        <div class="auth-footer">
          <p>
            Vous n'avez pas encore de compte ?
            <a routerLink="/auth/register" class="register-link">Rejoindre le Club</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 140px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      background: radial-gradient(circle at 50% 30%, rgba(27, 58, 140, 0.12) 0%, transparent 60%);
    }
    .auth-card {
      width: 100%;
      max-width: 480px;
      padding: 2.5rem;
      border-radius: 24px;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-logo {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      background: var(--accent-gradient);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      box-shadow: 0 4px 14px rgba(27, 58, 140, 0.4);
    }
    .auth-title {
      font-size: 1.6rem;
      font-weight: 800;
      margin-bottom: 0.35rem;
    }
    .auth-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .forgot-link {
      font-size: 0.8rem;
      color: var(--color-bleu-royal);
    }
    [data-theme="dark"] .forgot-link {
      color: var(--color-amber-tech);
    }
    .input-password-wrap {
      position: relative;
    }
    .toggle-pwd-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.25rem;
    }
    .two-factor-notice {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      background: rgba(245, 166, 35, 0.1);
      border: 1px solid rgba(245, 166, 35, 0.2);
      color: var(--color-amber-tech-dark);
      font-size: 0.85rem;
    }
    [data-theme="dark"] .two-factor-notice {
      color: var(--color-amber-tech);
    }
    .demo-login-box {
      padding: 0.85rem;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.02);
      border: 1px dashed var(--border-color);
    }
    .demo-title {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: block;
      margin-bottom: 0.4rem;
      font-weight: 600;
    }
    .demo-buttons {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .demo-btn {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }
    .demo-btn:hover {
      border-color: var(--color-bleu-royal);
      color: var(--color-bleu-royal);
    }
    .w-full { width: 100%; }
    .mt-2 { margin-top: 0.5rem; }
    .auth-footer {
      margin-top: 1.75rem;
      text-align: center;
      font-size: 0.88rem;
      color: var(--text-secondary);
      border-top: 1px solid var(--border-color);
      padding-top: 1.25rem;
    }
    .register-link {
      font-weight: 600;
      color: var(--color-bleu-royal);
    }
    [data-theme="dark"] .register-link {
      color: var(--color-amber-tech);
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly requires2FA = signal(false);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['etudiant@ist.bf', [Validators.required, Validators.email]],
    password: ['Password123!', [Validators.required, Validators.minLength(6)]]
  });

  readonly totpForm: FormGroup = this.fb.group({
    totpCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  fillDemo(email: string): void {
    this.loginForm.patchValue({ email, password: 'Password123!' });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    const { email, password } = this.loginForm.value;

    this.auth.login({ email, password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(`Bienvenue, ${res.user.prenom} !`);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/membre/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.requires2FA) {
          this.requires2FA.set(true);
        } else {
          this.toast.error('Identifiants incorrects ou compte inactif.');
        }
      }
    });
  }

  submit2FA(): void {
    if (this.totpForm.invalid) return;

    this.loading.set(true);
    const { email, password } = this.loginForm.value;
    const { totpCode } = this.totpForm.value;

    this.auth.login({ email, password, totpCode }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(`Code 2FA validé. Bienvenue, ${res.user.prenom} !`);
        this.router.navigate(['/membre/dashboard']);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Code TOTP invalide ou expiré.');
      }
    });
  }
}
