import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { tap } from 'rxjs';
import { MemberApi } from '../../core/api/member.api';
import { Profil, STATUT_COMPTE_LABELS } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
import { AuthStore } from '../../core/auth/auth.store';
import { normalizeSpaces } from '../../core/auth/password-policy';
import { toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';

const AVATAR_STYLES = `
  .avatar {
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    flex-shrink: 0;
  }
`;

const initials = (profil: Profil) => `${profil.prenom.charAt(0)}${profil.nom.charAt(0)}`.toUpperCase();

/** Profil, consultation (écran 25). Avatar neutre à initiales ; seules les informations du compte sont affichées. */
@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, DataZone, Skeleton, FrDatePipe],
  styles: `
    ${AVATAR_STYLES}
    .avatar {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, var(--color-blue-royal), var(--color-cyan-circuit));
      color: #fff;
      font-size: 2.4rem;
      box-shadow: 0 0 30px rgba(56, 189, 248, 0.4);
    }
    .card {
      padding: 2.5rem;
      border-radius: 24px;
      max-width: 900px;
      margin: 0 auto;
    }
    .identity {
      display: flex;
      gap: 2rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .details {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-subtle);
    }
    @media (max-width: 600px) {
      .card {
        padding: 1.5rem;
      }
      .identity {
        gap: 1.25rem;
      }
    }
  `,
  template: `
    <div class="space-head" style="align-items: center">
      <h1 class="space-title" style="margin-bottom: 0">Mon profil</h1>
      <a class="btn btn-primary" routerLink="/espace/profil/modifier"><app-icon name="edit-2" [size]="16" /> Modifier le profil</a>
    </div>

    <app-data-zone [status]="profil.status()" emptyMessage="Votre profil est indisponible." (retry)="profil.load()">
      <div zone-skeleton class="glass-panel card">
        <div class="identity">
          <app-skeleton width="100px" height="100px" radius="50%" />
          <div style="flex: 1; min-width: 200px">
            <app-skeleton width="60%" height="1.8rem" />
            <div style="margin-top: 0.75rem"><app-skeleton width="80%" /></div>
          </div>
        </div>
        <div class="details"><app-skeleton height="3rem" /></div>
      </div>

      @if (profil.data(); as user) {
        <div class="glass-panel card">
          <div class="identity">
            <div class="avatar" aria-hidden="true">{{ initialsOf(user) }}</div>
            <div style="flex: 1; min-width: min(100%, 240px)">
              <div class="flex flex-wrap items-center gap-3" style="margin-bottom: 0.35rem">
                <h2 style="font-size: 1.6rem; font-weight: 800">{{ user.prenom }} {{ user.nom }}</h2>
                <app-badge [variant]="user.statut === 'ACTIF' ? 'success' : 'amber'">{{ statutLabels[user.statut] }}</app-badge>
              </div>
              @if (user.filiere) {
                <div class="accent-cyan" style="font-size: 0.95rem; font-weight: 600; margin-bottom: 0.6rem">{{ user.filiere }}</div>
              }
              @if (user.biographie) {
                <p style="font-size: 0.9rem; max-width: 580px; line-height: 1.5; white-space: pre-line">{{ user.biographie }}</p>
              } @else {
                <p style="font-size: 0.9rem; color: var(--text-muted); font-style: italic">Vous n’avez pas encore renseigné de présentation.</p>
              }
            </div>
          </div>

          <dl class="info-grid details">
            <div>
              <dt class="info-label">Adresse électronique</dt>
              <dd class="info-value">{{ user.email }}</dd>
            </div>
            @if (user.numeroMembre) {
              <div>
                <dt class="info-label">Numéro de membre</dt>
                <dd class="info-value">{{ user.numeroMembre }}</dd>
              </div>
            }
            @if (user.dateAdhesion) {
              <div>
                <dt class="info-label">Adhésion</dt>
                <dd class="info-value">{{ user.dateAdhesion | frDate: 'long' }}</dd>
              </div>
            }
            <div>
              <dt class="info-label">Rôle</dt>
              <dd class="info-value">{{ auth.primaryRoleLabel() }}</dd>
            </div>
          </dl>
        </div>
      }
    </app-data-zone>
  `,
})
export class ProfilePage {
  private readonly api = inject(MemberApi);
  protected readonly auth = inject(AuthStore);
  protected readonly profil = new ResourceState<Profil>(() => this.api.profil());
  protected readonly statutLabels = STATUT_COMPTE_LABELS;
  protected readonly initialsOf = initials;

  constructor() {
    inject(SeoService).apply({ title: 'Mon profil', noindex: true });
    this.profil.load();
    inject(DestroyRef).onDestroy(() => this.profil.destroy());
  }
}

const BIO_MAX = 500;

/** Profil, édition (écran 26) : prénom, nom, filière en saisie libre et présentation. */
@Component({
  selector: 'app-profile-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Field, FieldControl, DataZone, Skeleton],
  styles: `
    ${AVATAR_STYLES}
    .avatar {
      width: 90px;
      height: 90px;
      background: var(--bg-surface);
      border: 2px solid var(--color-cyan-circuit);
      color: var(--accent-active);
      font-size: 2rem;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.3);
    }
    .card {
      padding: 2.75rem;
      max-width: 800px;
      margin: 0 auto;
      border-radius: 24px;
    }
    .names {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1rem;
    }
    .actions {
      display: flex;
      gap: 1rem;
      margin-top: 0.75rem;
    }
    .actions .btn {
      border-radius: 12px;
      font-weight: 700;
    }
    @media (max-width: 600px) {
      .card {
        padding: 1.5rem;
      }
      .names {
        grid-template-columns: 1fr;
      }
      .actions {
        flex-direction: column;
      }
    }
  `,
  template: `
    <div class="space-head" style="align-items: center">
      <h1 class="space-title" style="margin-bottom: 0">Édition du profil</h1>
    </div>

    <app-data-zone [status]="profil.status()" emptyMessage="Votre profil est indisponible." (retry)="profil.load()">
      <div zone-skeleton class="glass-panel card">
        <app-skeleton width="90px" height="90px" radius="50%" />
        <div style="margin-top: 2rem"><app-skeleton height="3rem" /></div>
        <div style="margin-top: 1.25rem"><app-skeleton height="3rem" /></div>
        <div style="margin-top: 1.25rem"><app-skeleton height="6rem" /></div>
      </div>

      @if (profil.data(); as user) {
        <div class="glass-panel card">
          <div class="flex items-center gap-6" style="margin-bottom: 2rem">
            <div class="avatar" aria-hidden="true">{{ initials() }}</div>
            <div class="min-w-0">
              <strong style="display: block; overflow-wrap: anywhere">{{ user.email }}</strong>
              <span style="font-size: 0.78rem; color: var(--text-muted)">L’avatar reprend vos initiales.</span>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="names">
              <app-field label="Prénom" [required]="true" [serverError]="serverErrors()['prenom'] ?? null">
                <input appControl type="text" formControlName="prenom" autocomplete="given-name" />
              </app-field>
              <app-field label="Nom" [required]="true" [serverError]="serverErrors()['nom'] ?? null">
                <input appControl type="text" formControlName="nom" autocomplete="family-name" />
              </app-field>
            </div>

            <app-field
              label="Filière d’études"
              hint="Saisie libre : indiquez votre filière et votre niveau actuels à l’IST."
              [required]="true"
              [serverError]="serverErrors()['filiere'] ?? null"
            >
              <input appControl type="text" formControlName="filiere" />
            </app-field>

            <app-field label="Présentation" [hint]="bioHint" [serverError]="serverErrors()['biographie'] ?? null">
              <textarea appControl rows="4" formControlName="biographie"></textarea>
            </app-field>

            <div aria-live="assertive">
              @if (error(); as failure) {
                <p class="form-error" role="alert" style="margin-bottom: 1rem">{{ failure }}</p>
              }
            </div>

            <div class="actions">
              <button appBtn size="lg" type="submit" style="flex: 2" [loading]="pending()">Enregistrer les modifications</button>
              <a appBtn variant="amber" size="lg" routerLink="/espace/profil" style="flex: 1">Annuler</a>
            </div>
          </form>
        </div>
      }
    </app-data-zone>
  `,
})
export class ProfileEditPage {
  private readonly api = inject(MemberApi);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly bioHint = `Facultatif, ${BIO_MAX} caractères au maximum.`;
  protected readonly form = new FormGroup({
    prenom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)] }),
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)] }),
    filiere: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    biographie: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(BIO_MAX)] }),
  });
  protected readonly profil = new ResourceState<Profil>(() =>
    this.api.profil().pipe(tap((user) => this.form.reset({ prenom: user.prenom, nom: user.nom, filiere: user.filiere ?? '', biographie: user.biographie ?? '' }))),
  );
  protected readonly initials = computed(() => {
    const user = this.profil.data();
    return user ? initials(user) : '';
  });
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  constructor() {
    inject(SeoService).apply({ title: 'Édition du profil', noindex: true });
    this.profil.load();
    inject(DestroyRef).onDestroy(() => this.profil.destroy());
  }

  protected submit(): void {
    revealErrors(this.form);
    if (this.form.invalid || this.pending()) return;
    const value = this.form.getRawValue();
    this.pending.set(true);
    this.error.set(null);
    this.serverErrors.set({});
    this.api
      .modifierProfil({ prenom: normalizeSpaces(value.prenom), nom: normalizeSpaces(value.nom), filiere: normalizeSpaces(value.filiere), biographie: value.biographie.trim() })
      .subscribe({
        next: (user) => {
          this.auth.patchUser({ nom: user.nom, prenom: user.prenom });
          this.toasts.success('Votre profil est mis à jour.');
          void this.router.navigateByUrl('/espace/profil');
        },
        error: (failure: unknown) => {
          this.pending.set(false);
          const apiError = toApiError(failure);
          this.serverErrors.set(apiError.fieldMessages());
          if (apiError.kind !== 'server' && apiError.kind !== 'rate-limit') this.error.set(apiError.userMessage);
        },
      });
  }
}
