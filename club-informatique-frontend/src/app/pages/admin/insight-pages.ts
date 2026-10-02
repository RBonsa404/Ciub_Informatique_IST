import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminApi, AlerteSecurite, EntreeJournal, GraviteAlerte, StatistiquesAdmin } from '../../core/api/admin.api';
import { Page } from '../../core/api/api-client';
import { STATUT_PROJET_LABELS, StatutProjet } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, FrNumberPipe } from '../../shared/format/format';
import { BadgeVariant, Badge } from '../../shared/ui/card/card';
import { Icon } from '../../shared/ui/icon/icon';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { Share, roleLabel, toShares } from './admin-model';

interface Total {
  readonly label: string;
  readonly value: (stats: StatistiquesAdmin) => number;
}

const TOTALS: readonly Total[] = [
  { label: 'Comptes enregistrés', value: (s) => s.totalMembres },
  { label: 'Comptes actifs', value: (s) => s.membresActifs },
  { label: 'Formations', value: (s) => s.totalFormations },
  { label: 'Événements', value: (s) => s.totalEvenements },
  { label: 'Projets', value: (s) => s.totalProjets },
  { label: 'Ressources', value: (s) => s.totalRessources },
];

const projectLabel = (key: string) => STATUT_PROJET_LABELS[key as StatutProjet] ?? key;

/**
 * Statistiques d'utilisation (écran 55, UC-26) : totaux et répartitions réels renvoyés par le serveur.
 * Aucune série de connexions ni tendance n'est affichée tant que le serveur ne les mesure pas.
 */
@Component({
  selector: 'app-statistics-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataZone, Skeleton, FrNumberPipe],
  styles: `
    .tiles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .tile {
      padding: 1.25rem 1.5rem;
      border-radius: 18px;
    }
    .tile-value {
      font-size: 1.9rem;
      font-weight: 800;
      font-family: var(--font-heading);
      line-height: 1.15;
    }
    .tile-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .panels {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
      gap: 2rem;
      align-items: start;
    }
    .panel {
      padding: 1.75rem;
      border-radius: 20px;
    }
    .panel h2 {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
    }
    .share {
      margin-bottom: 1.1rem;
    }
    .share-head {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      font-size: 0.88rem;
      margin-bottom: 0.4rem;
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Statistiques d’utilisation</h1>
        <p class="space-lead">Totaux et répartitions calculés par le serveur sur les données réelles de la plateforme.</p>
      </div>
    </div>

    <app-data-zone [status]="stats.status()" emptyMessage="Les statistiques sont indisponibles." emptyIcon="bar-chart-2" (retry)="stats.load()">
      <div zone-skeleton>
        <div class="tiles">
          @for (total of totals; track total.label) {
            <app-skeleton height="92px" radius="18px" />
          }
        </div>
        <div class="panels">
          <app-skeleton height="260px" radius="20px" />
          <app-skeleton height="260px" radius="20px" />
        </div>
      </div>

      @if (stats.data(); as data) {
        <div class="tiles">
          @for (total of totals; track total.label) {
            <div class="glass-panel tile">
              <div class="tile-value">{{ total.value(data) | frNumber }}</div>
              <div class="tile-label">{{ total.label }}</div>
            </div>
          }
        </div>

        <div class="panels">
          <section class="glass-panel panel" aria-labelledby="titre-roles">
            <h2 id="titre-roles">Répartition des comptes par rôle</h2>
            @for (share of roleShares(); track share.label) {
              <div class="share">
                <div class="share-head">
                  <span>{{ share.label }}</span>
                  <strong>{{ share.value | frNumber }} ({{ share.percent | frNumber }} %)</strong>
                </div>
                <div class="progress" aria-hidden="true"><span [style.width.%]="share.percent"></span></div>
              </div>
            } @empty {
              <p style="font-size: 0.88rem; color: var(--text-muted)">Aucun compte n’est enregistré.</p>
            }
            <p style="font-size: 0.78rem; color: var(--text-muted)">Un compte qui cumule plusieurs rôles est compté dans chacun d’eux.</p>
          </section>

          <section class="glass-panel panel" aria-labelledby="titre-projets">
            <h2 id="titre-projets">Répartition des projets par statut</h2>
            @for (share of projectShares(); track share.label) {
              <div class="share">
                <div class="share-head">
                  <span>{{ share.label }}</span>
                  <strong>{{ share.value | frNumber }} ({{ share.percent | frNumber }} %)</strong>
                </div>
                <div class="progress" aria-hidden="true"><span [style.width.%]="share.percent"></span></div>
              </div>
            } @empty {
              <p style="font-size: 0.88rem; color: var(--text-muted)">Aucun projet n’est enregistré.</p>
            }
          </section>
        </div>
      }
    </app-data-zone>
  `,
})
export class StatisticsPage {
  private readonly api = inject(AdminApi);
  protected readonly totals = TOTALS;
  protected readonly stats = new ResourceState<StatistiquesAdmin>(() => this.api.statistiques());
  protected readonly roleShares = computed<readonly Share[]>(() => toShares(this.stats.data()?.repartitionMembresParRole, roleLabel));
  protected readonly projectShares = computed<readonly Share[]>(() => toShares(this.stats.data()?.repartitionProjetsParStatut, projectLabel));

  constructor() {
    inject(SeoService).apply({ title: 'Statistiques d’utilisation', noindex: true });
    this.stats.load();
    inject(DestroyRef).onDestroy(() => this.stats.destroy());
  }
}

const GRAVITE_LABELS: Record<GraviteAlerte, string> = { FAIBLE: 'Faible', MOYENNE: 'Moyenne', CRITIQUE: 'Critique' };
const GRAVITE_BADGES: Record<GraviteAlerte, BadgeVariant> = { FAIBLE: 'neutral', MOYENNE: 'amber', CRITIQUE: 'danger' };
const GRAVITE_ORDER: Record<GraviteAlerte, number> = { CRITIQUE: 0, MOYENNE: 1, FAIBLE: 2 };

/** Alertes triées de la plus grave à la moins grave. */
export function sortAlerts(alerts: readonly AlerteSecurite[]): readonly AlerteSecurite[] {
  return [...alerts].sort((a, b) => (GRAVITE_ORDER[a.gravite] ?? 3) - (GRAVITE_ORDER[b.gravite] ?? 3));
}

/** Sécurité des comptes (page dérivée D7, UC-27 hors double authentification) : alertes réelles et accès au compte concerné. */
@Component({
  selector: 'app-account-security-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, DataZone, Skeleton],
  styles: `
    .rows {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 950px;
    }
    .alert {
      padding: 1.25rem 1.5rem;
      border-radius: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Sécurité des comptes</h1>
        <p class="space-lead">Comptes signalés par le serveur : verrouillages, tentatives de connexion répétées, suspensions.</p>
      </div>
      <a class="btn btn-secondary" routerLink="/espace/admin/journal"><app-icon name="clipboard" [size]="16" /> Journal d’audit</a>
    </div>

    <app-data-zone [status]="alerts.status()" emptyMessage="Aucune alerte de sécurité n’est en cours." emptyIcon="shield" (retry)="alerts.load()">
      <div zone-skeleton class="rows">
        <app-skeleton height="88px" radius="18px" />
        <app-skeleton height="88px" radius="18px" />
      </div>

      <ul class="rows">
        @for (alert of alerts.data() ?? []; track $index) {
          <li class="glass-panel alert">
            <div class="min-w-0" style="flex: 1 1 300px">
              <h2 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem">{{ alert.typeAlerte }}</h2>
              <p style="font-size: 0.85rem">{{ alert.description }}</p>
              @if (alert.utilisateurCible) {
                <span style="font-size: 0.8rem; color: var(--text-muted); overflow-wrap: anywhere">Compte concerné : {{ alert.utilisateurCible }}</span>
              }
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <app-badge [variant]="badges[alert.gravite] ?? 'neutral'">Gravité : {{ labels[alert.gravite] ?? alert.gravite }}</app-badge>
              @if (alert.utilisateurId) {
                <a class="btn btn-primary btn-sm" [routerLink]="['/espace/admin/utilisateurs', alert.utilisateurId]">Voir le compte</a>
              }
            </div>
          </li>
        }
      </ul>
    </app-data-zone>
  `,
})
export class AccountSecurityPage {
  private readonly api = inject(AdminApi);
  protected readonly labels = GRAVITE_LABELS;
  protected readonly badges = GRAVITE_BADGES;
  protected readonly alerts = new ResourceState<readonly AlerteSecurite[]>(() => this.api.alertes());

  constructor() {
    inject(SeoService).apply({ title: 'Sécurité des comptes', noindex: true });
    this.alerts.load();
    inject(DestroyRef).onDestroy(() => this.alerts.destroy());
  }
}

type JournalStatus = '' | 'SUCCES' | 'ECHEC';
const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

/** Le serveur applique les filtres ; ils sont revérifiés sur la page reçue. */
export function matchesEntry(entry: EntreeJournal, user: string, status: JournalStatus): boolean {
  const needle = user.trim().toLowerCase();
  return (!needle || (entry.utilisateurEmail ?? '').toLowerCase().includes(needle)) && (!status || entry.statut === status);
}

/** Journal d'audit (page dérivée D6) : actions sensibles enregistrées par le serveur, filtrables par compte et par résultat. */
@Component({
  selector: 'app-audit-log-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, Pagination, DataZone, Skeleton, FrDatePipe],
  styles: `
    .controls {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .controls input {
      width: min(100%, 280px);
    }
    .controls select {
      width: auto;
      min-width: 170px;
    }
    .panel {
      padding: 1.75rem;
      border-radius: 20px;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 700px) {
      .controls input,
      .controls select {
        width: 100%;
      }
      .panel {
        padding: 1rem;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Journal d’audit</h1>
        <p class="space-lead">Actions sensibles enregistrées par le serveur : connexions, changements de rôle, modifications de comptes.</p>
      </div>
      <div class="controls">
        <label class="sr-only" for="filtre-compte">Compte</label>
        <input id="filtre-compte" class="form-input" type="search" placeholder="Adresse du compte" autocomplete="off" (input)="onSearch($any($event.target).value)" />
        <label class="sr-only" for="filtre-resultat">Résultat</label>
        <select id="filtre-resultat" class="form-select" (change)="setStatus($event)">
          <option value="">Tous les résultats</option>
          <option value="SUCCES">Succès</option>
          <option value="ECHEC">Échec</option>
        </select>
      </div>
    </div>

    <app-data-zone
      [status]="status()"
      [emptyMessage]="filtered() ? 'Aucune action ne correspond à ces filtres.' : 'Aucune action n’a encore été journalisée.'"
      emptyIcon="clipboard"
      (retry)="state.load()"
    >
      <div zone-skeleton class="glass-panel panel">
        <app-skeleton height="2.5rem" />
        <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
        <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
        <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
      </div>

      <div class="glass-panel panel">
        <div class="table-responsive" tabindex="0" role="region" aria-label="Journal d’audit">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Action</th>
                <th scope="col">Détail</th>
                <th scope="col">Compte</th>
                <th scope="col">Adresse réseau</th>
                <th scope="col">Résultat</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of items(); track entry.id) {
                <tr>
                  <td style="white-space: nowrap">{{ entry.dateAction | frDate: 'numerique' }}, {{ entry.dateAction | frDate: 'heure' }}</td>
                  <td><strong>{{ entry.action }}</strong></td>
                  <td style="min-width: 220px">{{ entry.description || '—' }}</td>
                  <td>{{ entry.utilisateurEmail || '—' }}</td>
                  <td>{{ entry.ipAddress || '—' }}</td>
                  <td>
                    <app-badge [variant]="entry.statut === 'SUCCES' ? 'success' : 'danger'">{{ entry.statut === 'SUCCES' ? 'Succès' : 'Échec' }}</app-badge>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      <app-pagination [page]="page()" [totalPages]="totalPages()" label="Pages du journal" (pageChange)="goTo($event)" />
    </app-data-zone>
  `,
})
export class AuditLogPage {
  private readonly api = inject(AdminApi);

  private readonly user = signal('');
  private readonly result = signal<JournalStatus>('');
  private readonly searchInput = new Subject<string>();
  protected readonly page = signal(0);
  protected readonly filtered = computed(() => this.user().trim() !== '' || this.result() !== '');

  protected readonly state = new ResourceState<Page<EntreeJournal>>(() =>
    this.api.journal({ page: this.page(), size: PAGE_SIZE, sort: 'dateAction,desc', utilisateur: this.user().trim() || undefined, statut: this.result() || null }),
  );
  protected readonly items = computed(() => (this.state.data()?.content ?? []).filter((entry) => matchesEntry(entry, this.user(), this.result())));
  protected readonly status = computed(() => (this.state.status() === 'ready' && this.items().length === 0 ? 'empty' : this.state.status()));
  protected readonly totalPages = computed(() => this.state.data()?.totalPages ?? 0);

  constructor() {
    inject(SeoService).apply({ title: 'Journal d’audit', noindex: true });
    const subscription = this.searchInput.pipe(debounceTime(SEARCH_DELAY_MS), distinctUntilChanged()).subscribe((term) => {
      this.user.set(term);
      this.page.set(0);
      this.state.load();
    });
    this.state.load();
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      this.state.destroy();
    });
  }

  protected onSearch(term: string): void {
    this.searchInput.next(term);
  }

  protected setStatus(event: Event): void {
    this.result.set((event.target as HTMLSelectElement).value as JournalStatus);
    this.page.set(0);
    this.state.load();
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.state.load();
  }
}
