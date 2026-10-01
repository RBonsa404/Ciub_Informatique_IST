import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Formation } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
import { TrainerApi } from '../../core/api/trainer.api';
import { AuthStore } from '../../core/auth/auth.store';
import { FeatureService } from '../../core/config/feature.service';
import { ModuleKey } from '../../core/config/features';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, FrNumberPipe, formatTimeRange } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icon-names';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { UpcomingSession, enrolledLabel, ownedBy, upcomingSessions } from './trainer-model';

interface Tile {
  readonly icon: IconName;
  readonly title: string;
  readonly text: string;
  readonly route: string;
  readonly module: ModuleKey;
}

const TILES: readonly Tile[] = [
  { icon: 'book-open', title: 'Mes cours', text: 'Gérer mes formations', route: '/espace/formateur/cours', module: 'formations' },
  { icon: 'graduation-cap', title: 'Catalogue', text: 'Voir les formations publiées', route: '/formations', module: 'formations' },
  { icon: 'activity', title: 'Projets suivis', text: 'Accompagner les projets', route: '/espace/formateur/projets', module: 'projets' },
];

const UPCOMING_LIMIT = 5;
const COURSES_FETCH_SIZE = 100;

/** Tableau de bord Formateur (écran 35) : raccourcis, prochaines séances et cours du formateur, sur données réelles. */
@Component({
  selector: 'app-trainer-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, DataZone, Skeleton, FrDatePipe, FrNumberPipe],
  styles: `
    .tiles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr));
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }
    .tile {
      padding: 1.25rem;
      border-radius: 18px;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.2s;
    }
    .tile:hover {
      transform: translateY(-3px);
    }
    .tile-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent-active);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .panels {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    .rows {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .session {
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .course {
      padding: 0.85rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }
    @media (max-width: 1100px) {
      .panels {
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
        <h1 class="space-title">Bienvenue, {{ auth.user()?.prenom }}</h1>
        <p class="space-lead" style="margin-bottom: 0.25rem">Tableau de bord — Espace Formateur du Club Informatique de l’IST</p>
        <p style="font-size: 0.85rem; color: var(--text-muted)">Accédez rapidement à vos cours, à vos séances et aux feuilles d’émargement.</p>
      </div>
      <a class="btn btn-primary" routerLink="/espace/formateur/cours/nouveau"><app-icon name="plus" [size]="16" /> Créer un cours</a>
    </div>

    <div class="tiles">
      @for (tile of tiles; track tile.route) {
        <a class="glass-panel tile" [routerLink]="tile.route">
          <span class="tile-icon" aria-hidden="true"><app-icon [name]="tile.icon" [size]="22" /></span>
          <span>
            <strong style="display: block; font-size: 0.98rem">{{ tile.title }}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted)">{{ tile.text }}</span>
          </span>
        </a>
      }
    </div>

    <div class="panels">
      <section class="glass-panel space-panel" aria-labelledby="titre-seances">
        <div class="panel-head">
          <h2 id="titre-seances" class="panel-title">Mes séances de formation à venir</h2>
          <a class="panel-link" routerLink="/espace/formateur/cours">Voir tous les cours <app-icon name="arrow-right" [size]="14" /></a>
        </div>
        <app-data-zone [status]="sessionsStatus()" emptyMessage="Aucune séance n’est planifiée." emptyIcon="calendar" (retry)="courses.load()">
          <div zone-skeleton class="rows">
            <app-skeleton height="110px" radius="var(--radius-lg)" />
            <app-skeleton height="110px" radius="var(--radius-lg)" />
          </div>
          <ul class="rows">
            @for (item of upcoming(); track item.session.id; let odd = $odd) {
              <li class="glass-card glass-card-static session">
                <div style="flex: 1 1 260px; min-width: 0">
                  <div class="flex flex-wrap items-center gap-3" style="margin-bottom: 0.4rem">
                    <app-badge [variant]="odd ? 'amber' : 'primary'">Séance {{ item.rank | frNumber }} / {{ item.total | frNumber }}</app-badge>
                    <span style="font-size: 0.8rem; color: var(--text-muted)">{{ item.session.dateDebut | frDate: 'long' }}, {{ timeRange(item) }}</span>
                  </div>
                  <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.25rem">{{ item.formation.titre }}</h3>
                  <p style="font-size: 0.85rem">
                    @if (item.session.lieu) {
                      {{ item.session.lieu }} •
                    }
                    {{ enrolledLabel(item) }}
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <a class="btn btn-primary btn-sm" [routerLink]="['/espace/formateur/cours', item.formation.id, 'sessions', item.session.id, 'presences']">Émargement</a>
                  <a class="btn btn-secondary btn-sm" [routerLink]="['/espace/formateur/cours', item.formation.id]">
                    Détail<span class="sr-only"> du cours {{ item.formation.titre }}</span>
                  </a>
                </div>
              </li>
            }
          </ul>
        </app-data-zone>
      </section>

      <section class="glass-panel space-panel" aria-labelledby="titre-cours">
        <div class="panel-head">
          <h2 id="titre-cours" class="panel-title">Mes cours</h2>
        </div>
        <app-data-zone [status]="courses.status()" emptyMessage="Vous n’avez encore créé aucun cours." emptyIcon="book-open" (retry)="courses.load()">
          <div zone-skeleton class="rows">
            <app-skeleton height="52px" radius="var(--radius-lg)" />
            <app-skeleton height="52px" radius="var(--radius-lg)" />
          </div>
          <a zone-empty class="btn btn-secondary btn-sm" routerLink="/espace/formateur/cours/nouveau">Créer un cours</a>
          <ul class="rows" style="gap: 0.75rem">
            @for (course of courses.data() ?? []; track course.id) {
              <li class="glass-card glass-card-static course">
                <a [routerLink]="['/espace/formateur/cours', course.id]" style="font-size: 0.9rem; font-weight: 600; min-width: 0">{{ course.titre }}</a>
                <app-badge [variant]="course.publie ? 'success' : 'neutral'" style="font-size: 0.7rem; flex-shrink: 0">{{ course.publie ? 'Publié' : 'Brouillon' }}</app-badge>
              </li>
            }
          </ul>
        </app-data-zone>
      </section>
    </div>
  `,
})
export class TrainerDashboardPage {
  private readonly api = inject(TrainerApi);
  private readonly features = inject(FeatureService);
  protected readonly auth = inject(AuthStore);

  protected readonly tiles = TILES.filter((tile) => this.features.isEnabled(tile.module));
  protected readonly courses = new ResourceState<readonly Formation[]>(() =>
    this.api.cours({ size: COURSES_FETCH_SIZE }).pipe(map((page) => page.content.filter(ownedBy(this.auth.user()?.id)))),
  );
  protected readonly upcoming = computed(() => upcomingSessions(this.courses.data() ?? [], UPCOMING_LIMIT));
  /** Des cours sans séance à venir donnent un état vide propre au panneau des séances. */
  protected readonly sessionsStatus = computed(() => {
    const status = this.courses.status();
    return status === 'ready' && this.upcoming().length === 0 ? 'empty' : status;
  });

  constructor() {
    inject(SeoService).apply({ title: 'Tableau de bord formateur', noindex: true });
    this.courses.load();
    inject(DestroyRef).onDestroy(() => this.courses.destroy());
  }

  protected timeRange(item: UpcomingSession): string {
    return formatTimeRange(item.session.dateDebut, item.session.dateFin);
  }

  protected enrolledLabel(item: UpcomingSession): string {
    return enrolledLabel(item.session.nombreInscrits);
  }
}
