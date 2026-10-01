import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PASSWORD_POLICY_MESSAGE, PASSWORD_STRENGTH_LABELS, matchValidator, passwordPolicyValidator, passwordScore } from '../../core/auth/password-policy';
import { toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { Button } from '../../shared/ui/button/button';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { InputGroup, PasswordToggle } from '../../shared/ui/field/input-group';
import { Icon } from '../../shared/ui/icon/icon';

const LOCK_STYLES = `
  .platform {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .halo-ring {
    position: absolute;
    border-radius: 50%;
  }
  .lock {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .shackle {
    position: absolute;
    border-bottom: none !important;
  }
  @keyframes rotate {
    to {
      transform: rotate(360deg);
    }
  }
`;

/** Mot de passe oublié (écran 20). La réponse est identique que le compte existe ou non. */
@Component({
  selector: 'app-forgot-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Icon, Field, FieldControl, InputGroup],
  styleUrl: './auth.css',
  styles: LOCK_STYLES,
  template: `
    <div class="auth-main">
      <div class="auth-grid" style="grid-template-columns: 1fr 1fr; max-width: 1050px">
        <div>
          <div class="auth-pill">Réinitialisation de mot de passe</div>
          <h1 class="auth-title" style="font-size: clamp(2.4rem, 4vw, 3.2rem); line-height: 1.15; margin-bottom: 1.25rem">
            Mot de passe<br /><span class="accent-cyan">oublié&nbsp;?</span>
          </h1>
          <p class="auth-lead" style="font-size: 1.05rem; max-width: 460px; margin-bottom: 2rem">
            Indiquez votre adresse électronique : nous vous enverrons un lien sécurisé pour créer un nouveau mot de passe.
          </p>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate style="max-width: 440px">
            <app-field label="Adresse électronique" [labelHidden]="true" [messages]="{ required: 'Saisissez votre adresse électronique.' }">
              <app-input-group icon="mail">
                <input appControl type="email" formControlName="email" placeholder="Adresse électronique" autocomplete="email" inputmode="email" />
              </app-input-group>
            </app-field>

            <button appBtn size="lg" type="submit" class="auth-submit" [loading]="pending()">
              <app-icon name="send" [size]="18" />
              Envoyer le lien de réinitialisation
            </button>

            <div style="margin-top: 1.5rem">
              <a routerLink="/connexion" class="auth-link"><app-icon name="arrow-left" [size]="16" /> Retour à la connexion</a>
            </div>
          </form>

          <div aria-live="polite" style="max-width: 440px">
            @if (sent()) {
              <div class="glass-card glass-card-static auth-success" role="status" style="margin-top: 1.5rem">
                <div class="flex items-center gap-3" style="margin-bottom: 0.5rem">
                  <app-icon name="check-circle" [size]="20" />
                  <strong>Instructions envoyées</strong>
                </div>
                <p style="font-size: 0.85rem">
                  Si cette adresse électronique est associée à un compte, vous recevrez un lien pour créer un nouveau mot de passe.
                </p>
              </div>
            }
            @if (error(); as failure) {
              <div class="auth-alert" role="alert" style="margin-top: 1.5rem">
                <div class="auth-alert-icon"><app-icon name="alert-circle" [size]="18" /></div>
                <div>
                  <strong>Envoi impossible</strong>
                  <span>{{ failure }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="auth-decor" style="display: flex; justify-content: center" aria-hidden="true">
          <div class="platform" style="width: 340px; height: 340px">
            <div class="halo-ring" style="inset: 0; border: 2px dashed rgba(56, 189, 248, 0.4); animation: rotate 30s linear infinite"></div>
            <div class="halo-ring" style="inset: 25px; border: 1.5px solid rgba(251, 191, 36, 0.35)"></div>
            <div class="halo-ring" style="inset: 50px; background: radial-gradient(circle, rgba(29, 78, 216, 0.35) 0%, transparent 70%)"></div>
            <div
              class="lock"
              style="width: 140px; height: 160px; background: linear-gradient(135deg, #1D4ED8, #0B1E3F); border-radius: 28px; border: 2px solid #38BDF8; box-shadow: 0 0 50px rgba(56, 189, 248, 0.5)"
            >
              <div
                class="shackle"
                style="top: -45px; width: 70px; height: 65px; border: 14px solid #38BDF8; border-radius: 35px 35px 0 0; box-shadow: 0 -5px 20px rgba(56, 189, 248, 0.4)"
              ></div>
              <div style="width: 14px; height: 14px; border-radius: 50%; background: #000; margin-bottom: 2px"></div>
              <div style="width: 8px; height: 18px; background: #000; border-radius: 0 0 4px 4px"></div>
            </div>
            <div
              style="position: absolute; bottom: 30px; right: 20px; z-index: 3; background: #FBBF24; color: #070D1E; border-radius: 16px; padding: 0.8rem 1rem; box-shadow: 0 10px 25px rgba(251, 191, 36, 0.5); display: flex; align-items: center"
            >
              <app-icon name="mail" [size]="22" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  });
  protected readonly pending = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    inject(SeoService).apply({
      title: 'Mot de passe oublié',
      description: 'Recevez un lien pour créer un nouveau mot de passe.',
      path: '/mot-de-passe-oublie',
    });
  }

  protected submit(): void {
    revealErrors(this.form);
    if (this.form.invalid || this.pending()) return;
    this.pending.set(true);
    this.sent.set(false);
    this.error.set(null);
    this.auth.requestPasswordReset(this.form.controls.email.value.trim().toLowerCase()).subscribe({
      next: () => {
        this.pending.set(false);
        this.sent.set(true);
      },
      error: (failure: unknown) => {
        this.pending.set(false);
        const apiError = toApiError(failure);
        this.error.set(
          apiError.kind === 'rate-limit'
            ? 'Trop de demandes. Réessayez dans quelques minutes.'
            : apiError.kind === 'network'
              ? 'La connexion au service a échoué. Vérifiez votre connexion, puis réessayez.'
              : 'Un problème est survenu de notre côté. Réessayez dans quelques instants.',
        );
      },
    });
  }
}

/** Réinitialisation du mot de passe (écran 21), atteinte par le lien à usage unique reçu par courriel. */
@Component({
  selector: 'app-reset-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Icon, Field, FieldControl, InputGroup, PasswordToggle],
  styleUrl: './auth.css',
  styles: LOCK_STYLES,
  template: `
    <div class="auth-main">
      <div class="auth-grid" style="grid-template-columns: 500px 1fr; max-width: 1100px">
        <div class="glass-panel auth-card" style="padding: 2.75rem 2.5rem">
          <div class="auth-avatar outline" aria-hidden="true"><app-icon name="lock" [size]="28" /></div>

          @if (!token) {
            <div role="alert" style="text-align: center">
              <h1 style="font-size: 1.85rem; font-weight: 800; margin-bottom: 0.75rem">Lien invalide</h1>
              <p style="font-size: 0.95rem; margin-bottom: 1.5rem">Ce lien de réinitialisation est incomplet ou a expiré. Demandez-en un nouveau.</p>
              <a appBtn routerLink="/mot-de-passe-oublie">Demander un nouveau lien</a>
            </div>
          } @else {
            <h1 style="font-size: 1.85rem; font-weight: 800; text-align: center; margin-bottom: 0.5rem">
              Réinitialiser <span class="accent-cyan">mon mot</span>&ngsp;<span class="accent-amber">de passe</span>
            </h1>
            <p style="font-size: 0.88rem; text-align: center; margin-bottom: 2rem; line-height: 1.5">
              Choisissez un nouveau mot de passe sûr pour assurer la sécurité de votre compte.
            </p>

            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <app-field label="Nouveau mot de passe" [required]="true" [messages]="{ politique: policyMessage }">
                <app-input-group icon="lock" [suffix]="true">
                  <input
                    appControl
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="motDePasse"
                    placeholder="Entrez votre nouveau mot de passe"
                    autocomplete="new-password"
                  />
                  <app-password-toggle suffix [(visible)]="showPassword" />
                </app-input-group>
              </app-field>

              <app-field label="Confirmation du mot de passe" [required]="true" [serverError]="confirmationError()">
                <app-input-group icon="lock" [suffix]="true">
                  <input
                    appControl
                    [type]="showConfirmation() ? 'text' : 'password'"
                    formControlName="confirmation"
                    placeholder="Confirmez votre nouveau mot de passe"
                    autocomplete="new-password"
                  />
                  <app-password-toggle suffix [(visible)]="showConfirmation" />
                </app-input-group>
              </app-field>

              <div style="margin-bottom: 1.5rem">
                <div class="flex justify-between" style="font-size: 0.8rem; margin-bottom: 0.4rem; color: var(--text-muted)">
                  <span id="robustesse">Robustesse du mot de passe</span>
                  <span class="accent-cyan" style="font-weight: 600" aria-live="polite">{{ strengthLabel() }}</span>
                </div>
                <div class="strength-bars" role="img" [attr.aria-label]="'Robustesse : ' + strengthLabel()">
                  @for (level of levels; track level) {
                    <span [class.on]="score() >= level"></span>
                  }
                </div>
                <div class="flex items-center gap-2" style="font-size: 0.78rem; color: var(--text-muted)">
                  <app-icon name="info" [size]="14" />
                  <span>{{ policyMessage }}</span>
                </div>
              </div>

              <button appBtn size="lg" type="submit" class="auth-submit" style="box-shadow: none" [loading]="pending()">
                Enregistrer le nouveau mot de passe
                <app-icon name="arrow-right" [size]="18" />
              </button>

              <div aria-live="assertive">
                @if (error(); as failure) {
                  <div class="auth-alert" role="alert" style="margin-top: 1.25rem">
                    <div class="auth-alert-icon"><app-icon name="alert-circle" [size]="18" /></div>
                    <div>
                      <strong>Réinitialisation impossible</strong>
                      <span>{{ failure }}</span>
                    </div>
                  </div>
                }
              </div>

              <div class="auth-info" style="margin-top: 1.25rem">
                <app-icon name="check" [size]="16" />
                <span>Une fois le mot de passe enregistré, toutes vos sessions ouvertes seront fermées et vous pourrez vous reconnecter.</span>
              </div>

              <div style="text-align: center; margin-top: 1.25rem">
                <a routerLink="/connexion" class="auth-link accent-amber"><app-icon name="arrow-left" [size]="16" /> Retour à la connexion</a>
              </div>
            </form>
          }
        </div>

        <div class="auth-decor" style="display: flex; justify-content: center" aria-hidden="true">
          <div class="platform" style="width: 380px; height: 380px">
            <div class="halo-ring" style="inset: 0; border-radius: 0; background: radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)"></div>
            <div
              class="lock"
              style="width: 220px; height: 260px; background: rgba(11, 30, 63, 0.7); border: 2px solid #38BDF8; border-radius: 30px; box-shadow: 0 0 50px rgba(56, 189, 248, 0.45)"
            >
              <div
                class="lock"
                style="width: 100px; height: 100px; background: linear-gradient(135deg, #1D4ED8, #0055ff); border-radius: 20px; box-shadow: 0 10px 30px rgba(0, 85, 255, 0.5)"
              >
                <div
                  class="shackle"
                  style="top: -35px; width: 50px; height: 45px; border: 10px solid #FBBF24; border-radius: 25px 25px 0 0; box-shadow: 0 0 15px rgba(251, 191, 36, 0.5)"
                ></div>
                <div style="width: 10px; height: 20px; background: #FBBF24; border-radius: 5px"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ResetPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('jeton');

  protected readonly policyMessage = PASSWORD_POLICY_MESSAGE;
  protected readonly levels = [1, 2, 3, 4, 5];

  protected readonly form = new FormGroup(
    {
      motDePasse: new FormControl('', { nonNullable: true, validators: [Validators.required, passwordPolicyValidator] }),
      confirmation: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: [matchValidator('motDePasse', 'confirmation')] },
  );
  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  protected readonly score = computed(() => passwordScore(this.value().motDePasse ?? ''));
  protected readonly strengthLabel = computed(() => PASSWORD_STRENGTH_LABELS[this.score()]);

  protected readonly showPassword = signal(false);
  protected readonly showConfirmation = signal(false);
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    inject(SeoService).apply({ title: 'Réinitialisation du mot de passe', noindex: true });
  }

  protected confirmationError(): string | null {
    const { motDePasse, confirmation } = this.value();
    return this.form.controls.confirmation.touched && confirmation && motDePasse !== confirmation ? 'Les deux mots de passe ne sont pas identiques.' : null;
  }

  protected submit(): void {
    revealErrors(this.form);
    if (this.form.invalid || this.pending() || !this.token) return;
    this.pending.set(true);
    this.error.set(null);
    this.auth.resetPassword(this.token, this.form.controls.motDePasse.value).subscribe({
      next: () => void this.router.navigate(['/connexion'], { queryParams: { motif: 'mot-de-passe-modifie' } }),
      error: (failure: unknown) => {
        this.pending.set(false);
        const apiError = toApiError(failure);
        this.error.set(
          apiError.kind === 'validation' || apiError.kind === 'not-found' || apiError.kind === 'unauthorized'
            ? 'Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau.'
            : apiError.kind === 'network'
              ? 'La connexion au service a échoué. Vérifiez votre connexion, puis réessayez.'
              : 'Un problème est survenu de notre côté. Réessayez dans quelques instants.',
        );
      },
    });
  }
}

type VerificationState = 'loading' | 'success' | 'invalid' | 'error';

/** Vérification de l'adresse électronique (dérivée) : active le compte à partir du lien reçu par courriel. */
@Component({
  selector: 'app-verify-email-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon],
  styleUrl: './auth.css',
  template: `
    <div class="auth-main">
      <div class="glass-panel auth-card" style="max-width: 500px; width: 100%; text-align: center; position: relative; z-index: 1" aria-live="polite">
        @switch (state()) {
          @case ('loading') {
            <div class="auth-avatar outline" aria-hidden="true"><app-icon name="mail" [size]="28" /></div>
            <h1 style="font-size: 1.85rem; font-weight: 800; margin-bottom: 0.75rem">Vérification en cours</h1>
            <p role="status" style="font-size: 0.95rem">Nous vérifions votre adresse électronique.</p>
          }
          @case ('success') {
            <div class="auth-avatar outline" aria-hidden="true"><app-icon name="check-circle" [size]="28" /></div>
            <h1 style="font-size: 1.85rem; font-weight: 800; margin-bottom: 0.75rem">Adresse <span class="accent-cyan">vérifiée</span></h1>
            <p role="status" style="font-size: 0.95rem; margin-bottom: 1.5rem">Votre compte est activé. Vous pouvez maintenant vous connecter.</p>
            <a appBtn routerLink="/connexion" [queryParams]="{ motif: 'compte-active' }">Se connecter</a>
          }
          @case ('invalid') {
            <div class="auth-avatar outline" aria-hidden="true"><app-icon name="alert-circle" [size]="28" /></div>
            <h1 style="font-size: 1.85rem; font-weight: 800; margin-bottom: 0.75rem">Lien invalide</h1>
            <p role="alert" style="font-size: 0.95rem; margin-bottom: 1.5rem">
              Ce lien de vérification est invalide, a expiré ou a déjà été utilisé. Si votre compte est déjà activé, connectez-vous.
            </p>
            <a appBtn variant="secondary" routerLink="/connexion">Aller à la connexion</a>
          }
          @case ('error') {
            <div class="auth-avatar outline" aria-hidden="true"><app-icon name="alert-triangle" [size]="28" /></div>
            <h1 style="font-size: 1.85rem; font-weight: 800; margin-bottom: 0.75rem">Vérification impossible</h1>
            <p role="alert" style="font-size: 0.95rem; margin-bottom: 1.5rem">La vérification n’a pas pu aboutir. Vérifiez votre connexion, puis réessayez.</p>
            <button appBtn variant="secondary" type="button" (click)="verify()"><app-icon name="refresh-cw" [size]="16" /> Réessayer</button>
          }
        }
      </div>
    </div>
  `,
})
export class VerifyEmailPage {
  private readonly auth = inject(AuthService);
  private readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('jeton');
  protected readonly state = signal<VerificationState>('loading');

  constructor() {
    inject(SeoService).apply({ title: 'Vérification de l’adresse électronique', noindex: true });
    this.verify();
  }

  protected verify(): void {
    if (!this.token) {
      this.state.set('invalid');
      return;
    }
    this.state.set('loading');
    this.auth.verifyEmail(this.token).subscribe({
      next: () => this.state.set('success'),
      error: (failure: unknown) => {
        const kind = toApiError(failure).kind;
        this.state.set(kind === 'network' || kind === 'server' || kind === 'rate-limit' ? 'error' : 'invalid');
      },
    });
  }
}
