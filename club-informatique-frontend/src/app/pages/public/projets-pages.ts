import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Categorie, Projet, STATUT_PROJET_LABELS, StatutProjet } from '../../core/api/models';
import { PublicApi } from '../../core/api/public.api';
import { ResourceState } from '../../core/api/resource-state';
import { SeoService } from '../../core/seo/seo.service';
import { FrNumberPipe, initialsOf, toBlocks } from '../../shared/format/format';
import { Badge, BadgeVariant } from '../../shared/ui/card/card';
import { Icon } from '../../shared/ui/icon/icon';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone, PagedList } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';

const STATUT_VARIANT: Record<StatutProjet, BadgeVariant> = { PROPOSE: 'neutral', VALIDE: 'primary', REJETE: 'danger', EN_COURS: 'success', TERMINE: 'neutral' };
const ROLE_LABELS: Record<string, string> = { PORTEUR: 'Porteur du projet', CONTRIBUTEUR: 'Contributeur' };

/** Projets, vitrine (écran 08). */
@Component({
  selector: 'app-projets-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, Pagination, DataZone, Skeleton],
  styles: `
    .avatars {
      display: flex;
    }
    .avatars .user-avatar {
      width: 28px;
      height: 28px;
      font-size: 0.65rem;
      border: 2px solid var(--bg-app);
    }
    .avatars .user-avatar + .user-avatar {
      margin-left: -8px;
    }
    .details {
      position: relative;
      z-index: 1;
    }
  `,
  template: `
    <div class="page-section">
      <div class="page-container">
        <h1 class="page-title">Projets <span class="accent">du club</span></h1>
        <p class="page-lead">Les projets réalisés par les membres du Club Informatique de l’IST.</p>

        @if (categories().length > 0) {
          <div class="filter-chips" style="margin-bottom: 2rem" role="group" aria-label="Filtrer par catégorie">
            <button type="button" class="btn btn-sm" [class]="list.categorieId() === null ? 'btn-primary' : 'btn-secondary'" [attr.aria-pressed]="list.categorieId() === null" (click)="list.setCategorie(null)">
              Tous
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

        <app-data-zone
          [status]="list.status()"
          [emptyMessage]="list.filtered() ? 'Aucun projet dans cette catégorie.' : 'Aucun projet n’est enregistré pour le moment.'"
          emptyIcon="folder"
          (retry)="list.reload()"
        >
          <div zone-skeleton class="card-grid">
            @for (i of placeholders; track i) {
              <app-skeleton height="340px" radius="var(--radius-lg)" />
            }
          </div>
          @if (list.filtered()) {
            <button zone-empty type="button" class="btn btn-secondary" (click)="list.resetFilters()">Voir tous les projets</button>
          }
          <div class="card-grid" aria-live="polite">
            @for (projet of list.items(); track projet.id; let i = $index) {
              <article class="glass-card media-card">
                <div class="media-visual" [class.v2]="i % 3 === 1" [class.v3]="i % 3 === 2">
                  <app-icon [name]="i % 2 === 0 ? 'monitor' : 'code'" [size]="48" [strokeWidth]="1.5" />
                </div>
                <div class="media-body">
                  <div class="media-meta">
                    @if (projet.categorieNom) {
                      <app-badge variant="primary">{{ projet.categorieNom }}</app-badge>
                    } @else {
                      <span></span>
                    }
                    <app-badge [variant]="variant(projet.statut)" style="font-size: 0.7rem">{{ labels[projet.statut] }}</app-badge>
                  </div>
                  <h2 class="media-title">
                    <a [routerLink]="['/projets', projet.slug]">{{ projet.titre }}</a>
                  </h2>
                  <p class="media-text line-clamp-3" style="margin-bottom: 1rem">{{ projet.description }}</p>
                  <div class="flex items-center justify-between" style="margin-top: auto">
                    <div class="avatars" aria-hidden="true">
                      @for (membre of (projet.membres ?? []).slice(0, 3); track membre.id) {
                        <div class="user-avatar">{{ initials(membre.utilisateurNom) }}</div>
                      }
                    </div>
                    <span class="btn btn-outline btn-sm details" aria-hidden="true">Détails <app-icon name="arrow-right" [size]="14" /></span>
                  </div>
                </div>
              </article>
            }
          </div>
          <div style="margin-top: 2rem">
            <app-pagination [page]="list.page()" [totalPages]="list.totalPages()" label="Pages des projets" (pageChange)="list.goTo($event)" />
          </div>
        </app-data-zone>
      </div>
    </div>
  `,
})
export class ProjetsListPage {
  private readonly api = inject(PublicApi);
  protected readonly placeholders = ['a', 'b', 'c'];
  protected readonly labels = STATUT_PROJET_LABELS;
  protected readonly list = new PagedList<Projet>((query) => this.api.projets(query), 9);
  private readonly categoriesState = new ResourceState<readonly Categorie[]>(() => this.api.categories().pipe(catchError(() => of([]))));
  protected readonly categories = computed(() => this.categoriesState.data() ?? []);

  constructor() {
    inject(SeoService).apply({ title: 'Projets', description: 'Projets des membres du Club Informatique de l’IST.', path: '/projets' });
    this.categoriesState.load();
    inject(DestroyRef).onDestroy(() => this.categoriesState.destroy());
  }

  protected variant(statut: StatutProjet): BadgeVariant {
    return STATUT_VARIANT[statut];
  }

  protected initials(name: string): string {
    return initialsOf(name);
  }
}

/** Projet, détail (écran 09). L'avancement affiché est celui saisi lors du suivi ; aucune liste de tâches inventée. */
@Component({
  selector: 'app-projet-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, DataZone, Skeleton, FrNumberPipe],
  template: `
    <div class="page-section">
      <div class="page-container" style="max-width: 1000px">
        <a routerLink="/projets" class="back-link"><app-icon name="arrow-left" [size]="16" /> Retour aux projets</a>
        <app-data-zone [status]="projet.status()" emptyMessage="Ce projet n’est plus disponible." [errorMessage]="errorMessage()" (retry)="projet.load()">
          <div zone-skeleton class="glass-panel" style="padding: 2.5rem">
            <app-skeleton width="30%" height="1.5rem" />
            <div style="margin: 1.5rem 0"><app-skeleton width="70%" height="2.3rem" /></div>
            <app-skeleton height="8rem" />
          </div>
          @if (projet.data(); as item) {
            <article class="glass-panel" style="padding: clamp(1.25rem, 4vw, 2.5rem)">
              <div class="flex flex-wrap gap-3" style="margin-bottom: 1.5rem">
                @if (item.categorieNom) {
                  <app-badge variant="primary">{{ item.categorieNom }}</app-badge>
                }
                <app-badge [variant]="variant(item.statut)">{{ labels[item.statut] }}</app-badge>
              </div>
              <h1 style="font-size: clamp(1.8rem, 3vw, 2.3rem); margin-bottom: 1.25rem">{{ item.titre }}</h1>
              <div class="prose" style="margin-bottom: 2rem">
                @for (block of blocks(); track $index) {
                  <p>{{ block.text }}</p>
                }
              </div>

              @if (item.avancementPourcentage !== null && item.avancementPourcentage !== undefined && item.statut !== 'PROPOSE') {
                <section class="glass-panel-subtle" style="padding: 1.5rem; margin-bottom: 2rem" aria-labelledby="titre-avancement">
                  <div class="flex items-center justify-between" style="margin-bottom: 0.75rem">
                    <h2 id="titre-avancement" style="font-size: 1.15rem">Avancement</h2>
                    <span class="accent-cyan" style="font-weight: 700">{{ item.avancementPourcentage | frNumber }}&nbsp;%</span>
                  </div>
                  <div
                    class="progress"
                    role="progressbar"
                    aria-labelledby="titre-avancement"
                    [attr.aria-valuenow]="item.avancementPourcentage"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <span [style.width.%]="item.avancementPourcentage"></span>
                  </div>
                </section>
              }

              @if (item.objectifs) {
                <section class="glass-panel-subtle" style="padding: 1.5rem; margin-bottom: 2rem">
                  <h2 style="font-size: 1.15rem; margin-bottom: 1rem">Objectifs</h2>
                  <p style="white-space: pre-line; font-size: 0.95rem">{{ item.objectifs }}</p>
                </section>
              }

              @if (technologies().length > 0) {
                <section style="margin-bottom: 2rem">
                  <h2 style="font-size: 1.15rem; margin-bottom: 1rem">Technologies</h2>
                  <div class="flex flex-wrap gap-2">
                    @for (technologie of technologies(); track technologie) {
                      <app-badge variant="neutral">{{ technologie }}</app-badge>
                    }
                  </div>
                </section>
              }

              @if (item.depotGit || item.documentationUrl) {
                <div class="flex flex-wrap gap-3" style="margin-bottom: 2rem">
                  @if (item.depotGit) {
                    <a class="btn btn-secondary btn-sm" [href]="item.depotGit" target="_blank" rel="noopener noreferrer">
                      <app-icon name="code" [size]="14" /> Dépôt du code <span class="sr-only">(nouvel onglet)</span>
                    </a>
                  }
                  @if (item.documentationUrl) {
                    <a class="btn btn-secondary btn-sm" [href]="item.documentationUrl" target="_blank" rel="noopener noreferrer">
                      <app-icon name="book-open" [size]="14" /> Documentation <span class="sr-only">(nouvel onglet)</span>
                    </a>
                  }
                </div>
              }

              @if ((item.membres ?? []).length > 0) {
                <h2 style="font-size: 1.15rem; margin-bottom: 1rem">Équipe du projet</h2>
                <ul class="flex flex-wrap gap-6" style="list-style: none">
                  @for (membre of item.membres!; track membre.id) {
                    <li class="flex items-center gap-[0.6rem]">
                      <div class="user-avatar" aria-hidden="true">{{ initials(membre.utilisateurNom) }}</div>
                      <div>
                        <div style="font-weight: 600; font-size: 0.9rem">{{ membre.utilisateurNom }}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted)">{{ roleLabel(membre.role) }}</div>
                      </div>
                    </li>
                  }
                </ul>
              }
            </article>
          }
        </app-data-zone>
      </div>
    </div>
  `,
})
export class ProjetDetailPage {
  readonly slug = input.required<string>();

  private readonly api = inject(PublicApi);
  private readonly seo = inject(SeoService);
  protected readonly labels = STATUT_PROJET_LABELS;
  protected readonly projet = new ResourceState<Projet>(() => this.api.projet(this.slug()));
  protected readonly blocks = computed(() => toBlocks(this.projet.data()?.description));
  protected readonly technologies = computed(() =>
    (this.projet.data()?.technologies ?? '')
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean),
  );
  protected readonly errorMessage = computed(() => (this.projet.error()?.kind === 'not-found' ? 'Ce projet est introuvable ou n’est pas publié.' : null));

  constructor() {
    this.seo.apply({ title: 'Projet', path: '/projets' });
    const a = toObservable(this.slug).subscribe(() => this.projet.load());
    const b = toObservable(this.projet.data).subscribe((item) => {
      if (item) this.seo.apply({ title: item.titre, description: item.description.slice(0, 160), path: `/projets/${item.slug}` });
    });
    inject(DestroyRef).onDestroy(() => {
      a.unsubscribe();
      b.unsubscribe();
      this.projet.destroy();
    });
  }

  protected variant(statut: StatutProjet): BadgeVariant {
    return STATUT_VARIANT[statut];
  }

  protected initials(name: string): string {
    return initialsOf(name);
  }

  protected roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }
}
