import { ChangeDetectionStrategy, Component, DestroyRef, Signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ManagementApi } from '../../core/api/management.api';
import { Evenement, IndicateursGestion, Projet } from '../../core/api/models';
import { ProjectsApi } from '../../core/api/projects.api';
import { LoadStatus, ResourceState } from '../../core/api/resource-state';
import { AuthStore } from '../../core/auth/auth.store';
import { FeatureService } from '../../core/config/feature.service';
import { ModuleKey } from '../../core/config/features';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, FrNumberPipe, parseApiDate } from '../../shared/format/format';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icon-names';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';

interface Tile {
  readonly key: string;
  readonly label: string;
  readonly hint: string;
  readonly icon: IconName;
  readonly route: string;
  readonly status: Signal<LoadStatus>;
  /** Valeur réelle renvoyée par le serveur ; null tant qu'elle est inconnue. */
  readonly value: Signal<number | null>;
  /** Tuile retirée quand sa donnée est indisponible (point d'accès non encore fourni). */
  readonly optional?: boolean;
}

export interface MonthBar {
  readonly label: string;
  readonly value: number;
  /** Hauteur relative à la plus forte valeur, en pourcentage. */
  readonly height: number;
}

const MONTH = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' });

/** Barres de fréquentation : hauteur proportionnelle à la valeur la plus forte, libellé du mois. */
export function toMonthBars(points: IndicateursGestion['frequentation']): readonly MonthBar[] {
  const max = Math.max(0, ...points.map((p) => p.inscriptions));
  return points.map((p) => {
    const date = parseApiDate(`${p.mois}-01`);
    return { label: date ? MONTH.format(date).replace('.', '') : p.mois, value: p.inscriptions, height: max > 0 ? Math.round((p.inscriptions / max) * 100) : 0 };
  });
}

const UPCOMING_LIMIT = 3;
const PENDING_LIMIT = 3;
const UPCOMING_FETCH_SIZE = 100;

/** Tableau de bord du Responsable du Club (écran 42) : compteurs réels, propositions en attente, événements à venir. */
@Component({
  selector: 'app-management-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, DataZone, Skeleton, FrDatePipe, FrNumberPipe],
  styles: `
    .tiles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .tile {
      padding: 1.5rem;
      border-radius: 18px;
      display: block;
      transition: transform 0.2s;
    }
    .tile:hover {
      transform: translateY(-3px);
    }
    .tile-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
    }
    .tile-head app-icon {
      color: var(--accent-active);
    }
    .tile-value {
      font-size: 2.2rem;
      font-weight: 800;
      font-family: var(--font-heading);
      line-height: 1.1;
      color: var(--text-primary);
      min-height: 2.4rem;
    }
    .tile-hint {
      font-size: 0.78rem;
      color: var(--text-muted);
    }
    .layout {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    .layout.single {
      grid-template-columns: 1fr;
    }
    .panel {
      padding: 1.75rem;
      border-radius: 20px;
    }
    .chart {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      height: 200px;
      padding-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    .bar-col {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      gap: 0.4rem;
      min-width: 0;
    }
    .bar {
      width: 100%;
      max-width: 56px;
      min-height: 4px;
      border-radius: 8px 8px 0 0;
      background: linear-gradient(180deg, var(--color-cyan-circuit), var(--color-blue-royal));
    }
    .bar-value {
      font-size: 0.8rem;
      font-weight: 700;
    }
    .bar-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: capitalize;
    }
    .stack {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .rows {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .row {
      padding: 0.75rem 1rem;
      font-size: 0.88rem;
    }
    @media (max-width: 1100px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .tile {
        transition: none;
      }
      .tile:hover {
        transform: none;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Tableau de bord du Responsable du Club</h1>
        <p class="space-lead">Bonjour {{ auth.user()?.prenom }} {{ auth.user()?.nom }} • Vue d’ensemble des activités, des projets et des effectifs du club.</p>
      </div>
    </div>

    <div class="tiles">
      @for (tile of tiles; track tile.key) {
        @if (!(tile.optional && tile.status() === 'error')) {
          <a class="glass-panel tile" [routerLink]="tile.route">
            <div class="tile-head">
              <span>{{ tile.label }}</span>
              <app-icon [name]="tile.icon" [size]="20" />
            </div>
            <div class="tile-value">
              @switch (tile.status()) {
                @case ('loading') {
                  <app-skeleton width="4rem" height="2.2rem" />
                  <span class="sr-only">Chargement en cours</span>
                }
                @case ('error') {
                  <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted)">Indisponible</span>
                }
                @default {
                  {{ tile.value() | frNumber }}
                }
              }
            </div>
            <span class="tile-hint">{{ tile.hint }}</span>
          </a>
        }
      }
    </div>

    <div class="layout" [class.single]="!chartVisible()">
      @if (chartVisible()) {
        <section class="glass-panel panel" aria-labelledby="titre-frequentation">
          <h2 id="titre-frequentation" style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem">Activité et fréquentation</h2>
          @if (indicators.status() === 'loading') {
            <div role="status" aria-busy="true">
              <span class="sr-only">Chargement en cours</span>
              <app-skeleton height="200px" radius="var(--radius-md)" />
            </div>
          } @else if (bars().length === 0) {
            <p style="font-size: 0.88rem; color: var(--text-muted)">Aucune inscription n’a encore été enregistrée.</p>
          } @else {
            <ul class="chart" aria-label="Inscriptions confirmées par mois">
              @for (bar of bars(); track bar.label) {
                <li class="bar-col">
                  <span class="bar-value">{{ bar.value | frNumber }}</span>
                  <span class="bar" [style.height.%]="bar.height" aria-hidden="true"></span>
                  <span class="bar-label">{{ bar.label }}</span>
                </li>
              }
            </ul>
            <p style="font-size: 0.8rem; color: var(--text-muted)">Inscriptions confirmées aux séances de formation et aux événements, par mois.</p>
          }
        </section>
      }

      <div class="stack">
        @if (projectsEnabled) {
          <section class="glass-panel panel" aria-labelledby="titre-attente">
            <div class="panel-head">
              <h2 id="titre-attente" class="panel-title" style="font-size: 1.05rem">Projets en attente</h2>
              <a class="panel-link" routerLink="/espace/gestion/projets">Voir tout <app-icon name="arrow-right" [size]="14" /></a>
            </div>
            <app-data-zone [status]="pending.status()" emptyMessage="Aucune proposition n’est en attente." emptyIcon="check-square" (retry)="pending.load()">
              <div zone-skeleton class="rows">
                <app-skeleton height="56px" radius="var(--radius-lg)" />
                <app-skeleton height="56px" radius="var(--radius-lg)" />
              </div>
              <ul class="rows">
                @for (project of pendingTop(); track project.id) {
                  <li class="glass-card glass-card-static row">
                    <a [routerLink]="['/espace/gestion/projets', project.id]" style="font-weight: 700">{{ project.titre }}</a>
                    @if (project.porteurNom) {
                      <div style="font-size: 0.78rem; color: var(--text-muted)">Par {{ project.porteurNom }}</div>
                    }
                  </li>
                }
              </ul>
            </app-data-zone>
          </section>
        }

        @if (eventsEnabled) {
          <section class="glass-panel panel" aria-labelledby="titre-prevus">
            <div class="panel-head">
              <h2 id="titre-prevus" class="panel-title" style="font-size: 1.05rem">Événements prévus</h2>
              <a class="panel-link" routerLink="/espace/gestion/evenements">Gérer <app-icon name="arrow-right" [size]="14" /></a>
            </div>
            <app-data-zone [status]="upcoming.status()" emptyMessage="Aucun événement n’est prévu." emptyIcon="calendar" (retry)="upcoming.load()">
              <div zone-skeleton class="rows">
                <app-skeleton height="44px" radius="var(--radius-lg)" />
                <app-skeleton height="44px" radius="var(--radius-lg)" />
              </div>
              <ul class="rows">
                @for (event of upcoming.data() ?? []; track event.id) {
                  <li class="glass-card glass-card-static row">
                    <strong>{{ event.titre }}</strong> • {{ event.dateDebut | frDate: 'long' }}
                  </li>
                }
              </ul>
            </app-data-zone>
          </section>
        }
      </div>
    </div>
  `,
})
export class ManagementDashboardPage {
  private readonly api = inject(ManagementApi);
  private readonly projects = inject(ProjectsApi);
  private readonly features = inject(FeatureService);
  protected readonly auth = inject(AuthStore);

  protected readonly projectsEnabled = this.features.isEnabled('projets');
  protected readonly eventsEnabled = this.features.isEnabled('evenements');

  protected readonly pending = new ResourceState<readonly Projet[]>(() => this.projects.enAttente());
  protected readonly pendingTop = computed(() => (this.pending.data() ?? []).slice(0, PENDING_LIMIT));
  protected readonly upcoming = new ResourceState<readonly Evenement[]>(() =>
    this.api.evenements({ size: UPCOMING_FETCH_SIZE, sort: 'dateDebut,asc' }).pipe(
      map((page) => page.content.filter((event) => !!event.publie && (parseApiDate(event.dateFin)?.getTime() ?? 0) >= Date.now()).slice(0, UPCOMING_LIMIT)),
    ),
  );
  protected readonly indicators = new ResourceState<IndicateursGestion>(() => this.api.indicateurs());
  protected readonly bars = computed(() => toMonthBars(this.indicators.data()?.frequentation ?? []));
  /** Le graphique est retiré tant que le serveur ne fournit pas la fréquentation. */
  protected readonly chartVisible = computed(() => this.indicators.status() !== 'error');

  private readonly newsTotal = new ResourceState<number>(
    () => this.api.actualites({ size: 1 }).pipe(map((page) => page.totalElements)),
    () => false,
  );
  private readonly eventsTotal = new ResourceState<number>(
    () => this.api.evenements({ size: 1 }).pipe(map((page) => page.totalElements)),
    () => false,
  );
  protected readonly tiles: readonly Tile[] = this.buildTiles();
  private readonly states: readonly { destroy(): void }[] = [this.pending, this.upcoming, this.indicators, this.newsTotal, this.eventsTotal];

  constructor() {
    inject(SeoService).apply({ title: 'Tableau de bord du Responsable', noindex: true });
    if (this.projectsEnabled) this.pending.load();
    if (this.eventsEnabled) {
      this.upcoming.load();
      this.eventsTotal.load();
    }
    if (this.features.isEnabled('actualites')) this.newsTotal.load();
    this.indicators.load();
    inject(DestroyRef).onDestroy(() => this.states.forEach((state) => state.destroy()));
  }

  private buildTiles(): readonly Tile[] {
    const all: (Tile & { module: ModuleKey })[] = [
      {
        key: 'actualites',
        module: 'actualites',
        label: 'Actualités',
        hint: 'Articles publiés et brouillons',
        icon: 'newspaper',
        route: '/espace/gestion/actualites',
        status: this.newsTotal.status,
        value: this.newsTotal.data,
      },
      {
        key: 'evenements',
        module: 'evenements',
        label: 'Événements',
        hint: 'Événements créés',
        icon: 'calendar',
        route: '/espace/gestion/evenements',
        status: this.eventsTotal.status,
        value: this.eventsTotal.data,
      },
      {
        key: 'projets',
        module: 'projets',
        label: 'Projets en attente',
        hint: 'À examiner par le bureau',
        icon: 'check-square',
        route: '/espace/gestion/projets',
        // Une liste vide est une valeur exacte (zéro proposition), non une absence de donnée.
        status: computed(() => (this.pending.status() === 'empty' ? 'ready' : this.pending.status())),
        value: computed(() => this.pending.data()?.length ?? null),
      },
      {
        key: 'membres',
        module: 'inscriptions',
        label: 'Membres',
        hint: 'Comptes actifs',
        icon: 'users',
        route: '/espace/gestion/inscriptions',
        optional: true,
        status: this.indicators.status,
        value: computed(() => this.indicators.data()?.membresActifs ?? null),
      },
    ];
    return all.filter((tile) => this.features.isEnabled(tile.module));
  }
}
