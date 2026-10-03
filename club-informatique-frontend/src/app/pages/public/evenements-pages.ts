import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Evenement } from '../../core/api/models';
import { PublicApi } from '../../core/api/public.api';
import { ResourceState } from '../../core/api/resource-state';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, FrNumberPipe, formatDateRange, formatTimeRange, parseApiDate, toBlocks } from '../../shared/format/format';
import { InscriptionAction } from '../../shared/inscription/inscription-action';
import { Badge } from '../../shared/ui/card/card';
import { Icon } from '../../shared/ui/icon/icon';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone, PagedList } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { environment } from '../../../environments/environment';

const isPast = (event: Evenement): boolean => (parseApiDate(event.dateFin)?.getTime() ?? 0) < Date.now();

/** Événements, liste (écran 06) : le prochain événement est mis en avant, les suivants en cartes. */
@Component({
  selector: 'app-evenements-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, Pagination, DataZone, Skeleton, FrDatePipe],
  styles: `
    .featured {
      padding: 2rem;
      margin-bottom: 2.5rem;
      border-left: 5px solid var(--color-blue-royal);
    }
    .meta {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1.5rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 350px), 1fr));
      gap: 1.5rem;
    }
    .summary {
      white-space: pre-line;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `,
  template: `
    <div class="page-section">
      <div class="page-container">
        <h1 class="page-title">Événements <span class="accent">du club</span></h1>
        <p class="page-lead">Les prochains événements du club. Connectez-vous pour vous y inscrire.</p>

        <app-data-zone [status]="list.status()" emptyMessage="Aucun événement n’est programmé pour le moment." emptyIcon="calendar" (retry)="list.reload()">
          <div zone-skeleton>
            <app-skeleton height="240px" radius="var(--radius-lg)" />
            <div class="grid" style="margin-top: 2.5rem">
              <app-skeleton height="120px" radius="var(--radius-lg)" />
              <app-skeleton height="120px" radius="var(--radius-lg)" />
            </div>
          </div>

          @if (featured(); as event) {
            <article class="glass-panel featured">
              <app-badge variant="amber" style="margin-bottom: 1rem"><app-icon name="star" [size]="13" /> Prochain événement</app-badge>
              <h2 style="font-size: 1.5rem; margin-bottom: 0.75rem">{{ event.titre }}</h2>
              <p class="summary" style="font-size: 0.95rem; margin-bottom: 1.25rem">{{ event.description }}</p>
              <div class="meta">
                <span class="meta-line" style="font-size: 0.88rem"><app-icon name="calendar" [size]="15" /> {{ dateRange(event) }}</span>
                <span class="meta-line" style="font-size: 0.88rem"><app-icon name="clock" [size]="15" /> {{ timeRange(event) }}</span>
                <span class="meta-line" style="font-size: 0.88rem"><app-icon name="map-pin" [size]="15" /> {{ event.lieu }}</span>
              </div>
              <a class="btn btn-primary" [routerLink]="['/evenements', event.slug]">Voir l’événement <app-icon name="arrow-right" [size]="16" /></a>
            </article>
          }

          @if (others().length > 0) {
            <h2 style="margin-bottom: 1.5rem; font-size: 1.2rem">Événements suivants</h2>
            <div class="grid">
              @for (event of others(); track event.id; let odd = $odd) {
                <article class="glass-card date-card" [class.alt]="odd">
                  <div class="date-chip" aria-hidden="true">
                    <span class="date-chip-day">{{ event.dateDebut | frDate: 'jour' }}</span>
                    <span class="date-chip-month">{{ event.dateDebut | frDate: 'mois' }}</span>
                  </div>
                  <div class="min-w-0">
                    <h3 class="media-title" style="font-size: 1rem; margin-bottom: 0.4rem">
                      <a [routerLink]="['/evenements', event.slug]">{{ event.titre }}</a>
                    </h3>
                    <div class="flex flex-col gap-1" style="margin-bottom: 0.5rem">
                      <span class="meta-line">{{ event.dateDebut | frDate: 'long' }}</span>
                      <span class="meta-line"><app-icon name="clock" [size]="14" /> {{ timeRange(event) }}</span>
                      <span class="meta-line"><app-icon name="map-pin" [size]="14" /> {{ event.lieu }}</span>
                    </div>
                    @if (event.categorieNom) {
                      <app-badge [variant]="odd ? 'amber' : 'primary'" style="font-size: 0.7rem">{{ event.categorieNom }}</app-badge>
                    }
                  </div>
                </article>
              }
            </div>
          }
          <div style="margin-top: 2rem">
            <app-pagination [page]="list.page()" [totalPages]="list.totalPages()" label="Pages des événements" (pageChange)="list.goTo($event)" />
          </div>
        </app-data-zone>
      </div>
    </div>
  `,
})
export class EvenementsListPage {
  private readonly api = inject(PublicApi);
  protected readonly list = new PagedList<Evenement>((query) => this.api.evenements({ ...query, aVenir: true, sort: 'dateDebut,asc' }), 9);
  protected readonly featured = computed(() => (this.list.page() === 0 ? (this.list.items()[0] ?? null) : null));
  protected readonly others = computed(() => (this.list.page() === 0 ? this.list.items().slice(1) : this.list.items()));

  constructor() {
    inject(SeoService).apply({ title: 'Événements', description: 'Ateliers, rencontres et activités à venir du Club Informatique de l’IST à Ouagadougou. Consultez les dates et inscrivez-vous en ligne.', path: '/evenements' });
  }

  protected dateRange(event: Evenement): string {
    return formatDateRange(event.dateDebut, event.dateFin);
  }

  protected timeRange(event: Evenement): string {
    return formatTimeRange(event.dateDebut, event.dateFin);
  }
}

/** Événement, détail (écran 07) : description, informations pratiques réelles et inscription. */
@Component({
  selector: 'app-evenement-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, DataZone, Skeleton, InscriptionAction, FrNumberPipe],
  styles: `
    .info {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      font-size: 0.9rem;
    }
    .info app-icon {
      color: var(--accent-active);
      margin-top: 0.15rem;
    }
    .info strong {
      display: block;
    }
  `,
  template: `
    <div class="page-section">
      <div class="page-container">
        <a routerLink="/evenements" class="back-link"><app-icon name="arrow-left" [size]="16" /> Retour aux événements</a>
        <app-data-zone [status]="event.status()" emptyMessage="Cet événement n’est plus disponible." [errorMessage]="errorMessage()" (retry)="event.load()">
          <div zone-skeleton class="two-cols">
            <div>
              <app-skeleton width="60%" height="2.5rem" />
              <div style="margin-top: 1.5rem"><app-skeleton height="8rem" /></div>
            </div>
            <app-skeleton height="260px" radius="var(--radius-lg)" />
          </div>
          @if (event.data(); as item) {
            <div class="two-cols">
              <div>
                @if (item.categorieNom) {
                  <app-badge variant="amber" style="margin-bottom: 1rem">{{ item.categorieNom }}</app-badge>
                }
                <h1 style="font-size: clamp(1.8rem, 3.5vw, 2.5rem); margin-bottom: 1.25rem">{{ item.titre }}</h1>
                <div style="margin-bottom: 2.5rem; display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1rem">
                  <app-inscription-action [target]="{ kind: 'evenement', id: item.id }" [full]="full()" [closed]="past()" size="lg" (changed)="event.refresh()" />
                  @if (!past()) {
                    <a class="btn btn-secondary" [href]="calendarUrl(item.id)" [attr.download]="'evenement-' + item.id + '.ics'">
                      <app-icon name="calendar" [size]="16" />
                      Ajouter au calendrier
                    </a>
                  }
                </div>
                <div class="glass-panel" style="padding: 1.5rem">
                  <h2 style="font-size: 1.25rem; margin-bottom: 1.25rem">Description</h2>
                  <div class="prose" style="font-size: 1rem">
                    @for (block of blocks(); track $index) {
                      @if (block.kind === 'heading') {
                        <h3 style="font-size: 1.1rem; margin: 1.25rem 0 0.5rem">{{ block.text }}</h3>
                      } @else {
                        <p>{{ block.text }}</p>
                      }
                    }
                  </div>
                </div>
              </div>

              <aside class="glass-panel" style="padding: 1.5rem" aria-labelledby="titre-infos">
                <h2 id="titre-infos" style="margin-bottom: 1rem; font-size: 1.1rem">Informations pratiques</h2>
                <div class="flex flex-col gap-[0.85rem]">
                  <div class="info">
                    <app-icon name="calendar" />
                    <div><strong>Date</strong>{{ dateRange() }}</div>
                  </div>
                  <div class="info">
                    <app-icon name="clock" />
                    <div><strong>Horaires</strong>{{ timeRange() }}</div>
                  </div>
                  <div class="info">
                    <app-icon name="map-pin" />
                    <div><strong>Lieu</strong>{{ item.lieu }}</div>
                  </div>
                  @if (item.capaciteMax !== null && item.capaciteMax !== undefined) {
                    <div class="info">
                      <app-icon name="users" />
                      <div>
                        <strong>Places</strong>
                        @if (item.placesRestantes !== null && item.placesRestantes !== undefined) {
                          @if (full()) {
                            Complet : inscription en liste d’attente
                          } @else {
                            {{ item.placesRestantes | frNumber }} sur {{ item.capaciteMax | frNumber }} disponibles
                          }
                        } @else {
                          {{ item.capaciteMax | frNumber }} au total
                        }
                      </div>
                    </div>
                  }
                  @if (item.organisateurNom) {
                    <div class="info">
                      <app-icon name="user" />
                      <div><strong>Organisation</strong>{{ item.organisateurNom }}</div>
                    </div>
                  }
                </div>
              </aside>
            </div>
          }
        </app-data-zone>
      </div>
    </div>
  `,
})
export class EvenementDetailPage {
  /** Fichier iCalendar de l'événement, servi par l'API. */
  protected calendarUrl(id: number): string {
    return `${environment.apiBaseUrl}/evenements/${id}/calendrier`;
  }

  readonly slug = input.required<string>();

  private readonly api = inject(PublicApi);
  private readonly seo = inject(SeoService);
  protected readonly event = new ResourceState<Evenement>(() => this.api.evenement(this.slug()));
  protected readonly blocks = computed(() => toBlocks(this.event.data()?.description));
  protected readonly full = computed(() => {
    const item = this.event.data();
    return !!item && item.capaciteMax !== null && item.capaciteMax !== undefined && (item.placesRestantes ?? 1) <= 0;
  });
  protected readonly past = computed(() => {
    const item = this.event.data();
    return !!item && isPast(item);
  });
  protected readonly dateRange = computed(() => {
    const item = this.event.data();
    return item ? formatDateRange(item.dateDebut, item.dateFin) : '';
  });
  protected readonly timeRange = computed(() => {
    const item = this.event.data();
    return item ? formatTimeRange(item.dateDebut, item.dateFin) : '';
  });
  protected readonly errorMessage = computed(() => (this.event.error()?.kind === 'not-found' ? 'Cet événement est introuvable ou n’est plus publié.' : null));

  constructor() {
    this.seo.apply({ title: 'Événement', path: '/evenements' });
    const a = toObservable(this.slug).subscribe(() => this.event.load());
    const b = toObservable(this.event.data).subscribe((item) => {
      if (item) this.seo.apply({ title: item.titre, description: item.description.slice(0, 160), path: `/evenements/${item.slug}` });
    });
    inject(DestroyRef).onDestroy(() => {
      a.unsubscribe();
      b.unsubscribe();
      this.event.destroy();
    });
  }
}
