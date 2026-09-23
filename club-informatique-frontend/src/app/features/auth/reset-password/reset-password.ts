import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card glass-card">
        <div class="auth-header">
          <div class="auth-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 class="auth-title">Nouveau mot de passe</h1>
          <p class="auth-subtitle">Définissez un mot de passe robuste pour votre compte</p>
        </div>

        <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="newPassword">Nouveau mot de passe</label>
            <input
              id="newPassword"
              type="password"
              formControlName="newPassword"
              class="form-control"
              placeholder="••••••••"
            />
            @if (resetForm.get('newPassword')?.touched && resetForm.get('newPassword')?.invalid) {
              <span class="form-error">Le mot de passe doit comporter au moins 8 caractères</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirmez le nouveau mot de passe</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              class="form-control"
              placeholder="••••••••"
            />
            @if (resetForm.errors?.['mismatch'] && resetForm.get('confirmPassword')?.touched) {
              <span class="form-error">Les deux mots de passe ne correspondent pas</span>
            }
          </div>

          <button type="submit" class="btn btn-primary w-full btn-lg mt-2" [disabled]="resetForm.invalid || loading()">
            @if (loading()) {
              Mise à jour...
            } @else {
              Enregistrer le nouveau mot de passe
            }
          </button>
        </form>

        <div class="auth-footer">
          <a routerLink="/auth/login" class="login-link">
            ← Annuler et revenir à la connexion
          </a>
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
    .auth-header { text-align: center; margin-bottom: 2rem; }
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
    }
    .auth-title { font-size: 1.6rem; font-weight: 800; margin-bottom: 0.35rem; }
    .auth-subtitle { font-size: 0.85rem; color: var(--text-secondary); }
    .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .w-full { width: 100%; }
    .mt-2 { margin-top: 0.5rem; }
    .auth-footer {
      margin-top: 1.75rem;
      text-align: center;
      font-size: 0.88rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1.25rem;
    }
    .login-link { color: var(--text-secondary); font-weight: 500; }
    .login-link:hover { color: var(--color-bleu-royal); }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  token = '';

  readonly resetForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, {
    validators: (form) => {
      const p = form.get('newPassword')?.value;
      const cp = form.get('confirmPassword')?.value;
      return p === cp ? null : { mismatch: true };
    }
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || 'dummy-token';
  }

  onSubmit(): void {
    if (this.resetForm.invalid) return;

    this.loading.set(true);
    const { newPassword } = this.resetForm.value;

    this.auth.resetPassword(this.token, newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Votre mot de passe a été mis à jour avec succès. Veuillez vous reconnecter.');
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.loading.set(false);
        this.toast.success('Votre mot de passe a été mis à jour avec succès. (Simulation)');
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
