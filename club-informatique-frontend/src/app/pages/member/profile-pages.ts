import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { tap } from 'rxjs';
import { EXTENSIONS_IMAGES, TAILLE_MAXIMALE_PHOTO_OCTETS } from '../../core/api/files.api';
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
import { ProfilePhoto } from '../../shared/ui/file/profile-photo';
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

/** Profil, consultation (écran 25). Photo de profil, ou initiales à défaut ; seules les informations du compte sont affichées. */
@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, DataZone, Skeleton, FrDatePipe, ProfilePhoto],
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
            <div class="avatar" aria-hidden="true"><app-profile-photo [src]="user.photo">{{ initialsOf(user) }}</app-profile-photo></div>
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
const PHOTO_MAX_MO = TAILLE_MAXIMALE_PHOTO_OCTETS / (1024 * 1024);

/** Profil, édition (écran 26) : photo, prénom, nom, filière en saisie libre et présentation. */
@Component({
  selector: 'app-profile-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Field, FieldControl, DataZone, Skeleton, ProfilePhoto],
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
    .photo-input {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
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
            <div class="avatar" aria-hidden="true"><app-profile-photo [src]="photo()">{{ initials() }}</app-profile-photo></div>
            <div class="min-w-0">
              <strong style="display: block; overflow-wrap: anywhere; margin-bottom: 0.5rem">{{ user.email }}</strong>
              <input #champPhoto class="photo-input" type="file" [accept]="photoAccept" aria-label="Photo de profil" aria-describedby="aide-photo" tabindex="-1" (change)="onPhoto($event)" />
              <div class="flex flex-wrap gap-2">
                <button appBtn variant="secondary" size="sm" type="button" [loading]="photoPending()" (click)="champPhoto.click()">Changer la photo</button>
                @if (photo()) {
                  <button appBtn variant="ghost" size="sm" type="button" [disabled]="photoPending()" (click)="removePhoto()">Retirer la photo</button>
                }
              </div>
              <span id="aide-photo" style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 0.4rem">{{ photoHint }}</span>
              <div aria-live="assertive">
                @if (photoError(); as message) {
                  <p class="form-error" role="alert">{{ message }}</p>
                }
              </div>
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

  protected readonly photoAccept = EXTENSIONS_IMAGES.join(',');
  protected readonly photoHint = `PNG, JPG ou WebP, ${PHOTO_MAX_MO} Mo au plus. Sans photo, l’avatar reprend vos initiales.`;
  /** Photo modifiée depuis le chargement de la page ; « undefined » tant qu'elle ne l'a pas été. */
  private readonly photoChanged = signal<string | null | undefined>(undefined);
  protected readonly photo = computed(() => (this.photoChanged() === undefined ? (this.profil.data()?.photo ?? null) : (this.photoChanged() ?? null)));
  protected readonly photoPending = signal(false);
  protected readonly photoError = signal<string | null>(null);

  constructor() {
    inject(SeoService).apply({ title: 'Édition du profil', noindex: true });
    this.profil.load();
    inject(DestroyRef).onDestroy(() => this.profil.destroy());
  }

  protected onPhoto(event: Event): void {
    const champ = event.target as HTMLInputElement;
    const fichier = champ.files?.[0];
    champ.value = '';
    if (!fichier || this.photoPending()) return;
    const refus = photoRefusal(fichier);
    if (refus) {
      this.photoError.set(refus);
      return;
    }
    this.photoPending.set(true);
    this.photoError.set(null);
    this.api.deposerPhoto(fichier).subscribe({
      next: (user) => {
        this.photoPending.set(false);
        this.photoChanged.set(user.photo ?? null);
        this.toasts.success('Votre photo de profil est enregistrée.');
      },
      error: (failure: unknown) => {
        this.photoPending.set(false);
        this.photoError.set(photoFailure(toApiError(failure).status));
      },
    });
  }

  protected removePhoto(): void {
    if (this.photoPending()) return;
    this.photoPending.set(true);
    this.photoError.set(null);
    this.api.retirerPhoto().subscribe({
      next: () => {
        this.photoPending.set(false);
        this.photoChanged.set(null);
        this.toasts.success('Votre photo de profil est retirée.');
      },
      error: (failure: unknown) => {
        this.photoPending.set(false);
        this.photoError.set(photoFailure(toApiError(failure).status));
      },
    });
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

/** Contrôle local avant l’envoi ; le serveur reste seul juge du type réel du contenu. */
export function photoRefusal(fichier: File): string | null {
  const nom = fichier.name.toLowerCase();
  if (!EXTENSIONS_IMAGES.some((extension) => nom.endsWith(extension))) return 'Choisissez une image au format PNG, JPG ou WebP.';
  if (fichier.size === 0) return 'Ce fichier est vide.';
  if (fichier.size > TAILLE_MAXIMALE_PHOTO_OCTETS) return `Cette image dépasse ${PHOTO_MAX_MO} Mo.`;
  return null;
}

function photoFailure(statut: number): string {
  if (statut === 413) return `Cette image dépasse ${PHOTO_MAX_MO} Mo.`;
  if (statut === 415) return 'Ce fichier n’est pas une image acceptée : son contenu ne correspond pas à son extension.';
  if (statut === 0) return 'L’envoi a échoué. Vérifiez votre connexion, puis réessayez.';
  return 'Votre photo n’a pas pu être enregistrée. Réessayez dans quelques instants.';
}
