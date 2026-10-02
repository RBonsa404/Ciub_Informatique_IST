import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { ManagementApi } from '../../core/api/management.api';
import { MembreBureau } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
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

/** Rang proposé pour un nouveau membre : à la suite du dernier. */
export function nextOrder(members: readonly MembreBureau[]): number {
  return members.reduce((max, member) => Math.max(max, member.ordre), 0) + 1;
}

/**
 * Composition du bureau (page dérivée D5) : le Responsable saisit les membres réels du bureau,
 * affichés ensuite sur la page publique « Bureau ». Aucune photo : avatar neutre à initiales.
 */
@Component({
  selector: 'app-bureau-management-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Icon, Button, Field, FieldControl, DataZone, Skeleton],
  styles: `
    .panel {
      padding: 1.75rem;
      border-radius: 20px;
      margin-bottom: 2rem;
    }
    .form-panel {
      padding: 2rem;
      border-radius: 20px;
      scroll-margin-top: 1rem;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1.5rem;
    }
    td.actions {
      white-space: nowrap;
    }
    @media (max-width: 700px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .panel,
      .form-panel {
        padding: 1.25rem;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Composition du bureau</h1>
        <p class="space-lead">Les membres saisis ici sont affichés sur la page publique « Bureau », dans l’ordre indiqué.</p>
      </div>
      <button appBtn variant="amber" type="button" (click)="startCreate()"><app-icon name="plus" [size]="16" /> Ajouter un membre</button>
    </div>

    <app-data-zone [status]="members.status()" emptyMessage="La composition du bureau n’a pas encore été saisie." emptyIcon="award" (retry)="members.load()">
      <div zone-skeleton class="glass-panel panel">
        <app-skeleton height="2.5rem" />
        <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
        <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
      </div>
      <button zone-empty appBtn variant="secondary" size="sm" type="button" (click)="startCreate()">Ajouter un membre</button>

      <div class="glass-panel panel">
        <div class="table-responsive" tabindex="0" role="region" aria-label="Membres du bureau">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Ordre</th>
                <th scope="col">Membre</th>
                <th scope="col">Fonction</th>
                <th scope="col">Filière</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (member of members.data() ?? []; track member.id) {
                <tr>
                  <td>{{ member.ordre }}</td>
                  <td style="white-space: nowrap"><strong>{{ member.prenom }} {{ member.nom }}</strong></td>
                  <td>{{ member.fonction }}</td>
                  <td>{{ member.filiere || '—' }}</td>
                  <td class="actions">
                    <div class="flex items-center gap-2">
                      <button appBtn variant="secondary" size="sm" type="button" (click)="startEdit(member)">
                        Modifier<span class="sr-only"> {{ member.prenom }} {{ member.nom }}</span>
                      </button>
                      <button
                        appBtn
                        variant="ghost"
                        size="sm"
                        [iconOnly]="true"
                        type="button"
                        [attr.aria-label]="'Retirer ' + member.prenom + ' ' + member.nom"
                        [loading]="deletingId() === member.id"
                        (click)="remove(member)"
                      >
                        <app-icon name="trash-2" [size]="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </app-data-zone>

    @if (editing(); as target) {
      <section #formSection class="glass-panel form-panel" aria-labelledby="titre-membre" tabindex="-1">
        <h2 id="titre-membre" style="font-size: 1.2rem; font-weight: 700; margin-bottom: 1.5rem">{{ target === 'nouveau' ? 'Ajouter un membre du bureau' : 'Modifier un membre du bureau' }}</h2>
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="grid">
            <app-field label="Prénom" [required]="true" [serverError]="serverErrors()['prenom'] ?? null">
              <input appControl type="text" formControlName="prenom" />
            </app-field>
            <app-field label="Nom" [required]="true" [serverError]="serverErrors()['nom'] ?? null">
              <input appControl type="text" formControlName="nom" />
            </app-field>
            <app-field label="Fonction" hint="Par exemple : présidente, secrétaire général, trésorier." [required]="true" [serverError]="serverErrors()['fonction'] ?? null">
              <input appControl type="text" formControlName="fonction" />
            </app-field>
            <app-field label="Filière" hint="Facultatif, saisie libre." [serverError]="serverErrors()['filiere'] ?? null">
              <input appControl type="text" formControlName="filiere" />
            </app-field>
            <app-field label="Ordre d’affichage" [required]="true" [messages]="{ min: 'L’ordre commence à 1.' }" [serverError]="serverErrors()['ordre'] ?? null">
              <input appControl type="number" min="1" inputmode="numeric" formControlName="ordre" />
            </app-field>
          </div>
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
export class BureauManagementPage {
  private readonly api = inject(ManagementApi);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly formSection = viewChild<ElementRef<HTMLElement>>('formSection');

  protected readonly members = new ResourceState<readonly MembreBureau[]>(() => this.api.bureau().pipe(map((list) => [...list].sort((a, b) => a.ordre - b.ordre))));
  protected readonly editing = signal<MembreBureau | 'nouveau' | null>(null);
  protected readonly pending = signal(false);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});
  private readonly suggestedOrder = computed(() => nextOrder(this.members.data() ?? []));

  protected readonly form = new FormGroup({
    prenom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    fonction: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    filiere: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    ordre: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
  });

  constructor() {
    inject(SeoService).apply({ title: 'Composition du bureau', noindex: true });
    this.members.load();
    inject(DestroyRef).onDestroy(() => this.members.destroy());
  }

  protected startCreate(): void {
    this.form.reset({ ordre: this.suggestedOrder() });
    this.open('nouveau');
  }

  protected startEdit(member: MembreBureau): void {
    this.form.reset({ prenom: member.prenom, nom: member.nom, fonction: member.fonction, filiere: member.filiere ?? '', ordre: member.ordre });
    this.open(member);
  }

  private open(target: MembreBureau | 'nouveau'): void {
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
    const payload = {
      prenom: normalizeSpaces(value.prenom),
      nom: normalizeSpaces(value.nom),
      fonction: normalizeSpaces(value.fonction),
      filiere: normalizeSpaces(value.filiere) || null,
      ordre: Math.round(value.ordre ?? 1),
    };
    this.pending.set(true);
    this.error.set(null);
    this.serverErrors.set({});
    (target === 'nouveau' ? this.api.creerMembreBureau(payload) : this.api.modifierMembreBureau(target.id, payload)).subscribe({
      next: () => {
        this.pending.set(false);
        this.editing.set(null);
        this.members.load();
        this.toasts.success(target === 'nouveau' ? 'Le membre est ajouté au bureau.' : 'Le membre du bureau est mis à jour.');
      },
      error: (failure: unknown) => {
        this.pending.set(false);
        const apiError = toApiError(failure);
        this.serverErrors.set(apiError.fieldMessages());
        if (apiError.kind !== 'server' && apiError.kind !== 'rate-limit') this.error.set(apiError.userMessage);
      },
    });
  }

  protected remove(member: MembreBureau): void {
    this.dialogs
      .confirm({ title: 'Retirer du bureau', message: `Souhaitez-vous retirer ${member.prenom} ${member.nom} de la composition du bureau ?`, confirmLabel: 'Retirer', danger: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.deletingId.set(member.id);
        this.api.supprimerMembreBureau(member.id).subscribe({
          next: () => {
            this.deletingId.set(null);
            this.members.load();
            this.toasts.success('Le membre est retiré du bureau.');
          },
          error: (failure: unknown) => {
            this.deletingId.set(null);
            const error = toApiError(failure);
            if (error.kind !== 'server' && error.kind !== 'rate-limit') this.toasts.danger(error.userMessage);
          },
        });
      });
  }
}
