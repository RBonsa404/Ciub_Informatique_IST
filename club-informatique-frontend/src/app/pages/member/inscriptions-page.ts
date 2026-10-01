import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Page } from '../../core/api/api-client';
import { InscriptionsQuery, MemberApi } from '../../core/api/member.api';
import { Inscription, STATUT_INSCRIPTION_LABELS, StatutInscription } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
import { FeatureService } from '../../core/config/feature.service';
import { toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, parseApiDate } from '../../shared/format/format';
import { BadgeVariant, Badge } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { Icon } from '../../shared/ui/icon/icon';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';

export type InscriptionFilter = 'toutes' | 'formations' | 'evenements' | 'attente';

const FILTERS: readonly { key: InscriptionFilter; label: string }[] = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'formations', label: 'Formations' },
  { key: 'evenements', label: 'Événements' },
  { key: 'attente', label: 'Liste d’attente' },
];

const QUERIES: Record<InscriptionFilter, Pick<InscriptionsQuery, 'type' | 'statut'>> = {
  toutes: {},
  formations: { type: 'FORMATION' },
  evenements: { type: 'EVENEMENT' },
  attente: { statut: 'LISTE_ATTENTE' },
};

const EMPTY_MESSAGES: Record<InscriptionFilter, string> = {
  toutes: 'Vous n’avez encore aucune inscription.',
  formations: 'Vous n’êtes inscrit à aucune formation.',
  evenements: 'Vous n’êtes inscrit à aucun événement.',
  attente: 'Vous n’êtes sur aucune liste d’attente.',
};

const BADGES: Record<StatutInscription, BadgeVariant> = { CONFIRMEE: 'success', LISTE_ATTENTE: 'amber', ANNULEE: 'neutral' };
const PAGE_SIZE = 10;

/** Le filtre est appliqué par le serveur ; il est revérifié ici pour qu'une ligne hors filtre ne soit jamais affichée. */
export function matchesFilter(inscription: Inscription, filter: InscriptionFilter): boolean {
  switch (filter) {
    case 'formations':
      return !!inscription.sessionFormationId;
    case 'evenements':
      return !!inscription.evenementId;
    case 'attente':
      return inscription.statut === 'LISTE_ATTENTE';
    default:
      return true;
  }
}

/** Mes inscriptions (écran 28) : historique paginé, filtres et annulation d'une inscription à venir. */
@Component({
  selector: 'app-inscriptions-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, Button, Pagination, DataZone, Skeleton, FrDatePipe],
  styles: `
    .rows {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .rank {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--accent-active);
      min-width: 25px;
    }
    .side {
      display: flex;
      align-items: center;
      gap: 0.75rem 1.5rem;
      flex-wrap: wrap;
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Mes inscriptions</h1>
        <p class="space-lead">Retrouvez vos inscriptions aux formations et aux événements du club, ainsi que leur historique.</p>
      </div>
    </div>

    <div class="chip-row" role="group" aria-label="Filtrer les inscriptions">
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

    <app-data-zone [status]="status()" [emptyMessage]="emptyMessage()" emptyIcon="file" (retry)="state.load()">
      <div zone-skeleton class="rows">
        <app-skeleton height="84px" radius="16px" />
        <app-skeleton height="84px" radius="16px" />
        <app-skeleton height="84px" radius="16px" />
      </div>
      @if (catalogEnabled) {
        <a zone-empty class="btn btn-secondary btn-sm" routerLink="/formations">Découvrir les formations</a>
      }

      <ul class="rows" aria-live="polite">
        @for (item of items(); track item.id; let index = $index) {
          <li class="glass-panel list-row">
            <div class="flex min-w-0 items-center gap-5">
              <span class="rank" aria-hidden="true">{{ offset() + index + 1 }}</span>
              <div class="min-w-0">
                <h2 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.25rem">
                  @if (detailLink(item); as link) {
                    <a [routerLink]="link">{{ titleOf(item) }}</a>
                  } @else {
                    {{ titleOf(item) }}
                  }
                </h2>
                <span style="font-size: 0.8rem; color: var(--text-muted)">
                  {{ item.evenementId ? 'Événement' : 'Formation' }}
                  @if (item.lieu) {
                    • {{ item.lieu }}
                  }
                </span>
              </div>
            </div>
            <div class="side">
              @if (item.dateDebut) {
                <span class="meta-line" style="font-size: 0.85rem; color: var(--text-secondary)">
                  <app-icon name="calendar" [size]="14" /> {{ item.dateDebut | frDate: 'court' }}
                </span>
              }
              <app-badge [variant]="badges[item.statut]" style="padding: 0.35rem 0.85rem">{{ labels[item.statut] }}</app-badge>
              @if (cancellable(item)) {
                <button appBtn variant="secondary" size="sm" type="button" [loading]="pendingId() === item.id" (click)="cancel(item)">
                  Annuler<span class="sr-only"> l’inscription à {{ titleOf(item) }}</span>
                </button>
              }
            </div>
          </li>
        }
      </ul>
      <app-pagination [page]="page()" [totalPages]="totalPages()" label="Pages des inscriptions" (pageChange)="goTo($event)" />
    </app-data-zone>
  `,
})
export class InscriptionsPage {
  private readonly api = inject(MemberApi);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly features = inject(FeatureService);

  protected readonly filters = FILTERS;
  protected readonly labels = STATUT_INSCRIPTION_LABELS;
  protected readonly badges = BADGES;
  protected readonly catalogEnabled = this.features.isEnabled('formations');

  protected readonly filter = signal<InscriptionFilter>('toutes');
  protected readonly page = signal(0);
  protected readonly pendingId = signal<number | null>(null);

  protected readonly state = new ResourceState<Page<Inscription>>(() => this.api.inscriptions({ page: this.page(), size: PAGE_SIZE, ...QUERIES[this.filter()] }));
  protected readonly items = computed(() => (this.state.data()?.content ?? []).filter((item) => matchesFilter(item, this.filter())));
  protected readonly status = computed(() => (this.state.status() === 'ready' && this.items().length === 0 ? 'empty' : this.state.status()));
  protected readonly totalPages = computed(() => this.state.data()?.totalPages ?? 0);
  protected readonly offset = computed(() => (this.state.data()?.page ?? 0) * PAGE_SIZE);
  protected readonly emptyMessage = computed(() => EMPTY_MESSAGES[this.filter()]);

  constructor() {
    inject(SeoService).apply({ title: 'Mes inscriptions', noindex: true });
    this.state.load();
    inject(DestroyRef).onDestroy(() => this.state.destroy());
  }

  protected setFilter(filter: InscriptionFilter): void {
    if (filter === this.filter()) return;
    this.filter.set(filter);
    this.page.set(0);
    this.state.load();
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.state.load();
  }

  protected titleOf(item: Inscription): string {
    return item.evenementTitre ?? item.formationTitre ?? '';
  }

  /** Lien vers la fiche publique, si le serveur fournit son identifiant d'adresse et si le module est ouvert. */
  protected detailLink(item: Inscription): readonly string[] | null {
    if (item.evenementSlug && this.features.isEnabled('evenements')) return ['/evenements', item.evenementSlug];
    if (item.formationSlug && this.catalogEnabled) return ['/formations', item.formationSlug];
    return null;
  }

  protected cancellable(item: Inscription): boolean {
    return item.statut !== 'ANNULEE' && (parseApiDate(item.dateDebut)?.getTime() ?? 0) > Date.now();
  }

  protected cancel(item: Inscription): void {
    this.dialogs
      .confirm({
        title: 'Annuler l’inscription',
        message: 'Souhaitez-vous annuler votre inscription ? Votre place sera libérée.',
        confirmLabel: 'Annuler l’inscription',
        cancelLabel: 'Conserver',
        danger: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.pendingId.set(item.id);
        this.api.annulerInscription(item.id).subscribe({
          next: () => {
            this.pendingId.set(null);
            this.state.refresh();
            this.toasts.success('Votre inscription est annulée.');
          },
          error: (failure: unknown) => {
            this.pendingId.set(null);
            const error = toApiError(failure);
            if (error.kind !== 'server' && error.kind !== 'rate-limit') this.toasts.danger(error.userMessage);
          },
        });
      });
  }
}
