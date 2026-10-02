import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PASSWORD_POLICY_MESSAGE, matchValidator, normalizeSpaces, passwordPolicyValidator } from '../../core/auth/password-policy';
import { ApiError, toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { Button } from '../../shared/ui/button/button';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { InputGroup, PasswordToggle } from '../../shared/ui/field/input-group';
import { Icon } from '../../shared/ui/icon/icon';
import { Checkbox } from '../../shared/ui/toggle/toggle';

const NAME_MAX = 100;
const FILIERE_MAX = 100;

/** Inscription (écran 18). La filière est une saisie libre, normalisée, jamais une liste. */
@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Icon, Field, FieldControl, InputGroup, PasswordToggle, Checkbox],
  styleUrl: './auth.css',
  styles: `
    .brand-col {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .logo-ring {
      width: 140px;
      height: 140px;
      background: #fff;
      border: 2px solid rgba(56, 189, 248, 0.4);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      box-shadow: 0 0 35px rgba(56, 189, 248, 0.25);
      overflow: hidden;
    }
    .register-card {
      padding: 2.25rem 2.5rem;
      border-radius: 20px;
      border: 1.5px solid rgba(56, 189, 248, 0.3);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    }
    :host-context([data-theme='light']) .register-card {
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
    }
    .visual-card {
      position: relative;
      width: 100%;
      height: 380px;
      border-radius: 24px;
      overflow: hidden;
      background: linear-gradient(135deg, #0b1e3f, #1d4ed8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
      color: #fff;
      text-align: center;
    }
    .visual-ring {
      width: 90px;
      height: 90px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }
    .names {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    app-field {
      margin-bottom: 1rem;
    }
    @media (max-width: 480px) {
      .names {
        grid-template-columns: 1fr;
        gap: 0;
      }
      .register-card {
        padding: 1.75rem 1.25rem;
      }
    }
  `,
  template: `
    <div class="auth-main">
      <svg class="auth-lines" viewBox="0 0 1440 900" aria-hidden="true" style="opacity: 0.15">
        <path d="M50 200 L200 200 L250 250 L400 250" stroke="#38BDF8" stroke-width="1.5" fill="none" />
        <circle cx="400" cy="250" r="4" fill="#38BDF8" />
        <path d="M1200 150 L1300 250 L1400 250" stroke="#FBBF24" stroke-width="1.5" fill="none" />
        <circle cx="1200" cy="150" r="4" fill="#FBBF24" />
        <path d="M100 700 L300 700 L350 650 L500 650" stroke="#38BDF8" stroke-width="1.5" fill="none" />
      </svg>

      <div class="auth-grid" style="grid-template-columns: 280px 1fr 340px; gap: 2rem; max-width: 1300px">
        <div class="brand-col auth-decor" aria-hidden="true">
          <div class="logo-ring">
            <img src="img/logo-220.webp" alt="" width="110" height="110" />
          </div>
          <div class="font-heading" style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary)">Club Informatique</div>
          <div style="font-size: 1.1rem; color: var(--accent-active); font-weight: 700">de l’IST</div>
        </div>

        <div class="glass-panel register-card">
          @if (done()) {
            <div role="status" style="text-align: center">
              <div class="auth-avatar outline" aria-hidden="true"><app-icon name="mail" [size]="28" /></div>
              <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 0.75rem">Vérifiez votre <span class="accent-cyan">boîte de réception</span></h1>
              <p style="font-size: 0.95rem; margin-bottom: 1.5rem">
                Un courriel de vérification vient de vous être envoyé. Ouvrez le lien qu’il contient pour activer votre compte, puis connectez-vous.
              </p>
              <a appBtn variant="secondary" routerLink="/connexion">Aller à la connexion</a>
            </div>
          } @else {
            <div style="margin-bottom: 1.5rem">
              <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 0.25rem">Créer&ngsp;<span class="accent-cyan">mon compte</span></h1>
              <p style="font-size: 0.9rem; color: var(--text-muted)">Remplissez le formulaire ci-dessous pour rejoindre le club.</p>
            </div>

            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <div class="names">
                <app-field label="Nom" [labelHidden]="true" [required]="true" [serverError]="serverErrors()['nom'] ?? null">
                  <app-input-group icon="user" [suffix]="valid('nom')">
                    <input appControl type="text" formControlName="nom" placeholder="Nom *" autocomplete="family-name" [attr.maxlength]="nameMax" />
                    <span suffix class="input-valid" aria-hidden="true"><app-icon name="check" [size]="16" /></span>
                  </app-input-group>
                </app-field>
                <app-field label="Prénom" [labelHidden]="true" [required]="true" [serverError]="serverErrors()['prenom'] ?? null">
                  <app-input-group icon="user" [suffix]="valid('prenom')">
                    <input appControl type="text" formControlName="prenom" placeholder="Prénom *" autocomplete="given-name" [attr.maxlength]="nameMax" />
                    <span suffix class="input-valid" aria-hidden="true"><app-icon name="check" [size]="16" /></span>
                  </app-input-group>
                </app-field>
              </div>

              <app-field label="Adresse électronique" [labelHidden]="true" [required]="true" [serverError]="serverErrors()['email'] ?? null">
                <app-input-group icon="mail" [suffix]="valid('email')">
                  <input appControl type="email" formControlName="email" placeholder="Adresse électronique *" autocomplete="email" inputmode="email" />
                  <span suffix class="input-valid" aria-hidden="true"><app-icon name="check" [size]="16" /></span>
                </app-input-group>
              </app-field>

              <app-field
                label="Filière d’études"
                [labelHidden]="true"
                [required]="true"
                hint="Saisie libre : indiquez votre filière et votre niveau tels que vous les nommez."
                [serverError]="serverErrors()['filiere'] ?? null"
              >
                <app-input-group icon="graduation-cap" [suffix]="valid('filiere')">
                  <input appControl type="text" formControlName="filiere" placeholder="Filière d’études *" autocomplete="off" [attr.maxlength]="filiereMax" />
                  <span suffix class="input-valid" aria-hidden="true"><app-icon name="check" [size]="16" /></span>
                </app-input-group>
              </app-field>

              <app-field
                label="Mot de passe"
                [labelHidden]="true"
                [required]="true"
                [hint]="policyMessage"
                [messages]="{ politique: policyMessage }"
                [serverError]="serverErrors()['motDePasse'] ?? null"
              >
                <app-input-group icon="lock" [suffix]="true">
                  <input appControl [type]="showPassword() ? 'text' : 'password'" formControlName="motDePasse" placeholder="Mot de passe *" autocomplete="new-password" />
                  <app-password-toggle suffix [(visible)]="showPassword" />
                </app-input-group>
              </app-field>

              <app-field label="Confirmation du mot de passe" [labelHidden]="true" [required]="true" [serverError]="confirmationError()">
                <app-input-group icon="lock" [suffix]="true">
                  <input
                    appControl
                    [type]="showConfirmation() ? 'text' : 'password'"
                    formControlName="confirmation"
                    placeholder="Confirmation du mot de passe *"
                    autocomplete="new-password"
                  />
                  <app-password-toggle suffix [(visible)]="showConfirmation" />
                </app-input-group>
              </app-field>

              <app-checkbox formControlName="consentement" [invalid]="consentMissing()">
                J’accepte les <a routerLink="/conditions-utilisation" style="text-decoration: underline">conditions d’utilisation</a> et la
                <a routerLink="/confidentialite" style="text-decoration: underline">politique de confidentialité</a>
              </app-checkbox>
              <div class="form-error empty:hidden" aria-live="polite">{{ consentMissing() ? 'Votre accord est nécessaire pour créer un compte.' : '' }}</div>

              <div aria-live="assertive">
                @if (error(); as failure) {
                  <div class="auth-alert" role="alert" style="margin-top: 1rem">
                    <div class="auth-alert-icon"><app-icon name="alert-circle" [size]="18" /></div>
                    <div>
                      <strong>Inscription impossible</strong>
                      <span>{{ failure }}</span>
                    </div>
                  </div>
                }
              </div>

              <button appBtn variant="amber" size="lg" type="submit" [block]="true" style="margin-top: 1.25rem; border-radius: 12px" [loading]="pending()">
                <app-icon name="user-plus" [size]="18" [strokeWidth]="2.5" />
                S’inscrire
              </button>

              <div style="text-align: center; margin-top: 1.25rem; font-size: 0.88rem; color: var(--text-muted)">
                Déjà membre&nbsp;?
                <a routerLink="/connexion" class="accent-cyan" style="font-weight: 700">Se connecter</a>
              </div>
            </form>
          }
        </div>

        <div class="auth-decor" style="position: relative" aria-hidden="true">
          <div class="visual-card">
            <svg style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.25" viewBox="0 0 340 380">
              <path d="M0 50 Q100 80 200 40 T340 100" stroke="#38BDF8" stroke-width="1.5" fill="none" />
              <path d="M50 380 L120 280 L250 280 L300 200" stroke="#FBBF24" stroke-width="1.5" fill="none" />
              <circle cx="250" cy="280" r="4" fill="#FBBF24" />
            </svg>
            <div class="visual-ring"><app-icon name="users" [size]="44" [strokeWidth]="1.5" /></div>
          </div>
          <svg style="position: absolute; bottom: -12px; right: -12px; width: 120px; height: 120px; pointer-events: none" viewBox="0 0 120 120">
            <path d="M10 115 C60 115 115 60 115 10" fill="none" stroke="#FBBF24" stroke-width="4" stroke-linecap="round" />
            <path d="M25 118 C65 118 118 65 118 25" fill="none" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </div>
      </div>
    </div>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly nameMax = NAME_MAX;
  protected readonly filiereMax = FILIERE_MAX;
  protected readonly policyMessage = PASSWORD_POLICY_MESSAGE;

  protected readonly form = new FormGroup(
    {
      nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(NAME_MAX)] }),
      prenom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(NAME_MAX)] }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(255)] }),
      filiere: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(FILIERE_MAX)] }),
      motDePasse: new FormControl('', { nonNullable: true, validators: [Validators.required, passwordPolicyValidator] }),
      confirmation: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      consentement: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
    },
    { validators: [matchValidator('motDePasse', 'confirmation')] },
  );

  protected readonly showPassword = signal(false);
  protected readonly showConfirmation = signal(false);
  protected readonly pending = signal(false);
  protected readonly submitted = signal(false);
  protected readonly done = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});
  private readonly tick = signal(0);

  constructor() {
    inject(SeoService).apply({
      title: 'Inscription',
      description: 'Créez votre compte pour rejoindre le Club Informatique de l’IST.',
      path: '/inscription',
    });
    this.form.statusChanges.subscribe(() => this.tick.update((n) => n + 1));
  }

  /** Coche de validité : affichée seulement pour un champ modifié et valide. */
  protected valid(name: 'nom' | 'prenom' | 'email' | 'filiere'): boolean {
    this.tick();
    const control = this.form.controls[name];
    return control.valid && control.dirty;
  }

  protected consentMissing(): boolean {
    this.tick();
    return this.submitted() && this.form.controls.consentement.invalid;
  }

  protected confirmationError(): string | null {
    this.tick();
    const control = this.form.controls.confirmation;
    return control.touched && control.value && this.form.hasError('confirmation') ? 'Les deux mots de passe ne sont pas identiques.' : null;
  }

  protected submit(): void {
    this.submitted.set(true);
    revealErrors(this.form);
    this.tick.update((n) => n + 1);
    if (this.form.invalid || this.pending()) return;

    this.pending.set(true);
    this.error.set(null);
    this.serverErrors.set({});
    const value = this.form.getRawValue();
    this.auth
      .register({
        nom: normalizeSpaces(value.nom),
        prenom: normalizeSpaces(value.prenom),
        email: value.email.trim().toLowerCase(),
        filiere: normalizeSpaces(value.filiere),
        motDePasse: value.motDePasse,
        consentement: value.consentement,
      })
      .subscribe({
        next: (result) => {
          this.pending.set(false);
          if (result.verificationRequise) this.done.set(true);
          else void this.router.navigateByUrl('/espace');
        },
        error: (failure: unknown) => {
          this.pending.set(false);
          const apiError = toApiError(failure);
          this.serverErrors.set(apiError.fieldMessages());
          this.error.set(messageFor(apiError));
        },
      });
  }
}

function messageFor(error: ApiError): string {
  switch (error.kind) {
    case 'conflict':
      return 'Un compte existe peut-être déjà avec cette adresse. Connectez-vous ou réinitialisez votre mot de passe.';
    case 'validation':
      return 'Certains champs sont invalides. Vérifiez votre saisie.';
    case 'rate-limit':
      return 'Trop de tentatives. Réessayez dans quelques minutes.';
    case 'network':
      return 'La connexion au service a échoué. Vérifiez votre connexion, puis réessayez.';
    default:
      return 'Un problème est survenu de notre côté. Réessayez dans quelques instants.';
  }
}
