import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map, tap } from 'rxjs';
import { Projet, STATUT_PROJET_LABELS } from '../../core/api/models';
import { ProjectsApi } from '../../core/api/projects.api';
import { ResourceState } from '../../core/api/resource-state';
import { toApiError } from '../../core/http/problem';
import { BreadcrumbService } from '../../core/navigation/breadcrumb.service';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, FrNumberPipe, parseApiDate } from '../../shared/format/format';
import { PROJECT_BADGES, ProjectSummary } from '../../shared/project/project-summary';
import { Badge } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { Field, FieldControl } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { CompteursProjets } from '../../core/api/projects.api';

/** Validation des projets, liste (écran 46, UC-20) : propositions en attente d'une décision du bureau. */
@Component({
  selector: 'app-projects-review-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Badge, DataZone, Skeleton, FrDatePipe, FrNumberPipe],
  styles: `
    .tiles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .tile {
      padding: 1.5rem;
      border-radius: 18px;
      text-align: center;
    }
    .tile-value {
      font-size: 2rem;
      font-weight: 800;
      font-family: var(--font-heading);
      line-height: 1.1;
    }
    .tile strong {
      display: block;
      font-size: 0.95rem;
    }
    .tile span {
      font-size: 0.78rem;
      color: var(--text-muted);
    }
    .panel {
      padding: 1.75rem;
      border-radius: 20px;
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
        <h1 class="space-title">Validation des projets</h1>
        <p class="space-lead">Examinez les propositions soumises par les membres avant leur publication.</p>
      </div>
    </div>

    @if (pending.status() === 'ready' || pending.status() === 'empty') {
      <div class="tiles">
        <div class="glass-panel tile">
          <div class="tile-value text-amber">{{ (pending.data() ?? []).length | frNumber }}</div>
          <strong>en attente</strong>
          <span>À examiner</span>
        </div>
        @if (counters.data(); as totals) {
          <div class="glass-panel tile">
            <div class="tile-value accent-cyan">{{ totals.valides | frNumber }}</div>
            <strong>{{ totals.valides > 1 ? 'validés' : 'validé' }}</strong>
            <span>Publiés au catalogue</span>
          </div>
          <div class="glass-panel tile">
            <div class="tile-value">{{ totals.rejetes | frNumber }}</div>
            <strong>{{ totals.rejetes > 1 ? 'rejetés' : 'rejeté' }}</strong>
            <span>Retournés à leur auteur</span>
          </div>
        }
      </div>
    }

    <app-data-zone [status]="pending.status()" emptyMessage="Aucune proposition n’est en attente de validation." emptyIcon="check-square" (retry)="reload()">
      <div zone-skeleton class="glass-panel panel">
        <app-skeleton height="2.5rem" />
        <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
        <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
      </div>

      <div class="glass-panel panel">
        <div class="table-responsive" tabindex="0" role="region" aria-label="Propositions en attente">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">N°</th>
                <th scope="col">Nom du projet</th>
                <th scope="col">Auteur</th>
                <th scope="col">Date de soumission</th>
                @if (hasFiliere()) {
                  <th scope="col">Filière</th>
                }
                <th scope="col">Statut</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (project of pending.data() ?? []; track project.id; let index = $index) {
                <tr>
                  <td>
                    <strong>{{ index + 1 }}</strong>
                  </td>
                  <td style="min-width: 200px"><strong>{{ project.titre }}</strong></td>
                  <td style="white-space: nowrap">{{ project.porteurNom }}</td>
                  <td style="white-space: nowrap">{{ project.createdAt | frDate: 'court' }}</td>
                  @if (hasFiliere()) {
                    <td>{{ project.porteurFiliere }}</td>
                  }
                  <td><app-badge variant="amber">En attente</app-badge></td>
                  <td>
                    <a class="btn btn-primary btn-sm" [routerLink]="['/espace/gestion/projets', project.id]">Examiner<span class="sr-only"> {{ project.titre }}</span></a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </app-data-zone>
  `,
})
export class ProjectsReviewListPage {
  private readonly api = inject(ProjectsApi);

  protected readonly pending = new ResourceState<readonly Projet[]>(() =>
    this.api.enAttente().pipe(map((list) => [...list].sort((a, b) => (parseApiDate(a.createdAt)?.getTime() ?? 0) - (parseApiDate(b.createdAt)?.getTime() ?? 0)))),
  );
  protected readonly counters = new ResourceState<CompteursProjets>(() => this.api.compteurs());
  protected readonly hasFiliere = computed(() => (this.pending.data() ?? []).some((project) => !!project.porteurFiliere));

  constructor() {
    inject(SeoService).apply({ title: 'Validation des projets', noindex: true });
    this.reload();
    inject(DestroyRef).onDestroy(() => {
      this.pending.destroy();
      this.counters.destroy();
    });
  }

  protected reload(): void {
    this.pending.load();
    this.counters.load();
  }
}

/** Détail d'un projet à valider (écran 47, UC-20) : approbation, ou rejet motivé. */
@Component({
  selector: 'app-project-review-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Icon, Button, Field, FieldControl, DataZone, Skeleton, ProjectSummary],
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    .ready {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.5rem 1rem;
      border-radius: 12px;
      border: 1px solid rgba(16, 185, 129, 0.5);
      background: var(--color-success-bg);
      color: var(--badge-success-text);
      font-size: 0.85rem;
      font-weight: 700;
    }
    .decision {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-subtle);
    }
    .buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .approve {
      background: #047857;
      color: #fff;
      border-color: transparent;
      font-weight: 700;
    }
    .approve:hover {
      background: #065f46;
    }
    .aside {
      padding: 1.75rem;
      border-radius: 20px;
      text-align: center;
    }
    .aside-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent-active);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }
    @media (max-width: 1000px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
  template: `
    <div class="space-head" style="align-items: center">
      <h1 class="space-title" style="margin-bottom: 0">Détail d’un projet à valider</h1>
      @if (project.data()?.statut === 'PROPOSE') {
        <div class="ready"><app-icon name="check-circle" [size]="16" /> Projet prêt pour arbitrage</div>
      }
    </div>

    <app-data-zone [status]="project.status()" emptyMessage="Ce projet est indisponible." [errorMessage]="loadError()" (retry)="project.load()">
      <div zone-skeleton class="layout">
        <app-skeleton height="420px" radius="24px" />
        <app-skeleton height="220px" radius="20px" />
      </div>

      @if (project.data(); as item) {
        <div class="layout">
          <app-project-summary [projet]="item">
            <div class="decision">
              @if (item.statut === 'PROPOSE') {
                <app-field label="Motif du rejet" hint="Obligatoire pour un rejet : il est communiqué à l’auteur de la proposition." [serverError]="motifError()">
                  <textarea appControl rows="3" [formControl]="motif"></textarea>
                </app-field>
                <div class="buttons">
                  <button appBtn size="lg" type="button" class="approve" [loading]="pending() === 'VALIDE'" (click)="decide(item, 'VALIDE')">
                    <app-icon name="check" [size]="18" /> Approuver
                  </button>
                  <button appBtn variant="danger" size="lg" type="button" [loading]="pending() === 'REJETE'" (click)="decide(item, 'REJETE')">
                    <app-icon name="x" [size]="18" /> Rejeter
                  </button>
                </div>
              } @else {
                <p style="font-size: 0.9rem">
                  Ce projet a déjà fait l’objet d’une décision : <strong>{{ labels[item.statut] }}</strong
                  >.
                </p>
                @if (item.motifDecision) {
                  <p style="font-size: 0.88rem; margin-top: 0.5rem">Motif : {{ item.motifDecision }}</p>
                }
              }
            </div>
          </app-project-summary>

          <aside class="glass-panel aside" aria-labelledby="titre-arbitrage">
            <div class="aside-icon" aria-hidden="true"><app-icon name="code" [size]="28" /></div>
            <h2 id="titre-arbitrage" style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem">Arbitrage du bureau</h2>
            <p style="font-size: 0.85rem; margin-bottom: 1.25rem">La validation publie le projet au catalogue du club et l’ouvre au suivi d’un formateur.</p>
            <a class="btn btn-secondary btn-sm" routerLink="/espace/gestion/projets"><app-icon name="arrow-left" [size]="14" /> Retour à la liste</a>
          </aside>
        </div>
      }
    </app-data-zone>
  `,
})
export class ProjectReviewPage {
  readonly id = input.required<string>();

  private readonly api = inject(ProjectsApi);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly breadcrumb = inject(BreadcrumbService);

  protected readonly labels = STATUT_PROJET_LABELS;
  protected readonly badges = PROJECT_BADGES;
  protected readonly motif = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] });
  protected readonly motifError = signal<string | null>(null);
  protected readonly pending = signal<'VALIDE' | 'REJETE' | null>(null);

  protected readonly project = new ResourceState<Projet>(() =>
    this.api.projet(Number(this.id())).pipe(tap((item) => this.breadcrumb.set([{ label: 'Projets à valider', route: '/espace/gestion/projets' }, { label: item.titre }]))),
  );
  protected readonly loadError = computed(() => (this.project.error()?.kind === 'not-found' ? 'Ce projet est introuvable.' : null));

  constructor() {
    inject(SeoService).apply({ title: 'Projet à valider', noindex: true });
    const subscription = toObservable(this.id).subscribe(() => this.project.load());
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      this.project.destroy();
    });
  }

  protected decide(item: Projet, statut: 'VALIDE' | 'REJETE'): void {
    if (this.pending()) return;
    const motif = this.motif.value.trim();
    this.motifError.set(statut === 'REJETE' && !motif ? 'Indiquez le motif du rejet.' : null);
    if (this.motifError()) return;
    this.dialogs
      .confirm(
        statut === 'VALIDE'
          ? { title: 'Approuver le projet', message: `Souhaitez-vous approuver « ${item.titre} » ? Le projet sera publié au catalogue du club.`, confirmLabel: 'Approuver' }
          : { title: 'Rejeter le projet', message: `Souhaitez-vous rejeter « ${item.titre} » ? L’auteur sera informé du motif.`, confirmLabel: 'Rejeter', danger: true },
      )
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.pending.set(statut);
        this.api.decider(item.id, statut, motif || null).subscribe({
          next: () => {
            this.toasts.success(statut === 'VALIDE' ? 'Le projet est approuvé.' : 'Le projet est rejeté.');
            void this.router.navigateByUrl('/espace/gestion/projets');
          },
          error: (failure: unknown) => {
            this.pending.set(null);
            const error = toApiError(failure);
            if (error.kind !== 'server' && error.kind !== 'rate-limit') this.toasts.danger(error.userMessage);
          },
        });
      });
  }
}
