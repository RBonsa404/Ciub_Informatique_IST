import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MemberApi } from '../../core/api/member.api';
import { AuthStore } from '../../core/auth/auth.store';
import { PASSWORD_POLICY_MESSAGE, matchValidator, passwordPolicyValidator } from '../../core/auth/password-policy';
import { toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { Button } from '../../shared/ui/button/button';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { ToastService } from '../../shared/ui/toast/toast.service';

/**
 * Changement de mot de passe imposé (page dérivée D8) : première connexion d'un compte créé avec un mot de passe
 * initial. Tant que le changement n'est pas fait, aucune autre page de l'espace n'est accessible.
 */
@Component({
  selector: 'app-forced-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button, Icon, Field, FieldControl],
  styles: `
    .card {
      padding: 2.5rem;
      border-radius: 24px;
      max-width: 560px;
      margin: 0 auto;
    }
    .emblem {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 2px solid var(--color-cyan-circuit);
      color: var(--accent-active);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
    }
    @media (max-width: 600px) {
      .card {
        padding: 1.5rem;
      }
    }
  `,
  template: `
    <div class="glass-panel card">
      <div class="emblem" aria-hidden="true"><app-icon name="key" [size]="28" /></div>
      <h1 style="font-size: 1.6rem; font-weight: 800; text-align: center; margin-bottom: 0.5rem">Choisissez votre mot de passe</h1>
      <p style="font-size: 0.9rem; text-align: center; margin-bottom: 2rem">
        Votre compte a été créé avec un mot de passe initial. Pour protéger la plateforme, remplacez-le avant de continuer.
      </p>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-field label="Mot de passe initial" [required]="true" [serverError]="currentError()">
          <input appControl type="password" formControlName="ancien" autocomplete="current-password" />
        </app-field>
        <app-field label="Nouveau mot de passe" [required]="true" [hint]="policyMessage" [messages]="{ politique: policyMessage }" [serverError]="sameError()">
          <input appControl type="password" formControlName="nouveau" autocomplete="new-password" />
        </app-field>
        <app-field label="Confirmation du nouveau mot de passe" [required]="true" [serverError]="confirmationError()">
          <input appControl type="password" formControlName="confirmation" autocomplete="new-password" />
        </app-field>
        <div aria-live="assertive">
          @if (error(); as failure) {
            <p class="form-error" role="alert" style="margin-bottom: 1rem">{{ failure }}</p>
          }
        </div>
        <button appBtn size="lg" type="submit" [block]="true" [loading]="pending()">Enregistrer et continuer</button>
      </form>
    </div>
  `,
})
export class ForcedPasswordPage {
  private readonly api = inject(MemberApi);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly policyMessage = PASSWORD_POLICY_MESSAGE;
  protected readonly form = new FormGroup(
    {
      ancien: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      nouveau: new FormControl('', { nonNullable: true, validators: [Validators.required, passwordPolicyValidator] }),
      confirmation: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: [matchValidator('nouveau', 'confirmation')] },
  );
  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  protected readonly confirmationError = computed(() => {
    const { nouveau, confirmation } = this.value();
    return confirmation && nouveau !== confirmation ? 'Les deux mots de passe ne sont pas identiques.' : null;
  });
  protected readonly sameError = computed(() => {
    const { ancien, nouveau } = this.value();
    return nouveau && ancien === nouveau ? 'Le nouveau mot de passe doit être différent du mot de passe initial.' : null;
  });
  protected readonly currentError = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    inject(SeoService).apply({ title: 'Choix du mot de passe', noindex: true });
  }

  protected submit(): void {
    revealErrors(this.form);
    if (this.form.invalid || this.sameError() || this.pending()) return;
    const { ancien, nouveau } = this.form.getRawValue();
    this.pending.set(true);
    this.error.set(null);
    this.currentError.set(null);
    this.api.changerMotDePasse(ancien, nouveau).subscribe({
      next: () => {
        this.auth.patchUser({ changementMotDePasseRequis: false });
        this.toasts.success('Votre mot de passe est enregistré.');
        void this.router.navigateByUrl('/espace');
      },
      error: (failure: unknown) => {
        this.pending.set(false);
        const kind = toApiError(failure).kind;
        if (kind === 'validation' || kind === 'unauthorized' || kind === 'forbidden' || kind === 'conflict') this.currentError.set('Le mot de passe initial est incorrect.');
        else if (kind === 'network') this.error.set('La connexion au service a échoué. Vérifiez votre connexion, puis réessayez.');
      },
    });
  }
}
