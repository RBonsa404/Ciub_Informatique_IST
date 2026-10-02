import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AdminApi, EntreeJournal, StatistiquesAdmin } from '../../core/api/admin.api';
import { ResourceState } from '../../core/api/resource-state';
import { AuthStore } from '../../core/auth/auth.store';
import { FeatureService } from '../../core/config/feature.service';
import { ModuleKey } from '../../core/config/features';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, FrNumberPipe } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icon-names';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';

interface Tile {
  readonly label: string;
  readonly hint: string;
  readonly value: (stats: StatistiquesAdmin) => number;
}

const TILES: readonly Tile[] = [
  { label: 'Comptes enregistrés', hint: 'Tous rôles confondus', value: (s) => s.totalMembres },
  { label: 'Comptes actifs', hint: 'Statut « actif »', value: (s) => s.membresActifs },
  { label: 'Formations', hint: 'Au catalogue', value: (s) => s.totalFormations },
  { label: 'Messages à traiter', hint: 'Reçus par le formulaire de contact', value: (s) => s.totalMessagesNonTraites },
];

interface Shortcut {
  readonly label: string;
  readonly icon: IconName;
  readonly route: string;
  readonly module: ModuleKey;
}

const SHORTCUTS: readonly Shortcut[] = [
  { label: 'Gestion des utilisateurs', icon: 'users', route: '/espace/admin/utilisateurs', module: 'administration' },
  { label: 'Rôles et permissions', icon: 'shield', route: '/espace/admin/roles', module: 'administration' },
  { label: 'Catégories', icon: 'folder', route: '/espace/admin/categories', module: 'administration' },
  { label: 'Statistiques', icon: 'bar-chart-2', route: '/espace/admin/statistiques', module: 'statistiques' },
  { label: 'Sécurité des comptes', icon: 'lock', route: '/espace/admin/securite', module: 'administration' },
];

const JOURNAL_LIMIT = 5;

/** Tableau de bord de l'Administrateur (écran 50) : totaux réels, dernières entrées du journal d'audit, accès rapides. */
@Component({
  selector: 'app-admin-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, DataZone, Skeleton, FrDatePipe, FrNumberPipe],
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
    }
    .tile-label {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }
    .tile-value {
      font-size: 2.2rem;
      font-weight: 800;
      font-family: var(--font-heading);
      line-height: 1.1;
      min-height: 2.4rem;
    }
    .tile-hint {
      font-size: 0.78rem;
      color: var(--text-muted);
    }
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
    .rows {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .entry {
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem 1rem;
      flex-wrap: wrap;
    }
    .shortcuts {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .shortcuts .btn {
      justify-content: flex-start;
    }
    @media (max-width: 1100px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Supervision et administration</h1>
        <p class="space-lead">Bonjour {{ auth.user()?.prenom }} {{ auth.user()?.nom }} • Comptes, contenus et sécurité de la plateforme.</p>
      </div>
      @if (isSuperAdmin && systemEnabled) {
        <a class="btn btn-primary" routerLink="/espace/systeme"><app-icon name="settings" [size]="16" /> Configuration du système</a>
      }
    </div>

    @if (statsEnabled) {
      <app-data-zone [status]="stats.status()" emptyMessage="Les totaux sont indisponibles." (retry)="stats.load()">
        <div zone-skeleton class="tiles">
          @for (tile of tiles; track tile.label) {
            <div class="glass-panel tile">
              <div class="tile-label">{{ tile.label }}</div>
              <app-skeleton width="4rem" height="2.2rem" />
            </div>
          }
        </div>
        @if (stats.data(); as data) {
          <div class="tiles">
            @for (tile of tiles; track tile.label) {
              <div class="glass-panel tile">
                <div class="tile-label">{{ tile.label }}</div>
                <div class="tile-value">{{ tile.value(data) | frNumber }}</div>
                <span class="tile-hint">{{ tile.hint }}</span>
              </div>
            }
          </div>
        }
      </app-data-zone>
    }

    <div class="layout" style="margin-top: 2rem">
      <section class="glass-panel panel" aria-labelledby="titre-journal">
        <div class="panel-head">
          <h2 id="titre-journal" class="panel-title">Dernières actions du journal d’audit</h2>
          <a class="panel-link" routerLink="/espace/admin/journal">Voir le journal complet <app-icon name="arrow-right" [size]="14" /></a>
        </div>
        <app-data-zone [status]="journal.status()" emptyMessage="Aucune action n’a encore été journalisée." emptyIcon="clipboard" (retry)="journal.load()">
          <div zone-skeleton class="rows">
            <app-skeleton height="64px" radius="var(--radius-lg)" />
            <app-skeleton height="64px" radius="var(--radius-lg)" />
            <app-skeleton height="64px" radius="var(--radius-lg)" />
          </div>
          <ul class="rows">
            @for (entry of journal.data() ?? []; track entry.id) {
              <li class="glass-card glass-card-static entry">
                <div class="min-w-0" style="flex: 1 1 260px; overflow-wrap: anywhere">
                  <strong style="font-size: 0.9rem; display: block">{{ entry.action }}{{ entry.utilisateurEmail ? ' : ' + entry.utilisateurEmail : '' }}</strong>
                  @if (entry.description) {
                    <span style="font-size: 0.78rem; color: var(--text-muted)">{{ entry.description }}</span>
                  }
                </div>
                <app-badge [variant]="entry.statut === 'SUCCES' ? 'success' : 'danger'" style="font-size: 0.7rem">
                  {{ entry.dateAction | frDate: 'court' }}, {{ entry.dateAction | frDate: 'heure' }}
                </app-badge>
              </li>
            }
          </ul>
        </app-data-zone>
      </section>

      <section class="glass-panel panel" aria-labelledby="titre-acces">
        <h2 id="titre-acces" class="panel-title" style="margin-bottom: 1.25rem">Administration rapide</h2>
        <div class="shortcuts">
          @for (shortcut of shortcuts; track shortcut.route) {
            <a class="btn btn-secondary" [routerLink]="shortcut.route"><app-icon [name]="shortcut.icon" [size]="16" /> {{ shortcut.label }}</a>
          }
        </div>
      </section>
    </div>
  `,
})
export class AdminDashboardPage {
  private readonly api = inject(AdminApi);
  private readonly features = inject(FeatureService);
  protected readonly auth = inject(AuthStore);

  protected readonly tiles = TILES;
  protected readonly shortcuts = SHORTCUTS.filter((shortcut) => this.features.isEnabled(shortcut.module));
  protected readonly statsEnabled = this.features.isEnabled('statistiques');
  protected readonly systemEnabled = this.features.isEnabled('systeme');
  protected readonly isSuperAdmin = this.auth.hasAnyRole(['SUPER_ADMIN']);

  protected readonly stats = new ResourceState<StatistiquesAdmin>(() => this.api.statistiques());
  protected readonly journal = new ResourceState<readonly EntreeJournal[]>(() => this.api.journal({ size: JOURNAL_LIMIT, sort: 'dateAction,desc' }).pipe(map((page) => page.content)));

  constructor() {
    inject(SeoService).apply({ title: 'Administration', noindex: true });
    if (this.statsEnabled) this.stats.load();
    this.journal.load();
    inject(DestroyRef).onDestroy(() => {
      this.stats.destroy();
      this.journal.destroy();
    });
  }
}
