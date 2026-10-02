import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Page } from '../../core/api/api-client';
import { Categorie, Projet, STATUT_PROJET_LABELS, StatutProjet } from '../../core/api/models';
import { ProjectsApi } from '../../core/api/projects.api';
import { PublicApi } from '../../core/api/public.api';
import { ResourceState } from '../../core/api/resource-state';
import { normalizeSpaces } from '../../core/auth/password-policy';
import { FeatureService } from '../../core/config/feature.service';
import { toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, FrNumberPipe } from '../../shared/format/format';
import { PROJECT_BADGES, progressValue } from '../../shared/project/project-summary';
import { Badge } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { webUrlValidator } from '../../shared/validators';

const TECH_MAX = 500;
const URL_MAX = 500;

/** Proposition de projet (écran 31, UC-11) : la proposition est examinée par le Responsable avant publication. */
@Component({
  selector: 'app-propose-project-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button, Icon, Field, FieldControl],
  styles: `
    .card {
      padding: 2.5rem;
      max-width: 750px;
      border-radius: 24px;
    }
    @media (max-width: 600px) {
      .card {
        padding: 1.5rem;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Soumettre une idée de projet</h1>
        <p class="space-lead">Le bureau du club examine chaque proposition avant de la publier et de lui attribuer un accompagnement.</p>
      </div>
    </div>

    <form class="glass-panel card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <app-field label="Titre du projet" [required]="true" [serverError]="serverErrors()['titre'] ?? null">
        <input appControl type="text" formControlName="titre" />
      </app-field>
      <app-field label="Technologies envisagées" hint="Séparez les technologies par des virgules." [required]="true" [serverError]="serverErrors()['technologies'] ?? null">
        <input appControl type="text" formControlName="technologies" />
      </app-field>
      <app-field label="Description et fonctionnalités clés" hint="Expliquez le problème traité et les fonctionnalités prévues." [required]="true" [serverError]="serverErrors()['description'] ?? null">
        <textarea appControl rows="5" formControlName="description"></textarea>
      </app-field>
      <app-field label="Objectifs" hint="Facultatif." [serverError]="serverErrors()['objectifs'] ?? null">
        <textarea appControl rows="3" formControlName="objectifs"></textarea>
      </app-field>
      <app-field label="Catégorie">
        <select appControl formControlName="categorieId">
          <option [ngValue]="null">Aucune catégorie</option>
          @for (categorie of categories(); track categorie.id) {
            <option [ngValue]="categorie.id">{{ categorie.nom }}</option>
          }
        </select>
      </app-field>
      <app-field
        label="Dépôt du code"
        hint="Facultatif : adresse du dépôt (https://…)."
        [messages]="{ adresse: 'Saisissez une adresse complète commençant par http:// ou https://.' }"
        [serverError]="serverErrors()['depotGit'] ?? null"
      >
        <input appControl type="url" inputmode="url" formControlName="depotGit" />
      </app-field>

      <div aria-live="assertive">
        @if (error(); as failure) {
          <p class="form-error" role="alert" style="margin-bottom: 1rem">{{ failure }}</p>
        }
      </div>

      <button appBtn variant="amber" size="lg" type="submit" [block]="true" style="white-space: normal" [loading]="pending()">
        Transmettre la proposition au bureau <app-icon name="arrow-right" [size]="18" />
      </button>
    </form>
  `,
})
export class ProposeProjectPage {
  private readonly api = inject(ProjectsApi);
  private readonly publicApi = inject(PublicApi);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly form = new FormGroup({
    titre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)] }),
    technologies: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(TECH_MAX)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    objectifs: new FormControl('', { nonNullable: true }),
    categorieId: new FormControl<number | null>(null),
    depotGit: new FormControl('', { nonNullable: true, validators: [webUrlValidator, Validators.maxLength(URL_MAX)] }),
  });
  private readonly categoriesState = new ResourceState<readonly Categorie[]>(() => this.publicApi.categories());
  protected readonly categories = computed(() => this.categoriesState.data() ?? []);
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  constructor() {
    inject(SeoService).apply({ title: 'Soumettre une idée de projet', noindex: true });
    this.categoriesState.load();
    inject(DestroyRef).onDestroy(() => this.categoriesState.destroy());
  }

  protected submit(): void {
    revealErrors(this.form);
    if (this.form.invalid || this.pending()) return;
    const value = this.form.getRawValue();
    this.pending.set(true);
    this.error.set(null);
    this.serverErrors.set({});
    this.api
      .proposer({
        titre: normalizeSpaces(value.titre),
        description: value.description.trim(),
        objectifs: value.objectifs.trim(),
        technologies: normalizeSpaces(value.technologies),
        depotGit: value.depotGit.trim() || null,
        categorieId: value.categorieId,
      })
      .subscribe({
        next: () => {
          this.toasts.success('Votre proposition est transmise au bureau du club.');
          void this.router.navigateByUrl('/espace/projets');
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

const STATUTS: readonly StatutProjet[] = ['PROPOSE', 'VALIDE', 'EN_COURS', 'TERMINE', 'REJETE'];
const PUBLIC_STATUTS: readonly StatutProjet[] = ['VALIDE', 'EN_COURS', 'TERMINE'];
const PAGE_SIZE = 8;

/** Suivi de mes projets proposés (écran 32) : statut, avancement et décision du bureau pour chaque proposition. */
@Component({
  selector: 'app-my-projects-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, Pagination, DataZone, Skeleton, FrDatePipe, FrNumberPipe],
  styles: `
    .bar {
      color: var(--color-amber-tech);
    }
    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .filters select {
      width: auto;
      min-width: 200px;
      flex: 0 1 auto;
    }
    .sort {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-left: auto;
      font-size: 0.85rem;
      color: var(--text-muted);
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
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent-active);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .reason {
      margin-top: 0.75rem;
      padding: 0.6rem 0.85rem;
      border-radius: 10px;
      border: 1px solid var(--border-subtle);
      font-size: 0.82rem;
    }
    @media (max-width: 700px) {
      .filters select {
        width: 100%;
      }
      .sort {
        margin-left: 0;
        width: 100%;
      }
      .tile {
        display: none;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title"><span class="bar" aria-hidden="true">| </span>Suivi de <span class="accent-cyan">mes projets proposés</span></h1>
        <p class="space-lead">Consultez l’avancement et le statut des projets que vous avez proposés au club.</p>
      </div>
      <a class="btn btn-primary" routerLink="/espace/projets/proposer">Proposer un projet <app-icon name="plus" [size]="16" /></a>
    </div>

    <div class="filters">
      <label class="sr-only" for="filtre-statut-projet">Statut</label>
      <select id="filtre-statut-projet" class="form-select" (change)="setStatut($event)">
        <option value="">Tous les statuts</option>
        @for (statut of statuts; track statut) {
          <option [value]="statut">{{ labels[statut] }}</option>
        }
      </select>
      <label class="sr-only" for="filtre-categorie-projet">Catégorie</label>
      <select id="filtre-categorie-projet" class="form-select" (change)="setCategorie($event)">
        <option value="">Toutes les catégories</option>
        @for (categorie of categories(); track categorie.id) {
          <option [value]="categorie.id">{{ categorie.nom }}</option>
        }
      </select>
      <div class="sort">
        <label for="tri-projets">Trier par :</label>
        <select id="tri-projets" class="form-select" style="min-width: 160px" (change)="setSort($event)">
          <option value="createdAt,desc">Plus récent</option>
          <option value="createdAt,asc">Plus ancien</option>
        </select>
      </div>
    </div>

    <app-data-zone [status]="state.status()" [emptyMessage]="emptyMessage()" emptyIcon="send" (retry)="state.load()">
      <div zone-skeleton class="rows">
        <app-skeleton height="130px" radius="20px" />
        <app-skeleton height="130px" radius="20px" />
      </div>
      @if (!filtered()) {
        <a zone-empty class="btn btn-primary" routerLink="/espace/projets/proposer">Proposer un projet <app-icon name="plus" [size]="16" /></a>
      }

      <ul class="rows">
        @for (project of state.data()?.content ?? []; track project.id) {
          @let progress = progressOf(project);
          <li class="glass-panel project">
            <div class="flex min-w-0 gap-5" style="flex: 1 1 320px">
              <div class="tile" aria-hidden="true"><app-icon name="code" [size]="24" /></div>
              <div class="min-w-0" style="flex: 1">
                <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.25rem">{{ project.titre }}</h2>
                <p style="font-size: 0.85rem; margin-bottom: 0.75rem">
                  @if (project.createdAt) {
                    Proposé le {{ project.createdAt | frDate: 'long' }}
                  }
                  @if (project.categorieNom) {
                    • {{ project.categorieNom }}
                  }
                </p>
                @if (progress !== null && project.statut !== 'PROPOSE' && project.statut !== 'REJETE') {
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
                @if (project.statut === 'REJETE' && project.motifDecision) {
                  <p class="reason"><strong>Motif du bureau :</strong> {{ project.motifDecision }}</p>
                }
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <app-badge [variant]="badges[project.statut]">{{ labels[project.statut] }}</app-badge>
              @if (publicLink(project); as link) {
                <a class="btn btn-primary btn-sm" [routerLink]="link">Voir le projet<span class="sr-only"> {{ project.titre }}</span></a>
              }
            </div>
          </li>
        }
      </ul>
      <app-pagination [page]="page()" [totalPages]="totalPages()" label="Pages de mes projets" (pageChange)="goTo($event)" />
    </app-data-zone>
  `,
})
export class MyProjectsPage {
  private readonly api = inject(ProjectsApi);
  private readonly publicApi = inject(PublicApi);
  private readonly catalogEnabled = inject(FeatureService).isEnabled('projets');

  protected readonly statuts = STATUTS;
  protected readonly labels = STATUT_PROJET_LABELS;
  protected readonly badges = PROJECT_BADGES;
  protected readonly progressOf = progressValue;

  private readonly statut = signal<StatutProjet | null>(null);
  private readonly categorieId = signal<number | null>(null);
  private readonly sort = signal('createdAt,desc');
  protected readonly page = signal(0);
  protected readonly filtered = computed(() => this.statut() !== null || this.categorieId() !== null);

  private readonly categoriesState = new ResourceState<readonly Categorie[]>(() => this.publicApi.categories());
  protected readonly categories = computed(() => this.categoriesState.data() ?? []);
  protected readonly state = new ResourceState<Page<Projet>>(() =>
    this.api.mesProjets({ page: this.page(), size: PAGE_SIZE, sort: this.sort(), statut: this.statut(), categorieId: this.categorieId() }),
  );
  protected readonly totalPages = computed(() => this.state.data()?.totalPages ?? 0);
  protected readonly emptyMessage = computed(() => (this.filtered() ? 'Aucun de vos projets ne correspond à ces filtres.' : 'Vous n’avez pas encore proposé de projet.'));

  constructor() {
    inject(SeoService).apply({ title: 'Mes projets proposés', noindex: true });
    this.categoriesState.load();
    this.state.load();
    inject(DestroyRef).onDestroy(() => {
      this.categoriesState.destroy();
      this.state.destroy();
    });
  }

  protected setStatut(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statut.set(value ? (value as StatutProjet) : null);
    this.reload();
  }

  protected setCategorie(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.categorieId.set(value ? Number(value) : null);
    this.reload();
  }

  protected setSort(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value);
    this.reload();
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.state.load();
  }

  /** La fiche publique n'existe que pour un projet validé. */
  protected publicLink(project: Projet): readonly string[] | null {
    return this.catalogEnabled && PUBLIC_STATUTS.includes(project.statut) ? ['/projets', project.slug] : null;
  }

  private reload(): void {
    this.page.set(0);
    this.state.load();
  }
}
