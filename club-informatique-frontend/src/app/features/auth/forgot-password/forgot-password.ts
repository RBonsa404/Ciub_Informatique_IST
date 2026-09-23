import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card glass-card">
        <div class="auth-header">
          <div class="auth-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 class="auth-title">Mot de passe oublié</h1>
          <p class="auth-subtitle">Saisissez votre e-mail pour recevoir un lien sécurisé de réinitialisation</p>
        </div>

        @if (emailSent()) {
          <div class="success-notice glass-card">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <h3>Lien de réinitialisation expédié !</h3>
            <p>
              Un e-mail contenant les instructions a été envoyé à <strong>{{ sentEmail }}</strong>. Vérifiez votre boîte de réception (et vos spams).
            </p>
            <a routerLink="/auth/login" class="btn btn-primary mt-4">Retour à la connexion</a>
          </div>
        } @else {
          <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="auth-form">
            <div class="form-group">
              <label class="form-label" for="email">Adresse E-mail du compte</label>
              <input id="email" type="email" formControlName="email" class="form-control" placeholder="etudiant@ist.bf" />
              @if (forgotForm.get('email')?.touched && forgotForm.get('email')?.invalid) {
                <span class="form-error">Veuillez renseigner un e-mail valide</span>
              }
            </div>

            <button type="submit" class="btn btn-primary w-full btn-lg mt-2" [disabled]="forgotForm.invalid || loading()">
              @if (loading()) {
                Envoi du lien...
              } @else {
                Envoyer le lien de réinitialisation
              }
            </button>
          </form>

          <div class="auth-footer">
            <a routerLink="/auth/login" class="login-link">
              ← Retour à la page de connexion
            </a>
          </div>
        }
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
    .success-notice {
      padding: 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--color-success);
    }
    .success-notice h3 { margin: 1rem 0 0.5rem; font-size: 1.25rem; color: var(--text-primary); }
    .success-notice p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; }
    .w-full { width: 100%; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-4 { margin-top: 1rem; }
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
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly emailSent = signal(false);
  sentEmail = '';

  readonly forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit(): void {
    if (this.forgotForm.invalid) return;

    this.loading.set(true);
    const email = this.forgotForm.value.email;

    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.sentEmail = email;
        this.emailSent.set(true);
        this.toast.success('Lien envoyé par e-mail !');
      },
      error: () => {
        this.loading.set(false);
        this.sentEmail = email;
        this.emailSent.set(true);
        this.toast.success('Lien envoyé par e-mail ! (Simulation)');
      }
    });
  }
}
