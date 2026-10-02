import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError, toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { Button } from '../../shared/ui/button/button';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { InputGroup, PasswordToggle } from '../../shared/ui/field/input-group';
import { Icon } from '../../shared/ui/icon/icon';
import { Checkbox } from '../../shared/ui/toggle/toggle';
import { safeReturnUrl } from './return-url';

/** Connexion (écran 19). */
@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Icon, Field, FieldControl, InputGroup, PasswordToggle, Checkbox],
  styleUrl: './auth.css',
  template: `
    <div class="auth-main halo">
      <svg class="auth-lines" viewBox="0 0 1440 900" aria-hidden="true">
        <path d="M100 150 L350 150 L400 200 L600 200" stroke="#38BDF8" stroke-width="1.5" fill="none" />
        <circle cx="600" cy="200" r="4" fill="#38BDF8" />
        <path d="M800 800 L1000 800 L1100 700 L1300 700" stroke="#38BDF8" stroke-width="1.5" fill="none" />
        <circle cx="1300" cy="700" r="4" fill="#38BDF8" />
        <path d="M900 100 L1100 100 L1150 150 L1400 150" stroke="#FBBF24" stroke-width="1" fill="none" />
      </svg>

      <div class="auth-grid" style="grid-template-columns: 1fr 440px; max-width: 1100px">
        <div>
          <h1 class="auth-title" style="font-size: clamp(2.8rem, 5vw, 4rem)">Bon <span class="accent-amber">retour</span></h1>
          <p class="auth-lead" style="margin-bottom: 2.5rem">Nous sommes ravis de vous revoir.<br />Connectez-vous pour accéder à votre espace.</p>

          <div class="decor-panel auth-decor" aria-hidden="true">
            <app-icon name="monitor" [size]="56" [strokeWidth]="1.5" />
          </div>

          <div aria-live="assertive" style="margin-top: 1.5rem; max-width: 480px">
            @if (notice(); as message) {
              <div class="auth-info" role="status" style="margin-bottom: 1rem">
                <app-icon name="info" [size]="16" />
                <span>{{ message }}</span>
              </div>
            }
            @if (error(); as failure) {
              <div class="auth-alert" role="alert">
                <div class="auth-alert-icon"><app-icon name="alert-circle" [size]="18" /></div>
                <div>
                  <strong>Échec de connexion</strong>
                  <span>{{ failure }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="glass-panel auth-card">
          <div class="auth-avatar solid" aria-hidden="true"><app-icon name="user" [size]="28" /></div>
          <h2 style="font-size: 1.75rem; font-weight: 800; text-align: center; margin-bottom: 2rem">Connexion</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <app-field label="Adresse électronique" [messages]="{ required: 'Saisissez votre adresse électronique.' }">
              <app-input-group icon="mail">
                <input appControl type="email" formControlName="email" autocomplete="username" inputmode="email" />
              </app-input-group>
            </app-field>

            <app-field label="Mot de passe" [messages]="{ required: 'Saisissez votre mot de passe.' }">
              <app-input-group icon="lock" [suffix]="true">
                <input appControl [type]="showPassword() ? 'text' : 'password'" formControlName="motDePasse" autocomplete="current-password" />
                <app-password-toggle suffix [(visible)]="showPassword" />
              </app-input-group>
            </app-field>

            <app-checkbox formControlName="seSouvenir">Se souvenir de moi</app-checkbox>

            <button appBtn size="lg" type="submit" class="auth-submit" style="margin-top: 1rem" [loading]="pending()">
              Se connecter
              <app-icon name="arrow-right" [size]="18" />
            </button>

            <div style="text-align: center; margin-top: 1rem">
              <a routerLink="/mot-de-passe-oublie" class="auth-link">Mot de passe oublié&nbsp;?</a>
            </div>

            <div class="auth-divider"><span>OU</span></div>

            <div style="text-align: center; font-size: 0.9rem; color: var(--text-secondary)">
              Pas encore membre&nbsp;?
              <a routerLink="/inscription" class="accent-amber" style="font-weight: 700">S’inscrire</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    motDePasse: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    seSouvenir: new FormControl(false, { nonNullable: true }),
  });
  protected readonly showPassword = signal(false);
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(NOTICES[this.route.snapshot.queryParamMap.get('motif') ?? ''] ?? null);

  constructor() {
    inject(SeoService).apply({ title: 'Connexion', description: 'Connectez-vous à votre espace du Club Informatique de l’IST.', path: '/connexion' });
  }

  protected submit(): void {
    revealErrors(this.form);
    if (this.form.invalid || this.pending()) return;

    this.pending.set(true);
    this.error.set(null);
    this.notice.set(null);
    const { email, motDePasse, seSouvenir } = this.form.getRawValue();
    this.auth.login({ email: email.trim().toLowerCase(), motDePasse, seSouvenir }).subscribe({
      next: () => void this.router.navigateByUrl(safeReturnUrl(this.route.snapshot.queryParamMap.get('retour'))),
      error: (failure: unknown) => {
        this.pending.set(false);
        this.error.set(messageFor(toApiError(failure)));
      },
    });
  }
}

const NOTICES: Record<string, string> = {
  'session-expiree': 'Votre session a expiré. Veuillez vous reconnecter.',
  'compte-active': 'Votre adresse est vérifiée. Vous pouvez vous connecter.',
  'mot-de-passe-modifie': 'Votre mot de passe a été modifié. Vous pouvez vous connecter.',
};

/** Message identique pour un compte inconnu et un mot de passe erroné : aucune énumération de comptes. */
function messageFor(error: ApiError): string {
  switch (error.kind) {
    case 'unauthorized':
    case 'validation':
      return 'Adresse électronique ou mot de passe incorrect. Veuillez réessayer.';
    case 'rate-limit':
      return 'Trop de tentatives. Réessayez dans quelques minutes.';
    case 'forbidden':
      // Le serveur ne précise l'état du compte qu'à son titulaire, une fois le mot de passe reconnu.
      return REFUS[error.code ?? ''] ?? 'Ce compte n’est pas actif. Contactez le club.';
    case 'network':
      return 'La connexion au service a échoué. Vérifiez votre connexion, puis réessayez.';
    default:
      if (error.status === 423) return 'Ce compte est temporairement verrouillé après plusieurs tentatives. Réessayez plus tard.';
      if (error.status === 503) return 'La plateforme est en maintenance. Réessayez plus tard.';
      return 'Un problème est survenu de notre côté. Réessayez dans quelques instants.';
  }
}

const REFUS: Record<string, string> = {
  ADRESSE_NON_VERIFIEE: 'Votre adresse électronique n’est pas encore vérifiée. Ouvrez le lien reçu par courriel.',
  COMPTE_SUSPENDU: 'Ce compte est suspendu. Contactez le club.',
};
