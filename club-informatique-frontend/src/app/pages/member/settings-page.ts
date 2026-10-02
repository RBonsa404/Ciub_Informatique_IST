import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MemberApi } from '../../core/api/member.api';
import { PreferencesCompte } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { PASSWORD_POLICY_MESSAGE, matchValidator, passwordPolicyValidator } from '../../core/auth/password-policy';
import { toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { ThemeService } from '../../core/theme/theme.service';
import { Button } from '../../shared/ui/button/button';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';

const EXPORT_FILE_NAME = 'mes-donnees-club-informatique-ist.json';

/**
 * Paramètres du compte (écran 27) : connexion, préférences d'affichage, notifications par courriel,
 * copie des données personnelles et suppression du compte.
 */
@Component({
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Icon, Field, FieldControl, Skeleton],
  styles: `
    .emblem {
      width: 70px;
      height: 70px;
      border-radius: 16px;
      background: linear-gradient(135deg, #0b1e3f, #1d4ed8);
      border: 1.5px solid var(--color-cyan-circuit);
      box-shadow: 0 0 25px rgba(56, 189, 248, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }
    .panels {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 290px), 1fr));
      gap: 1.5rem;
      align-items: start;
      counter-reset: panneau;
    }
    .panel {
      padding: 1.75rem;
      border-radius: 18px;
    }
    .panel h2 {
      font-size: 1.05rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .panel h2::before {
      counter-increment: panneau;
      content: counter(panneau) '. ';
    }
    .panel p {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
    }
    .line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .line strong {
      font-size: 0.85rem;
      display: block;
    }
    .line span {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .danger {
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .danger h2 {
      color: var(--badge-danger-text);
    }
    .check {
      width: 18px;
      height: 18px;
      accent-color: var(--color-blue-royal);
      flex-shrink: 0;
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Paramètres du compte</h1>
        <p class="space-lead">Gérez vos informations de connexion, vos préférences, vos notifications et vos données.</p>
      </div>
      <div class="emblem max-[600px]:!hidden" aria-hidden="true"><app-icon name="settings" [size]="32" /></div>
    </div>

    <div class="panels">
      <section class="glass-panel panel" aria-labelledby="titre-connexion">
        <h2 id="titre-connexion">Informations de connexion</h2>
        <div class="form-group">
          <label class="form-label" for="courriel-compte" style="font-size: 0.8rem">Adresse électronique</label>
          <input id="courriel-compte" class="form-input" type="email" [value]="auth.user()?.email ?? ''" readonly style="font-size: 0.85rem" />
        </div>

        @if (!passwordOpen()) {
          <button appBtn size="sm" type="button" [block]="true" (click)="passwordOpen.set(true)">Changer le mot de passe</button>
        } @else {
          <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" novalidate>
            <app-field label="Mot de passe actuel" [required]="true" [serverError]="currentPasswordError()">
              <input appControl type="password" formControlName="ancien" autocomplete="current-password" />
            </app-field>
            <app-field label="Nouveau mot de passe" [required]="true" [hint]="policyMessage" [messages]="{ politique: policyMessage }">
              <input appControl type="password" formControlName="nouveau" autocomplete="new-password" />
            </app-field>
            <app-field label="Confirmation du nouveau mot de passe" [required]="true" [serverError]="confirmationError()">
              <input appControl type="password" formControlName="confirmation" autocomplete="new-password" />
            </app-field>
            <div class="flex flex-wrap gap-3">
              <button appBtn size="sm" type="submit" [loading]="passwordPending()">Enregistrer</button>
              <button appBtn variant="secondary" size="sm" type="button" (click)="closePassword()">Annuler</button>
            </div>
          </form>
        }
      </section>

      <section class="glass-panel panel" aria-labelledby="titre-preferences">
        <h2 id="titre-preferences">Préférences</h2>
        <div class="line" style="margin-bottom: 1.25rem">
          <div>
            <strong>Thème</strong>
            <span>{{ theme.theme() === 'dark' ? 'Sombre' : 'Clair' }}</span>
          </div>
          <button appBtn variant="secondary" size="sm" type="button" (click)="theme.toggle()">
            <app-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" [size]="14" /> Basculer
          </button>
        </div>
        <div class="line">
          <div>
            <strong>Langue</strong>
            <span>Français</span>
          </div>
        </div>
      </section>

      <section class="glass-panel panel" aria-labelledby="titre-notifications">
        <h2 id="titre-notifications">Notifications</h2>
        @switch (preferences.status()) {
          @case ('loading') {
            <div role="status" aria-busy="true">
              <span class="sr-only">Chargement en cours</span>
              <app-skeleton height="1.5rem" />
            </div>
          }
          @case ('ready') {
            @if (preferences.data(); as prefs) {
              <label class="line" style="cursor: pointer">
                <span style="font-size: 0.85rem; color: var(--text-primary)">Alertes par courriel</span>
                <input
                  type="checkbox"
                  class="check"
                  [checked]="prefs.notificationsCourriel"
                  [disabled]="preferencesPending()"
                  (change)="setEmailAlerts($event)"
                />
              </label>
            }
          }
          @default {
            <div role="alert">
              <p style="margin-bottom: 0.75rem">Vos préférences de notification n’ont pas pu être chargées.</p>
              <button appBtn variant="secondary" size="sm" type="button" (click)="preferences.load()">
                <app-icon name="refresh-cw" [size]="14" /> Réessayer
              </button>
            </div>
          }
        }
      </section>

      <section class="glass-panel panel" aria-labelledby="titre-donnees">
        <h2 id="titre-donnees" style="margin-bottom: 0.5rem">Mes données</h2>
        <p>
          Obtenez une copie des données personnelles associées à votre compte. Vos droits sont détaillés dans la
          <a routerLink="/confidentialite" class="accent-cyan" style="text-decoration: underline">politique de confidentialité</a>.
        </p>
        <button appBtn variant="secondary" size="sm" type="button" [block]="true" [loading]="exportPending()" (click)="exportData()">
          <app-icon name="download" [size]="14" /> Télécharger mes données
        </button>
      </section>

      <section class="glass-panel panel danger" aria-labelledby="titre-danger">
        <h2 id="titre-danger" style="margin-bottom: 0.5rem">Zone dangereuse</h2>
        <p>La suppression de votre compte est définitive : vos inscriptions sont annulées et vous ne pourrez plus vous connecter.</p>
        @if (!deleteOpen()) {
          <button appBtn variant="danger" size="sm" type="button" [block]="true" (click)="deleteOpen.set(true)">Supprimer mon compte</button>
        } @else {
          <form [formGroup]="deleteForm" (ngSubmit)="deleteAccount()" novalidate>
            <app-field label="Mot de passe" hint="Saisissez votre mot de passe pour confirmer." [required]="true" [serverError]="deleteError()">
              <input appControl type="password" formControlName="motDePasse" autocomplete="current-password" />
            </app-field>
            <div class="flex flex-wrap gap-3">
              <button appBtn variant="danger" size="sm" type="submit" [loading]="deletePending()">Supprimer définitivement</button>
              <button appBtn variant="secondary" size="sm" type="button" (click)="closeDelete()">Annuler</button>
            </div>
          </form>
        }
      </section>
    </div>
  `,
})
export class SettingsPage {
  private readonly api = inject(MemberApi);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  protected readonly auth = inject(AuthStore);
  private readonly sessions = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly policyMessage = PASSWORD_POLICY_MESSAGE;

  // --- Mot de passe ---
  protected readonly passwordOpen = signal(false);
  protected readonly passwordPending = signal(false);
  protected readonly currentPasswordError = signal<string | null>(null);
  protected readonly passwordForm = new FormGroup(
    {
      ancien: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      nouveau: new FormControl('', { nonNullable: true, validators: [Validators.required, passwordPolicyValidator] }),
      confirmation: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: [matchValidator('nouveau', 'confirmation')] },
  );
  private readonly passwordValue = toSignal(this.passwordForm.valueChanges, { initialValue: this.passwordForm.value });
  protected readonly confirmationError = computed(() => {
    const { nouveau, confirmation } = this.passwordValue();
    return confirmation && nouveau !== confirmation ? 'Les deux mots de passe ne sont pas identiques.' : null;
  });

  // --- Préférences de notification ---
  protected readonly preferences = new ResourceState<PreferencesCompte>(() => this.api.preferences());
  protected readonly preferencesPending = signal(false);

  // --- Données et suppression ---
  protected readonly exportPending = signal(false);
  protected readonly deleteOpen = signal(false);
  protected readonly deletePending = signal(false);
  protected readonly deleteError = signal<string | null>(null);
  protected readonly deleteForm = new FormGroup({
    motDePasse: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    inject(SeoService).apply({ title: 'Paramètres du compte', noindex: true });
    this.preferences.load();
    inject(DestroyRef).onDestroy(() => this.preferences.destroy());
  }

  protected closePassword(): void {
    this.passwordOpen.set(false);
    this.passwordForm.reset();
    this.currentPasswordError.set(null);
  }

  protected changePassword(): void {
    revealErrors(this.passwordForm);
    if (this.passwordForm.invalid || this.passwordPending()) return;
    const { ancien, nouveau } = this.passwordForm.getRawValue();
    this.passwordPending.set(true);
    this.currentPasswordError.set(null);
    this.api.changerMotDePasse(ancien, nouveau).subscribe({
      next: () => {
        // Le serveur a fermé les autres sessions et remplacé le cookie de celle-ci : elle est renouvelée aussitôt.
        this.sessions.refresh().subscribe((renouvelee) => {
          this.passwordPending.set(false);
          this.closePassword();
          this.toasts.success(renouvelee ? 'Votre mot de passe est modifié.' : 'Votre mot de passe est modifié. Reconnectez-vous.');
          if (!renouvelee) void this.router.navigateByUrl('/connexion');
        });
      },
      error: (failure: unknown) => {
        this.passwordPending.set(false);
        const apiError = toApiError(failure);
        const kind = apiError.kind;
        if (apiError.code === 'MOT_DE_PASSE_INCORRECT') {
          this.currentPasswordError.set('Le mot de passe actuel est incorrect.');
        } else if (kind === 'validation') {
          this.currentPasswordError.set(apiError.fieldMessage('nouveauMotDePasse') ?? apiError.userMessage);
        } else if (kind === 'network') {
          this.toasts.danger('La connexion au service a échoué. Vérifiez votre connexion, puis réessayez.');
        }
      },
    });
  }

  protected setEmailAlerts(event: Event): void {
    const input = event.target as HTMLInputElement;
    const wanted = input.checked;
    this.preferencesPending.set(true);
    this.api.enregistrerPreferences({ notificationsCourriel: wanted }).subscribe({
      next: () => {
        this.preferencesPending.set(false);
        this.preferences.refresh();
        this.toasts.success(wanted ? 'Les alertes par courriel sont activées.' : 'Les alertes par courriel sont désactivées.');
      },
      error: (failure: unknown) => {
        this.preferencesPending.set(false);
        input.checked = !wanted;
        const kind = toApiError(failure).kind;
        if (kind !== 'server' && kind !== 'rate-limit') this.toasts.danger('Votre préférence n’a pas pu être enregistrée. Réessayez.');
      },
    });
  }

  protected exportData(): void {
    if (this.exportPending()) return;
    this.exportPending.set(true);
    this.api.exporterDonnees().subscribe({
      next: (blob) => {
        this.exportPending.set(false);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = EXPORT_FILE_NAME;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (failure: unknown) => {
        this.exportPending.set(false);
        const kind = toApiError(failure).kind;
        if (kind !== 'server' && kind !== 'rate-limit') this.toasts.danger('Vos données n’ont pas pu être préparées. Réessayez dans quelques instants.');
      },
    });
  }

  protected closeDelete(): void {
    this.deleteOpen.set(false);
    this.deleteForm.reset();
    this.deleteError.set(null);
  }

  protected deleteAccount(): void {
    revealErrors(this.deleteForm);
    if (this.deleteForm.invalid || this.deletePending()) return;
    this.dialogs
      .confirm({
        title: 'Supprimer le compte',
        message: 'Souhaitez-vous supprimer définitivement votre compte ? Cette action est irréversible.',
        confirmLabel: 'Supprimer mon compte',
        cancelLabel: 'Conserver mon compte',
        danger: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.deletePending.set(true);
        this.deleteError.set(null);
        this.api.supprimerCompte(this.deleteForm.controls.motDePasse.value).subscribe({
          next: () => {
            this.auth.clear();
            this.toasts.success('Votre compte est supprimé.');
            void this.router.navigateByUrl('/');
          },
          error: (failure: unknown) => {
            this.deletePending.set(false);
            const kind = toApiError(failure).kind;
            if (kind === 'validation' || kind === 'unauthorized' || kind === 'forbidden') this.deleteError.set('Le mot de passe est incorrect.');
            else if (kind !== 'server' && kind !== 'rate-limit') this.deleteError.set('La suppression n’a pas pu aboutir. Réessayez dans quelques instants.');
          },
        });
      });
  }
}
