import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, map } from 'rxjs';
import { AdminApi, PermissionDefinition, RoleDefinition } from '../../core/api/admin.api';
import { Categorie } from '../../core/api/models';
import { PublicApi } from '../../core/api/public.api';
import { ResourceState } from '../../core/api/resource-state';
import { ROLE_LABELS, ROLE_PRIORITY, Role } from '../../core/auth/auth.models';
import { normalizeSpaces } from '../../core/auth/password-policy';
import { toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { Button } from '../../shared/ui/button/button';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';

export interface Matrix {
  readonly roles: readonly Role[];
  readonly rows: readonly { readonly permission: PermissionDefinition; readonly granted: readonly boolean[] }[];
}

/** Matrice des droits effectifs : une ligne par permission, une colonne par rôle (du moins élevé au plus élevé). */
export function toMatrix(roles: readonly RoleDefinition[], permissions: readonly PermissionDefinition[]): Matrix {
  const ordered = [...ROLE_PRIORITY].reverse().filter((role) => roles.some((definition) => definition.role === role));
  const granted = new Map(roles.map((definition) => [definition.role, new Set(definition.permissions)]));
  return {
    roles: ordered,
    rows: [...permissions]
      .sort((a, b) => a.nom.localeCompare(b.nom))
      .map((permission) => ({ permission, granted: ordered.map((role) => granted.get(role)?.has(permission.nom) ?? false) })),
  };
}

/** Rôles et permissions (écran 53, décision D-07) : matrice en lecture seule des droits effectifs renvoyés par le serveur. */
@Component({
  selector: 'app-roles-matrix-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, DataZone, Skeleton],
  styles: `
    .panel {
      padding: 2rem;
      border-radius: 24px;
    }
    td.cell,
    th.cell {
      text-align: center;
    }
    /* L'en-tête de ligne garde l'apparence d'une cellule de contenu. */
    tbody th {
      background: transparent;
      color: var(--text-primary);
      font-family: inherit;
      font-weight: 600;
      padding: 0.95rem 1.1rem;
      white-space: normal;
      min-width: 220px;
    }
    .yes {
      color: var(--badge-success-text);
    }
    .no {
      color: var(--text-muted);
    }
    .code {
      display: block;
      font-size: 0.72rem;
      color: var(--text-muted);
      font-weight: 400;
    }
    .note {
      display: flex;
      gap: 0.6rem;
      align-items: flex-start;
      font-size: 0.85rem;
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-subtle);
    }
    .note app-icon {
      color: var(--accent-active);
      margin-top: 0.15rem;
    }
    @media (max-width: 600px) {
      .panel {
        padding: 1rem;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Matrice des rôles et des permissions</h1>
        <p class="space-lead">Droits effectifs de chaque rôle sur la plateforme.</p>
      </div>
    </div>

    <app-data-zone [status]="state.status()" emptyMessage="Aucune permission n’est définie." emptyIcon="shield" (retry)="state.load()">
      <div zone-skeleton class="glass-panel panel">
        <app-skeleton height="2.5rem" />
        <div style="margin-top: 0.75rem"><app-skeleton height="16rem" /></div>
      </div>

      @if (state.data(); as matrix) {
        <div class="glass-panel panel">
          <div class="table-responsive" tabindex="0" role="region" aria-label="Matrice des permissions">
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">Permission</th>
                  @for (role of matrix.roles; track role) {
                    <th scope="col" class="cell">{{ roleLabels[role] }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of matrix.rows; track row.permission.nom) {
                  <tr>
                    <th scope="row" class="row-head">
                      {{ row.permission.description || row.permission.nom }}
                      <span class="code">{{ row.permission.nom }}</span>
                    </th>
                    @for (granted of row.granted; track $index) {
                      <td class="cell">
                        @if (granted) {
                          <app-icon class="yes" name="check" [size]="18" /><span class="sr-only">Accordée</span>
                        } @else {
                          <app-icon class="no" name="minus" [size]="18" /><span class="sr-only">Non accordée</span>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="note">
            <app-icon name="info" [size]="16" />
            <span>Cette matrice est en lecture seule. L’attribution d’un rôle à une personne se fait depuis la fiche de son compte.</span>
          </p>
        </div>
      }
    </app-data-zone>
  `,
})
export class RolesMatrixPage {
  private readonly api = inject(AdminApi);
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly state = new ResourceState<Matrix>(
    () => forkJoin([this.api.roles(), this.api.permissions()]).pipe(map(([roles, permissions]) => toMatrix(roles, permissions))),
    (matrix) => matrix.rows.length === 0,
  );

  constructor() {
    inject(SeoService).apply({ title: 'Rôles et permissions', noindex: true });
    this.state.load();
    inject(DestroyRef).onDestroy(() => this.state.destroy());
  }
}

const DEFAULT_COLOR = '#1d4ed8';
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Catégories (écran 54, UC-25) : thématiques des formations, événements, projets et actualités. */
@Component({
  selector: 'app-categories-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Icon, Button, Field, FieldControl, DataZone, Skeleton],
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .category {
      padding: 1.5rem;
      border-radius: 18px;
      display: flex;
      flex-direction: column;
    }
    .name {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 1.05rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    .dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex-shrink: 0;
      border: 1px solid var(--border-subtle);
    }
    .form-panel {
      padding: 2rem;
      border-radius: 20px;
      max-width: 700px;
      scroll-margin-top: 1rem;
    }
    input[type='color'] {
      width: 64px;
      height: 44px;
      padding: 0.25rem;
      cursor: pointer;
    }
    @media (max-width: 600px) {
      .form-panel {
        padding: 1.25rem;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Gestion des catégories</h1>
        <p class="space-lead">Structurez les thématiques des formations, des événements, des projets et des actualités.</p>
      </div>
      <button appBtn type="button" (click)="startCreate()"><app-icon name="plus" [size]="16" /> Nouvelle catégorie</button>
    </div>

    <app-data-zone [status]="categories.status()" emptyMessage="Aucune catégorie n’est définie." emptyIcon="folder" (retry)="categories.load()">
      <div zone-skeleton class="grid">
        <app-skeleton height="150px" radius="18px" />
        <app-skeleton height="150px" radius="18px" />
        <app-skeleton height="150px" radius="18px" />
      </div>

      <ul class="grid">
        @for (category of categories.data() ?? []; track category.id) {
          <li class="glass-panel category">
            <h2 class="name"><span class="dot" aria-hidden="true" [style.background]="colorOf(category)"></span>{{ category.nom }}</h2>
            <p style="font-size: 0.85rem; margin-bottom: 1.25rem; flex: 1">{{ category.description }}</p>
            <div class="flex flex-wrap gap-2">
              <button appBtn variant="secondary" size="sm" type="button" (click)="startEdit(category)">Modifier<span class="sr-only"> {{ category.nom }}</span></button>
              <button appBtn variant="outline" size="sm" type="button" [loading]="deletingId() === category.id" (click)="remove(category)">
                Supprimer<span class="sr-only"> {{ category.nom }}</span>
              </button>
            </div>
          </li>
        }
      </ul>
    </app-data-zone>

    @if (editing(); as target) {
      <section #formSection class="glass-panel form-panel" aria-labelledby="titre-categorie" tabindex="-1">
        <h2 id="titre-categorie" style="font-size: 1.2rem; font-weight: 700; margin-bottom: 1.5rem">{{ target === 'nouveau' ? 'Nouvelle catégorie' : 'Modifier une catégorie' }}</h2>
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <app-field label="Nom" [required]="true" [serverError]="serverErrors()['nom'] ?? null">
            <input appControl type="text" formControlName="nom" />
          </app-field>
          <app-field label="Description" hint="Facultatif." [serverError]="serverErrors()['description'] ?? null">
            <textarea appControl rows="3" formControlName="description"></textarea>
          </app-field>
          <app-field label="Couleur du repère" [serverError]="serverErrors()['couleur'] ?? null">
            <input appControl type="color" formControlName="couleur" />
          </app-field>
          <div aria-live="assertive">
            @if (error(); as failure) {
              <p class="form-error" role="alert" style="margin-bottom: 1rem">{{ failure }}</p>
            }
          </div>
          <div class="flex flex-wrap justify-end gap-3">
            <button appBtn variant="secondary" size="sm" type="button" (click)="editing.set(null)">Annuler</button>
            <button appBtn size="sm" type="submit" [loading]="pending()">Enregistrer</button>
          </div>
        </form>
      </section>
    }
  `,
})
export class CategoriesPage {
  private readonly api = inject(AdminApi);
  private readonly publicApi = inject(PublicApi);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly formSection = viewChild<ElementRef<HTMLElement>>('formSection');

  protected readonly categories = new ResourceState<readonly Categorie[]>(() => this.publicApi.categories());
  protected readonly editing = signal<Categorie | 'nouveau' | null>(null);
  protected readonly pending = signal(false);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    couleur: new FormControl(DEFAULT_COLOR, { nonNullable: true }),
  });

  constructor() {
    inject(SeoService).apply({ title: 'Gestion des catégories', noindex: true });
    this.categories.load();
    inject(DestroyRef).onDestroy(() => this.categories.destroy());
  }

  /** Couleur enregistrée si elle est valide, sinon la couleur par défaut du produit. */
  protected colorOf(category: Categorie): string {
    return category.couleur && COLOR_PATTERN.test(category.couleur) ? category.couleur : DEFAULT_COLOR;
  }

  protected startCreate(): void {
    this.form.reset({ couleur: DEFAULT_COLOR });
    this.open('nouveau');
  }

  protected startEdit(category: Categorie): void {
    this.form.reset({ nom: category.nom, description: category.description ?? '', couleur: this.colorOf(category) });
    this.open(category);
  }

  private open(target: Categorie | 'nouveau'): void {
    this.error.set(null);
    this.serverErrors.set({});
    this.editing.set(target);
    setTimeout(() => {
      const element = this.formSection()?.nativeElement;
      if (!element) return;
      if (typeof element.scrollIntoView === 'function') element.scrollIntoView({ block: 'start' });
      element.focus({ preventScroll: true });
    });
  }

  protected submit(): void {
    revealErrors(this.form);
    const target = this.editing();
    if (this.form.invalid || this.pending() || !target) return;
    const value = this.form.getRawValue();
    const payload = { nom: normalizeSpaces(value.nom), description: value.description.trim(), couleur: value.couleur };
    this.pending.set(true);
    this.error.set(null);
    this.serverErrors.set({});
    (target === 'nouveau' ? this.api.creerCategorie(payload) : this.api.modifierCategorie(target.id, payload)).subscribe({
      next: () => {
        this.pending.set(false);
        this.editing.set(null);
        this.categories.refresh();
        this.toasts.success(target === 'nouveau' ? 'La catégorie est créée.' : 'La catégorie est mise à jour.');
      },
      error: (failure: unknown) => {
        this.pending.set(false);
        const apiError = toApiError(failure);
        this.serverErrors.set(apiError.fieldMessages());
        if (apiError.kind !== 'server' && apiError.kind !== 'rate-limit') this.error.set(apiError.userMessage);
      },
    });
  }

  protected remove(category: Categorie): void {
    this.dialogs
      .confirm({
        title: 'Supprimer la catégorie',
        message: `Souhaitez-vous supprimer la catégorie « ${category.nom} » ? Une catégorie encore utilisée par des contenus ne peut pas être supprimée.`,
        confirmLabel: 'Supprimer',
        danger: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.deletingId.set(category.id);
        this.api.supprimerCategorie(category.id).subscribe({
          next: () => {
            this.deletingId.set(null);
            this.categories.load();
            this.toasts.success('La catégorie est supprimée.');
          },
          error: (failure: unknown) => {
            this.deletingId.set(null);
            const error = toApiError(failure);
            if (error.kind !== 'server' && error.kind !== 'rate-limit') this.toasts.danger(error.kind === 'conflict' ? 'Cette catégorie est encore utilisée par des contenus.' : error.userMessage);
          },
        });
      });
  }
}
