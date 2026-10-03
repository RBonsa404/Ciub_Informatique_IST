import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Actualite, Categorie } from '../../core/api/models';
import { PublicApi } from '../../core/api/public.api';
import { ResourceState } from '../../core/api/resource-state';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, initialsOf, toBlocks } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { InputGroup } from '../../shared/ui/field/input-group';
import { Icon } from '../../shared/ui/icon/icon';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone, PagedList } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';

/** Actualités, liste (écran 04) : recherche, filtre par catégorie réelle, pagination côté serveur. */
@Component({
  selector: 'app-actualites-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, InputGroup, Pagination, DataZone, Skeleton, FrDatePipe],
  template: `
    <div class="page-section">
      <div class="page-container">
        <h1 class="page-title">Actualités <span class="accent">du club</span></h1>
        <p class="page-lead">Les dernières nouvelles du Club Informatique de l’IST.</p>

        <div class="glass-panel filter-bar" role="search">
          <div class="filter-search">
            <label class="sr-only" for="recherche-actualites">Rechercher une actualité</label>
            <app-input-group icon="search">
              <input
                id="recherche-actualites"
                type="search"
                class="form-input"
                placeholder="Rechercher une actualité"
                [value]="list.search()"
                (input)="list.onSearch($any($event.target).value)"
              />
            </app-input-group>
          </div>
          @if (categoriesPending()) {
            <!-- Place réservée aux filtres pendant leur chargement : la liste ne se décale pas à leur arrivée. -->
            <div class="filter-chips" style="min-height: 2.5rem" aria-hidden="true"></div>
          } @else if (categories().length > 0) {
            <div class="filter-chips" role="group" aria-label="Filtrer par catégorie">
              <button type="button" class="btn btn-sm" [class]="list.categorieId() === null ? 'btn-primary' : 'btn-secondary'" [attr.aria-pressed]="list.categorieId() === null" (click)="list.setCategorie(null)">
                Toutes
              </button>
              @for (categorie of categories(); track categorie.id) {
                <button
                  type="button"
                  class="btn btn-sm"
                  [class]="list.categorieId() === categorie.id ? 'btn-primary' : 'btn-secondary'"
                  [attr.aria-pressed]="list.categorieId() === categorie.id"
                  (click)="list.setCategorie(categorie.id)"
                >
                  {{ categorie.nom }}
                </button>
              }
            </div>
          }
        </div>

        <app-data-zone
          [status]="list.status()"
          [emptyMessage]="list.filtered() ? emptyFiltered() : 'Aucune publication n’a encore été diffusée.'"
          emptyIcon="newspaper"
          (retry)="list.reload()"
        >
          <div zone-skeleton class="card-grid">
            @for (i of placeholders; track i) {
              <app-skeleton height="320px" radius="var(--radius-lg)" />
            }
          </div>
          @if (list.filtered()) {
            <button zone-empty type="button" class="btn btn-secondary" (click)="list.resetFilters()">Réinitialiser les filtres</button>
          }
          <div class="card-grid" aria-live="polite">
            @for (item of list.items(); track item.id; let i = $index) {
              <article class="glass-card media-card">
                <div class="media-visual" [class.v2]="i % 3 === 1" [class.v3]="i % 3 === 2">
                  @if (item.image) {
                    <img [src]="item.image" alt="" loading="lazy" />
                  } @else {
                    <app-icon name="newspaper" [size]="48" [strokeWidth]="1.5" />
                  }
                </div>
                <div class="media-body">
                  <div class="media-meta">
                    @if (item.categorieNom) {
                      <app-badge variant="primary">{{ item.categorieNom }}</app-badge>
                    } @else {
                      <span></span>
                    }
                    <span>{{ item.datePublication ?? item.createdAt | frDate: 'court' }}</span>
                  </div>
                  <h2 class="media-title">
                    <a [routerLink]="['/actualites', item.slug]">{{ item.titre }}</a>
                  </h2>
                  @if (item.resume) {
                    <p class="media-text">{{ item.resume }}</p>
                  }
                </div>
              </article>
            }
          </div>
          <div style="margin-top: 2rem">
            <app-pagination [page]="list.page()" [totalPages]="list.totalPages()" label="Pages des actualités" (pageChange)="list.goTo($event)" />
          </div>
        </app-data-zone>
      </div>
    </div>
  `,
})
export class ActualitesListPage {
  private readonly api = inject(PublicApi);
  protected readonly placeholders = ['a', 'b', 'c'];
  protected readonly list = new PagedList<Actualite>((query) => this.api.actualites(query), 9);
  private readonly categoriesState = new ResourceState<readonly Categorie[]>(() => this.api.categories().pipe(catchError(() => of([]))));
  protected readonly categories = computed(() => this.categoriesState.data() ?? []);
  protected readonly categoriesPending = computed(() => this.categoriesState.status() === 'loading');
  protected readonly emptyFiltered = computed(() => {
    const term = this.list.search().trim();
    return term ? `Aucun résultat pour « ${term} ». Modifiez votre recherche ou vos filtres.` : 'Aucun résultat. Modifiez vos filtres.';
  });

  constructor() {
    inject(SeoService).apply({ title: 'Actualités', description: 'Les dernières nouvelles du Club Informatique de l’IST : annonces, comptes rendus d’activités et informations utiles aux étudiants.', path: '/actualites' });
    this.categoriesState.load();
    inject(DestroyRef).onDestroy(() => this.categoriesState.destroy());
  }
}

/** Actualité, détail (écran 05). */
@Component({
  selector: 'app-actualite-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, DataZone, Skeleton, FrDatePipe],
  styles: `
    .author {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 2rem;
    }
    .cover {
      height: 300px;
      background: linear-gradient(135deg, #1d4ed8, #0b1e3f);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2rem;
      overflow: hidden;
      color: #38bdf8;
    }
    .cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
  template: `
    <div class="page-section">
      <div class="page-container" style="max-width: 900px">
        <a routerLink="/actualites" class="back-link"><app-icon name="arrow-left" [size]="16" /> Retour aux actualités</a>
        <app-data-zone [status]="article.status()" emptyMessage="Cette actualité n’est plus disponible." [errorMessage]="errorMessage()" (retry)="article.load()">
          <div zone-skeleton class="glass-panel" style="padding: 2.5rem">
            <app-skeleton width="30%" height="1.5rem" />
            <div style="margin: 1.5rem 0"><app-skeleton width="80%" height="2.5rem" /></div>
            <app-skeleton height="300px" radius="var(--radius-lg)" />
            <div style="margin-top: 2rem"><app-skeleton height="6rem" /></div>
          </div>
          @if (article.data(); as item) {
            <article class="glass-panel" style="padding: clamp(1.25rem, 4vw, 2.5rem)">
              <div class="flex flex-wrap gap-3" style="margin-bottom: 1.5rem">
                @if (item.categorieNom) {
                  <app-badge variant="primary">{{ item.categorieNom }}</app-badge>
                }
                <app-badge variant="neutral">{{ item.datePublication ?? item.createdAt | frDate: 'long' }}</app-badge>
              </div>
              <h1 style="font-size: clamp(1.8rem, 3.5vw, 2.5rem); margin-bottom: 1.5rem">{{ item.titre }}</h1>
              @if (item.auteurNom) {
                <div class="author">
                  <div class="user-avatar" style="width: 44px; height: 44px" aria-hidden="true">{{ initials(item.auteurNom) }}</div>
                  <div>
                    <div style="font-weight: 600; font-size: 0.95rem">{{ item.auteurNom }}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted)">Publié le {{ item.datePublication ?? item.createdAt | frDate: 'long' }}</div>
                  </div>
                </div>
              }
              <div class="cover">
                @if (item.image) {
                  <img [src]="item.image" alt="" />
                } @else {
                  <app-icon name="newspaper" [size]="64" [strokeWidth]="1.5" />
                }
              </div>
              <div class="prose">
                @for (block of blocks(); track $index) {
                  @switch (block.kind) {
                    @case ('heading') {
                      <h2>{{ block.text }}</h2>
                    }
                    @case ('quote') {
                      <blockquote>{{ block.text }}</blockquote>
                    }
                    @default {
                      <p>{{ block.text }}</p>
                    }
                  }
                }
              </div>
            </article>
          }
        </app-data-zone>
      </div>
    </div>
  `,
})
export class ActualiteDetailPage {
  /** Paramètre de route (liaison d'entrée du routeur). */
  readonly slug = input.required<string>();

  private readonly api = inject(PublicApi);
  private readonly seo = inject(SeoService);
  protected readonly article = new ResourceState<Actualite>(() => this.api.actualite(this.slug()));
  protected readonly blocks = computed(() => toBlocks(this.article.data()?.contenu));
  protected readonly errorMessage = computed(() => (this.article.error()?.kind === 'not-found' ? 'Cette actualité est introuvable ou n’est plus publiée.' : null));

  constructor() {
    this.seo.apply({ title: 'Actualité', path: '/actualites' });
    const subscription = toObservable(this.slug).subscribe(() => this.article.load());
    const dataSubscription = toObservable(this.article.data).subscribe((item) => {
      if (item) this.seo.apply({ title: item.titre, description: item.resume ?? undefined, path: `/actualites/${item.slug}`, image: item.image ?? undefined });
    });
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      dataSubscription.unsubscribe();
      this.article.destroy();
    });
  }

  protected initials(name: string): string {
    return initialsOf(name);
  }
}
