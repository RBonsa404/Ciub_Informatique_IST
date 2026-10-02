import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { tap } from 'rxjs';
import { Page } from '../../core/api/api-client';
import { Categorie, Formation, NIVEAU_LABELS, NiveauFormation } from '../../core/api/models';
import { PublicApi } from '../../core/api/public.api';
import { ResourceState } from '../../core/api/resource-state';
import { TrainerApi } from '../../core/api/trainer.api';
import { AuthStore } from '../../core/auth/auth.store';
import { normalizeSpaces } from '../../core/auth/password-policy';
import { toApiError } from '../../core/http/problem';
import { BreadcrumbService } from '../../core/navigation/breadcrumb.service';
import { SeoService } from '../../core/seo/seo.service';
import { FrNumberPipe } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { Switch } from '../../shared/ui/toggle/toggle';
import { SessionProgress, enrolledLabel, enrolledOf, ownedBy, progressOf } from './trainer-model';

type CourseFilter = 'tous' | 'publies' | 'brouillons';

const FILTERS: readonly { key: CourseFilter; label: string; publie: boolean | null }[] = [
  { key: 'tous', label: 'Tous', publie: null },
  { key: 'publies', label: 'Publiés', publie: true },
  { key: 'brouillons', label: 'Brouillons', publie: false },
];

const EMPTY_MESSAGES: Record<CourseFilter, string> = {
  tous: 'Vous n’avez encore créé aucun cours.',
  publies: 'Aucun de vos cours n’est publié.',
  brouillons: 'Vous n’avez aucun cours en brouillon.',
};

const PAGE_SIZE = 9;

/** Gestion des cours, liste (écran 36) : cours du formateur, état de publication et avancement réel des séances. */
@Component({
  selector: 'app-courses-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, Pagination, DataZone, Skeleton, FrNumberPipe],
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr));
      gap: 1.75rem;
      margin-bottom: 2rem;
    }
    .course {
      padding: 1.75rem;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
    }
    .course.published {
      border-top: 4px solid var(--color-blue-royal);
    }
    .summary {
      font-size: 0.85rem;
      line-height: 1.5;
      margin-bottom: 1.25rem;
      flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .actions {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }
    .actions .btn {
      flex: 1 1 auto;
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Gestion des cours</h1>
        <p class="space-lead">Les formations que vous animez, leurs séances et leurs supports.</p>
      </div>
      <a class="btn btn-primary" routerLink="/espace/formateur/cours/nouveau"><app-icon name="plus" [size]="16" /> Créer un cours</a>
    </div>

    <div class="chip-row" role="group" aria-label="Filtrer les cours">
      @for (option of filters; track option.key) {
        <button
          type="button"
          class="btn btn-sm"
          [class.btn-primary]="filter() === option.key"
          [class.btn-secondary]="filter() !== option.key"
          [attr.aria-pressed]="filter() === option.key"
          (click)="setFilter(option.key)"
        >
          {{ option.label }}
        </button>
      }
    </div>

    <app-data-zone [status]="status()" [emptyMessage]="emptyMessage()" emptyIcon="book-open" (retry)="state.load()">
      <div zone-skeleton class="grid">
        <app-skeleton height="260px" radius="20px" />
        <app-skeleton height="260px" radius="20px" />
        <app-skeleton height="260px" radius="20px" />
      </div>
      @if (filter() === 'tous') {
        <a zone-empty class="btn btn-secondary btn-sm" routerLink="/espace/formateur/cours/nouveau">Créer un cours</a>
      }

      <ul class="grid">
        @for (course of items(); track course.id) {
          <li class="glass-panel course" [class.published]="course.publie">
            <div class="flex flex-wrap items-center justify-between gap-2" style="margin-bottom: 1rem">
              <app-badge [variant]="course.publie ? 'primary' : 'neutral'">{{ course.publie ? 'Publié' : 'Brouillon' }}</app-badge>
              <span class="accent-cyan" style="font-size: 0.82rem; font-weight: 600">{{ enrolled(course) }}</span>
            </div>
            <h2 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem">{{ course.titre }}</h2>
            <p class="summary">{{ course.description }}</p>

            @let progress = progressOf(course);
            <div style="margin-bottom: 1.5rem">
              @if (progress.total > 0) {
                <div class="flex justify-between" style="font-size: 0.78rem; margin-bottom: 0.4rem; color: var(--text-muted)">
                  <span [id]="'progression-' + course.id">Progression des séances</span>
                  <span>{{ progress.done | frNumber }} / {{ progress.total | frNumber }} {{ progress.total > 1 ? 'séances' : 'séance' }}</span>
                </div>
                <div
                  class="progress"
                  role="progressbar"
                  [attr.aria-labelledby]="'progression-' + course.id"
                  aria-valuemin="0"
                  [attr.aria-valuemax]="progress.total"
                  [attr.aria-valuenow]="progress.done"
                >
                  <span [style.width.%]="percent(progress)"></span>
                </div>
              } @else {
                <span style="font-size: 0.78rem; color: var(--text-muted)">Aucune séance planifiée</span>
              }
            </div>

            <div class="actions">
              <a class="btn btn-secondary btn-sm" [routerLink]="['/espace/formateur/cours', course.id, 'modifier']">
                Modifier<span class="sr-only"> {{ course.titre }}</span>
              </a>
              <a class="btn btn-primary btn-sm" [routerLink]="['/espace/formateur/cours', course.id]">
                Détail et supports<span class="sr-only"> de {{ course.titre }}</span>
              </a>
            </div>
          </li>
        }
      </ul>
      <app-pagination [page]="page()" [totalPages]="totalPages()" label="Pages des cours" (pageChange)="goTo($event)" />
    </app-data-zone>
  `,
})
export class CoursesListPage {
  private readonly api = inject(TrainerApi);
  private readonly auth = inject(AuthStore);

  protected readonly filters = FILTERS;
  protected readonly progressOf = progressOf;
  protected readonly filter = signal<CourseFilter>('tous');
  protected readonly page = signal(0);

  protected readonly state = new ResourceState<Page<Formation>>(() => this.api.cours({ page: this.page(), size: PAGE_SIZE, publie: this.wanted() }));
  protected readonly items = computed(() => {
    const wanted = this.wanted();
    return (this.state.data()?.content ?? []).filter(ownedBy(this.auth.user()?.id)).filter((course) => wanted === null || !!course.publie === wanted);
  });
  protected readonly status = computed(() => (this.state.status() === 'ready' && this.items().length === 0 ? 'empty' : this.state.status()));
  protected readonly totalPages = computed(() => this.state.data()?.totalPages ?? 0);
  protected readonly emptyMessage = computed(() => EMPTY_MESSAGES[this.filter()]);

  constructor() {
    inject(SeoService).apply({ title: 'Gestion des cours', noindex: true });
    this.state.load();
    inject(DestroyRef).onDestroy(() => this.state.destroy());
  }

  private wanted(): boolean | null {
    return FILTERS.find((option) => option.key === this.filter())?.publie ?? null;
  }

  protected setFilter(filter: CourseFilter): void {
    if (filter === this.filter()) return;
    this.filter.set(filter);
    this.page.set(0);
    this.state.load();
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.state.load();
  }

  protected enrolled(course: Formation): string {
    return (course.sessions ?? []).length > 0 ? enrolledLabel(enrolledOf(course)) : '';
  }

  protected percent(progress: SessionProgress): number {
    return progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  }
}

const PREREQUIS_MAX = 500;
const NIVEAUX: readonly NiveauFormation[] = ['DEBUTANT', 'INTERMEDIAIRE', 'AVANCE'];

/** Création et édition d'un cours (écran 37). Les séances, la capacité et le lieu se gèrent depuis le détail du cours. */
@Component({
  selector: 'app-course-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Field, FieldControl, Switch, DataZone, Skeleton],
  styles: `
    .card {
      padding: 2.5rem;
      border-radius: 24px;
      max-width: 900px;
    }
    .row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 0 1.5rem;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      flex-wrap: wrap;
      padding-top: 1.5rem;
      margin-top: 0.5rem;
      border-top: 1px solid var(--border-subtle);
    }
    @media (max-width: 700px) {
      .card {
        padding: 1.5rem;
      }
      .row {
        grid-template-columns: 1fr;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">{{ editing() ? 'Édition d’un cours' : 'Création d’un cours' }}</h1>
        <p class="space-lead">Renseignez les informations de la formation proposée aux membres du club.</p>
      </div>
    </div>

    <app-data-zone [status]="status()" emptyMessage="Ce cours est indisponible." [errorMessage]="loadError()" (retry)="course.load()">
      <div zone-skeleton class="glass-panel card">
        <app-skeleton height="3rem" />
        <div style="margin-top: 1.5rem"><app-skeleton height="3rem" /></div>
        <div style="margin-top: 1.5rem"><app-skeleton height="8rem" /></div>
      </div>

      <form class="glass-panel card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="row">
          <app-field label="Intitulé du cours" [required]="true" [serverError]="serverErrors()['titre'] ?? null">
            <input appControl type="text" formControlName="titre" />
          </app-field>
          <app-field label="Niveau" [required]="true">
            <select appControl formControlName="niveau">
              @for (niveau of niveaux; track niveau) {
                <option [value]="niveau">{{ niveauLabels[niveau] }}</option>
              }
            </select>
          </app-field>
        </div>

        <app-field label="Domaine d’apprentissage" [serverError]="serverErrors()['categorieId'] ?? null">
          <select appControl formControlName="categorieId">
            <option [ngValue]="null">Aucun domaine</option>
            @for (categorie of categories(); track categorie.id) {
              <option [ngValue]="categorie.id">{{ categorie.nom }}</option>
            }
          </select>
        </app-field>

        <app-field label="Description" [required]="true" [serverError]="serverErrors()['description'] ?? null">
          <textarea appControl rows="5" formControlName="description"></textarea>
        </app-field>

        <app-field label="Objectifs pédagogiques" hint="Facultatif." [serverError]="serverErrors()['objectifs'] ?? null">
          <textarea appControl rows="3" formControlName="objectifs"></textarea>
        </app-field>

        <app-field label="Prérequis" [hint]="prerequisHint" [serverError]="serverErrors()['prerequis'] ?? null">
          <input appControl type="text" formControlName="prerequis" />
        </app-field>

        <app-switch formControlName="publie">Publier le cours dans le catalogue des formations</app-switch>

        <div aria-live="assertive">
          @if (error(); as failure) {
            <p class="form-error" role="alert" style="margin-top: 1rem">{{ failure }}</p>
          }
        </div>

        <div class="actions">
          <a appBtn variant="secondary" [routerLink]="cancelLink()">Annuler</a>
          <button appBtn type="submit" [loading]="pending()">Enregistrer le cours</button>
        </div>
      </form>
    </app-data-zone>
  `,
})
export class CourseFormPage {
  /** Paramètre de route : absent à la création. */
  readonly id = input<string>();

  private readonly api = inject(TrainerApi);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly breadcrumb = inject(BreadcrumbService);

  protected readonly niveaux = NIVEAUX;
  protected readonly niveauLabels = NIVEAU_LABELS;
  protected readonly prerequisHint = `Facultatif, ${PREREQUIS_MAX} caractères au maximum.`;
  protected readonly editing = computed(() => !!this.id());
  protected readonly cancelLink = computed(() => (this.id() ? ['/espace/formateur/cours', this.id()] : ['/espace/formateur/cours']));

  protected readonly form = new FormGroup({
    titre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)] }),
    niveau: new FormControl<NiveauFormation>('DEBUTANT', { nonNullable: true, validators: [Validators.required] }),
    categorieId: new FormControl<number | null>(null),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    objectifs: new FormControl('', { nonNullable: true }),
    prerequis: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(PREREQUIS_MAX)] }),
    publie: new FormControl(false, { nonNullable: true }),
  });

  private readonly publicApi = inject(PublicApi);
  private readonly categoriesState = new ResourceState<readonly Categorie[]>(() => this.publicApi.categories());
  protected readonly categories = computed(() => this.categoriesState.data() ?? []);
  protected readonly course = new ResourceState<Formation>(() =>
    this.api.formation(Number(this.id())).pipe(
      tap((formation) => {
        this.form.reset({
          titre: formation.titre,
          niveau: formation.niveau,
          categorieId: formation.categorieId ?? null,
          description: formation.description,
          objectifs: formation.objectifs ?? '',
          prerequis: formation.prerequis ?? '',
          publie: !!formation.publie,
        });
        this.breadcrumb.set([{ label: 'Mes cours', route: '/espace/formateur/cours' }, { label: formation.titre, route: `/espace/formateur/cours/${formation.id}` }, { label: 'Édition' }]);
      }),
    ),
  );
  /** À la création, le formulaire est disponible immédiatement. */
  protected readonly status = computed(() => (this.editing() ? this.course.status() : 'ready'));
  protected readonly loadError = computed(() => (this.course.error()?.kind === 'not-found' ? 'Ce cours est introuvable.' : null));

  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  constructor() {
    const seo = inject(SeoService);
    this.categoriesState.load();
    const subscription = toObservable(this.id).subscribe((id) => {
      seo.apply({ title: id ? 'Édition d’un cours' : 'Création d’un cours', noindex: true });
      if (id) this.course.load();
    });
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      this.course.destroy();
      this.categoriesState.destroy();
    });
  }

  protected submit(): void {
    revealErrors(this.form);
    if (this.form.invalid || this.pending()) return;
    const value = this.form.getRawValue();
    const payload = {
      titre: normalizeSpaces(value.titre),
      niveau: value.niveau,
      categorieId: value.categorieId,
      description: value.description.trim(),
      objectifs: value.objectifs.trim(),
      prerequis: normalizeSpaces(value.prerequis),
      publie: value.publie,
    };
    const id = this.id();
    this.pending.set(true);
    this.error.set(null);
    this.serverErrors.set({});
    (id ? this.api.modifierFormation(Number(id), payload) : this.api.creerFormation(payload)).subscribe({
      next: (formation) => {
        this.toasts.success(id ? 'Le cours est mis à jour.' : 'Le cours est créé. Planifiez maintenant ses séances.');
        void this.router.navigate(['/espace/formateur/cours', formation.id]);
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
