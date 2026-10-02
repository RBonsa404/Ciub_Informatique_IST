import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { tap } from 'rxjs';
import { Categorie, Projet, STATUT_PROJET_LABELS } from '../../core/api/models';
import { ProjectsApi } from '../../core/api/projects.api';
import { PublicApi } from '../../core/api/public.api';
import { ResourceState } from '../../core/api/resource-state';
import { toApiError } from '../../core/http/problem';
import { BreadcrumbService } from '../../core/navigation/breadcrumb.service';
import { SeoService } from '../../core/seo/seo.service';
import { FrNumberPipe } from '../../shared/format/format';
import { PROJECT_BADGES, ProjectSummary, progressValue } from '../../shared/project/project-summary';
import { Badge } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone, PagedList } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';

const PAGE_SIZE = 8;

/** Suivi des projets par le formateur (écran 41, UC-17) : projets validés du club, avancement réel. */
@Component({
  selector: 'app-trainer-projects-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, Pagination, DataZone, Skeleton, FrNumberPipe],
  styles: `
    .counter {
      padding: 1.5rem;
      border-radius: 18px;
      display: inline-flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 2rem;
      min-width: min(100%, 260px);
    }
    .counter-icon {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent-active);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .counter-value {
      font-size: 1.8rem;
      font-weight: 800;
      font-family: var(--font-heading);
      line-height: 1;
    }
    .rows {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .project {
      padding: 1.5rem;
      border-radius: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .tile {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: rgba(29, 78, 216, 0.25);
      color: var(--accent-active);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    @media (max-width: 600px) {
      .tile {
        display: none;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Suivi des projets</h1>
        <p class="space-lead">Accompagnez les équipes : notez votre suivi et l’avancement des projets validés par le bureau.</p>
      </div>
    </div>

    @if (total() !== null) {
      <div class="glass-panel counter">
        <div class="counter-icon" aria-hidden="true"><app-icon name="search" [size]="24" /></div>
        <div>
          <div class="counter-value">{{ total() | frNumber }}</div>
          <span style="font-size: 0.85rem; color: var(--text-muted)">{{ total() === 1 ? 'projet validé' : 'projets validés' }}</span>
        </div>
      </div>
    }

    @if (categories().length > 0) {
      <div class="chip-row" role="group" aria-label="Filtrer par catégorie" style="margin-bottom: 1.5rem">
        <button type="button" class="btn btn-sm" [class.btn-primary]="list.categorieId() === null" [class.btn-secondary]="list.categorieId() !== null" [attr.aria-pressed]="list.categorieId() === null" (click)="list.setCategorie(null)">
          Tous
        </button>
        @for (categorie of categories(); track categorie.id) {
          <button
            type="button"
            class="btn btn-sm"
            [class.btn-primary]="list.categorieId() === categorie.id"
            [class.btn-secondary]="list.categorieId() !== categorie.id"
            [attr.aria-pressed]="list.categorieId() === categorie.id"
            (click)="list.setCategorie(categorie.id)"
          >
            {{ categorie.nom }}
          </button>
        }
      </div>
    }

    <app-data-zone
      [status]="list.status()"
      [emptyMessage]="list.filtered() ? 'Aucun projet validé dans cette catégorie.' : 'Aucun projet n’est encore validé.'"
      emptyIcon="activity"
      (retry)="list.reload()"
    >
      <div zone-skeleton class="rows">
        <app-skeleton height="120px" radius="20px" />
        <app-skeleton height="120px" radius="20px" />
      </div>

      <ul class="rows">
        @for (project of list.items(); track project.id) {
          @let progress = progressOf(project);
          <li class="glass-panel project">
            <div class="flex min-w-0 gap-5" style="flex: 1 1 320px">
              <div class="tile" aria-hidden="true"><app-icon name="code" [size]="24" /></div>
              <div class="min-w-0" style="flex: 1">
                <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.25rem">{{ project.titre }}</h2>
                <p style="font-size: 0.85rem; margin-bottom: 0.75rem">
                  @if (project.porteurNom) {
                    Porté par {{ project.porteurNom }}
                  }
                </p>
                @if (progress !== null) {
                  <div class="flex items-center gap-3">
                    <div
                      class="progress"
                      style="flex: 1; max-width: 320px"
                      role="progressbar"
                      [attr.aria-label]="'Avancement de ' + project.titre"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      [attr.aria-valuenow]="progress"
                    >
                      <span [style.width.%]="progress"></span>
                    </div>
                    <span class="accent-cyan" style="font-size: 0.85rem; font-weight: 700">{{ progress | frNumber }} %</span>
                  </div>
                }
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <app-badge [variant]="badges[project.statut]">{{ labels[project.statut] }}</app-badge>
              <a class="btn btn-primary btn-sm" [routerLink]="['/espace/formateur/projets', project.id]">Suivre le projet<span class="sr-only"> {{ project.titre }}</span></a>
            </div>
          </li>
        }
      </ul>
      <app-pagination [page]="list.page()" [totalPages]="list.totalPages()" label="Pages des projets" (pageChange)="list.goTo($event)" />
    </app-data-zone>
  `,
})
export class TrainerProjectsPage {
  private readonly api = inject(ProjectsApi);
  private readonly publicApi = inject(PublicApi);

  protected readonly labels = STATUT_PROJET_LABELS;
  protected readonly badges = PROJECT_BADGES;
  protected readonly progressOf = progressValue;

  /** Nombre réel de projets validés ; inconnu tant que le serveur n'a pas répondu, et sous filtre. */
  protected readonly total = signal<number | null>(null);
  protected readonly list = new PagedList<Projet>(
    (query) =>
      this.api.publies({ page: query.page, size: query.size, categorieId: query.categorieId }).pipe(
        tap((page) => {
          if (query.categorieId === null || query.categorieId === undefined) this.total.set(page.totalElements);
        }),
      ),
    PAGE_SIZE,
  );
  private readonly categoriesState = new ResourceState<readonly Categorie[]>(() => this.publicApi.categories());
  protected readonly categories = computed(() => this.categoriesState.data() ?? []);

  constructor() {
    inject(SeoService).apply({ title: 'Suivi des projets', noindex: true });
    this.categoriesState.load();
    inject(DestroyRef).onDestroy(() => this.categoriesState.destroy());
  }
}

/** Suivi d'un projet par le formateur (dérivé de l'écran 41) : note de suivi et avancement. */
@Component({
  selector: 'app-trainer-project-follow-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Icon, Button, Field, FieldControl, DataZone, Skeleton, ProjectSummary],
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    .panel {
      padding: 1.75rem;
      border-radius: 20px;
    }
    @media (max-width: 1000px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
  template: `
    <div class="space-head" style="align-items: center">
      <h1 class="space-title" style="margin-bottom: 0">Suivi d’un projet</h1>
      <a class="btn btn-secondary btn-sm" routerLink="/espace/formateur/projets"><app-icon name="arrow-left" [size]="14" /> Retour aux projets</a>
    </div>

    <app-data-zone [status]="project.status()" emptyMessage="Ce projet est indisponible." [errorMessage]="loadError()" (retry)="project.load()">
      <div zone-skeleton class="layout">
        <app-skeleton height="360px" radius="24px" />
        <app-skeleton height="280px" radius="20px" />
      </div>

      @if (project.data(); as item) {
        <div class="layout">
          <app-project-summary [projet]="item" />

          <form class="glass-panel panel" [formGroup]="form" (ngSubmit)="submit(item)" novalidate>
            <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1.25rem">Suivi du formateur</h2>
            <app-field
              label="Avancement (en %)"
              [required]="true"
              [messages]="{ min: 'L’avancement est compris entre 0 et 100.', max: 'L’avancement est compris entre 0 et 100.' }"
              [serverError]="serverErrors()['avancementPourcentage'] ?? null"
            >
              <input appControl type="number" min="0" max="100" step="5" inputmode="numeric" formControlName="avancement" />
            </app-field>
            <app-field label="Note de suivi" hint="Visible sur la fiche publique du projet." [serverError]="serverErrors()['suiviFormateur'] ?? null">
              <textarea appControl rows="6" formControlName="note"></textarea>
            </app-field>
            <div aria-live="assertive">
              @if (error(); as failure) {
                <p class="form-error" role="alert" style="margin-bottom: 1rem">{{ failure }}</p>
              }
            </div>
            <button appBtn type="submit" [block]="true" [loading]="pending()">Enregistrer le suivi</button>
          </form>
        </div>
      }
    </app-data-zone>
  `,
})
export class TrainerProjectFollowPage {
  readonly id = input.required<string>();

  private readonly api = inject(ProjectsApi);
  private readonly toasts = inject(ToastService);
  private readonly breadcrumb = inject(BreadcrumbService);

  protected readonly form = new FormGroup({
    avancement: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0), Validators.max(100)] }),
    note: new FormControl('', { nonNullable: true }),
  });
  protected readonly project = new ResourceState<Projet>(() =>
    this.api.projet(Number(this.id())).pipe(
      tap((item) => {
        this.form.reset({ avancement: progressValue(item) ?? 0, note: item.suiviFormateur ?? '' });
        this.breadcrumb.set([{ label: 'Projets suivis', route: '/espace/formateur/projets' }, { label: item.titre }]);
      }),
    ),
  );
  protected readonly loadError = computed(() => (this.project.error()?.kind === 'not-found' ? 'Ce projet est introuvable.' : null));
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  constructor() {
    inject(SeoService).apply({ title: 'Suivi d’un projet', noindex: true });
    const subscription = toObservable(this.id).subscribe(() => this.project.load());
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      this.project.destroy();
    });
  }

  protected submit(item: Projet): void {
    revealErrors(this.form);
    if (this.form.invalid || this.pending()) return;
    const value = this.form.getRawValue();
    this.pending.set(true);
    this.error.set(null);
    this.serverErrors.set({});
    this.api.enregistrerSuivi(item.id, { suiviFormateur: value.note.trim(), avancementPourcentage: Math.round(value.avancement ?? 0) }).subscribe({
      next: () => {
        this.pending.set(false);
        this.project.refresh();
        this.toasts.success('Le suivi du projet est enregistré.');
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
