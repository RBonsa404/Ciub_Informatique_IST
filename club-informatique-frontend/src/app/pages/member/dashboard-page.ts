import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Page } from '../../core/api/api-client';
import { MemberApi } from '../../core/api/member.api';
import { Inscription, NotificationItem } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
import { AuthStore } from '../../core/auth/auth.store';
import { FeatureService } from '../../core/config/feature.service';
import { ModuleKey } from '../../core/config/features';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, formatTimeRange, parseApiDate } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icon-names';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';

interface Shortcut {
  readonly icon: IconName;
  readonly title: string;
  readonly text: string;
  readonly label: string;
  readonly route: string;
  readonly module: ModuleKey;
}

const SHORTCUTS: readonly Shortcut[] = [
  { icon: 'book-open', title: 'Mes cours', text: 'Accéder à mes formations', label: 'Voir mes cours', route: '/espace/inscriptions', module: 'inscriptions' },
  { icon: 'calendar', title: 'Événements', text: 'Voir le planning du club', label: 'Voir le planning', route: '/evenements', module: 'evenements' },
  { icon: 'file-text', title: 'Supports et devoirs', text: 'Consulter les documents de cours', label: 'Voir les supports', route: '/espace/supports', module: 'supports' },
  { icon: 'layers', title: 'Mes projets', text: 'Suivre mes propositions', label: 'Voir mes projets', route: '/espace/projets', module: 'projets' },
];

const UPCOMING_LIMIT = 5;
const NOTIFICATIONS_LIMIT = 4;

/** Inscriptions actives dont la date n'est pas passée, de la plus proche à la plus lointaine. */
export function upcomingOf(inscriptions: readonly Inscription[], now = Date.now()): readonly Inscription[] {
  const time = (i: Inscription) => parseApiDate(i.dateFin ?? i.dateDebut)?.getTime() ?? 0;
  const start = (i: Inscription) => parseApiDate(i.dateDebut)?.getTime() ?? 0;
  return inscriptions
    .filter((i) => i.statut !== 'ANNULEE' && time(i) >= now)
    .sort((a, b) => start(a) - start(b))
    .slice(0, UPCOMING_LIMIT);
}

/** Tableau de bord Membre (écran 22) : raccourcis, prochaines activités et dernières notifications réelles. */
@Component({
  selector: 'app-member-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, DataZone, Skeleton, FrDatePipe],
  styles: `
    .shortcuts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }
    .shortcut {
      padding: 1.5rem;
      text-align: center;
      border-radius: 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .shortcut-icon {
      width: 50px;
      height: 50px;
      border-radius: 14px;
      background: rgba(56, 189, 248, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      color: var(--accent-active);
    }
    .shortcut .btn {
      border-radius: 999px;
      width: 100%;
      font-weight: 700;
      margin-top: auto;
    }
    .panels {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
      gap: 2rem;
      align-items: start;
    }
    .rows {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .activity {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem 1rem;
      flex-wrap: wrap;
      padding: 0.85rem 1rem;
    }
    .day {
      background: var(--color-blue-royal);
      color: #fff;
      border-radius: 10px;
      padding: 0.4rem 0.6rem;
      text-align: center;
      min-width: 48px;
      flex-shrink: 0;
    }
    .day strong {
      display: block;
      font-size: 1.1rem;
      line-height: 1;
      color: inherit;
    }
    .day span {
      font-size: 0.7rem;
      text-transform: uppercase;
    }
    .notice {
      padding: 0.85rem 1rem;
    }
    .notice-head {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }
    .notice-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-amber-tech);
      flex-shrink: 0;
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Bienvenue, {{ auth.user()?.prenom }}</h1>
        <p class="space-lead" style="margin-bottom: 0.25rem">Tableau de bord — Club Informatique de l’IST</p>
        <p style="font-size: 0.85rem; color: var(--text-muted)">Accédez rapidement à vos outils, projets et activités du club.</p>
      </div>
      @if (projectsEnabled) {
        <a class="btn btn-primary" routerLink="/espace/projets/proposer"><app-icon name="plus" [size]="16" /> Proposer un projet</a>
      }
    </div>

    @if (shortcuts.length > 0) {
      <div class="shortcuts">
        @for (shortcut of shortcuts; track shortcut.route) {
          <div class="glass-card shortcut">
            <div class="shortcut-icon" aria-hidden="true"><app-icon [name]="shortcut.icon" [size]="24" /></div>
            <h2 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.25rem">{{ shortcut.title }}</h2>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem">{{ shortcut.text }}</p>
            <a class="btn btn-amber btn-sm" [routerLink]="shortcut.route">{{ shortcut.label }} <app-icon name="arrow-right" [size]="14" /></a>
          </div>
        }
      </div>
    }

    <div class="panels">
      <section class="glass-panel space-panel" aria-labelledby="titre-activites">
        <div class="panel-head">
          <h2 id="titre-activites" class="panel-title"><app-icon name="calendar" [size]="18" /> Mes prochaines activités</h2>
          <a class="panel-link" routerLink="/espace/inscriptions">Voir tout <app-icon name="arrow-right" [size]="14" /></a>
        </div>
        <app-data-zone [status]="upcoming.status()" emptyMessage="Vous n’avez aucune activité à venir." emptyIcon="calendar" (retry)="upcoming.load()">
          <div zone-skeleton class="rows">
            <app-skeleton height="64px" radius="var(--radius-lg)" />
            <app-skeleton height="64px" radius="var(--radius-lg)" />
            <app-skeleton height="64px" radius="var(--radius-lg)" />
          </div>
          @if (formationsEnabled) {
            <a zone-empty class="btn btn-secondary btn-sm" routerLink="/formations">Découvrir les formations</a>
          }
          <ul class="rows">
            @for (item of upcoming.data() ?? []; track item.id) {
              <li class="glass-card glass-card-static activity">
                <div class="flex min-w-0 items-center gap-4" style="flex: 1 1 220px">
                  <div class="day" aria-hidden="true">
                    <strong>{{ item.dateDebut | frDate: 'jour' }}</strong>
                    <span>{{ item.dateDebut | frDate: 'mois' }}</span>
                  </div>
                  <div class="min-w-0">
                    <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.2rem">{{ item.evenementTitre ?? item.formationTitre }}</h3>
                    <span class="meta-line" style="font-size: 0.78rem; flex-wrap: wrap">
                      <span class="sr-only">{{ item.dateDebut | frDate: 'long' }},</span>
                      <app-icon name="clock" [size]="13" /> {{ timeRange(item) }}
                      @if (item.lieu) {
                        <app-icon name="map-pin" [size]="13" /> {{ item.lieu }}
                      }
                    </span>
                  </div>
                </div>
                <div class="flex flex-wrap gap-2">
                  @if (item.statut === 'LISTE_ATTENTE') {
                    <app-badge variant="neutral" style="font-size: 0.75rem">Liste d’attente</app-badge>
                  }
                  <app-badge [variant]="item.evenementId ? 'amber' : 'primary'" style="font-size: 0.75rem">{{ item.evenementId ? 'Événement' : 'Formation' }}</app-badge>
                </div>
              </li>
            }
          </ul>
        </app-data-zone>
      </section>

      @if (notificationsEnabled) {
        <section class="glass-panel space-panel" aria-labelledby="titre-notifications">
          <div class="panel-head">
            <h2 id="titre-notifications" class="panel-title"><app-icon name="bell" [size]="18" /> Dernières notifications</h2>
            <a class="panel-link" routerLink="/espace/notifications">Voir tout <app-icon name="arrow-right" [size]="14" /></a>
          </div>
          <app-data-zone [status]="notifications.status()" emptyMessage="Vous n’avez aucune notification." emptyIcon="bell" (retry)="notifications.load()">
            <div zone-skeleton class="rows">
              <app-skeleton height="64px" radius="var(--radius-lg)" />
              <app-skeleton height="64px" radius="var(--radius-lg)" />
              <app-skeleton height="64px" radius="var(--radius-lg)" />
            </div>
            <ul class="rows">
              @for (item of notifications.data()?.content ?? []; track item.id) {
                <li class="glass-card glass-card-static notice">
                  <div class="notice-head">
                    @if (!item.lue) {
                      <span class="notice-dot" aria-hidden="true"></span>
                      <span class="sr-only">Non lue :</span>
                    }
                    <strong style="font-size: 0.88rem">{{ item.titre }}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: auto; white-space: nowrap">{{ item.createdAt | frDate: 'court' }}</span>
                  </div>
                  <p style="font-size: 0.82rem">{{ item.message }}</p>
                </li>
              }
            </ul>
          </app-data-zone>
        </section>
      }
    </div>
  `,
})
export class MemberDashboardPage {
  private readonly api = inject(MemberApi);
  private readonly features = inject(FeatureService);
  protected readonly auth = inject(AuthStore);

  protected readonly shortcuts = SHORTCUTS.filter((shortcut) => this.features.isEnabled(shortcut.module));
  protected readonly projectsEnabled = this.features.isEnabled('projets');
  protected readonly formationsEnabled = this.features.isEnabled('formations');
  protected readonly notificationsEnabled = this.features.isEnabled('notifications');

  protected readonly upcoming = new ResourceState<readonly Inscription[]>(() => this.api.inscriptions({ size: 200 }).pipe(map((page) => upcomingOf(page.content))));
  protected readonly notifications = new ResourceState<Page<NotificationItem>>(() => this.api.notifications({ size: NOTIFICATIONS_LIMIT }));

  constructor() {
    inject(SeoService).apply({ title: 'Tableau de bord', noindex: true });
    this.upcoming.load();
    if (this.notificationsEnabled) this.notifications.load();
    inject(DestroyRef).onDestroy(() => {
      this.upcoming.destroy();
      this.notifications.destroy();
    });
  }

  protected timeRange(item: Inscription): string {
    return item.dateDebut ? formatTimeRange(item.dateDebut, item.dateFin ?? item.dateDebut) : '';
  }
}
