import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { Formation, NIVEAU_LABELS, Ressource, SessionFormation, StatutSession, TYPE_RESSOURCE_LABELS } from '../../core/api/models';
import { PublicApi } from '../../core/api/public.api';
import { ResourceState } from '../../core/api/resource-state';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, FrNumberPipe, formatTimeRange, parseApiDate, toBlocks } from '../../shared/format/format';
import { InscriptionAction } from '../../shared/inscription/inscription-action';
import { Badge } from '../../shared/ui/card/card';
import { InputGroup } from '../../shared/ui/field/input-group';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icon-names';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone, PagedList } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';

const SESSION_LABELS: Record<StatutSession, string> = { PLANIFIEE: 'Planifiée', EN_COURS: 'En cours', TERMINEE: 'Terminée', ANNULEE: 'Annulée' };

/** Formations, catalogue (écran 10). */
@Component({
  selector: 'app-formations-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, Pagination, DataZone, Skeleton],
  styles: `
    .banner {
      padding: 2.5rem;
      margin-bottom: 2.5rem;
      display: flex;
      gap: 2.5rem;
      align-items: center;
      flex-wrap: wrap;
      border: 1.5px solid rgba(56, 189, 248, 0.25);
    }
    .banner-icon {
      width: 120px;
      height: 120px;
      border-radius: 20px;
      background: linear-gradient(135deg, #1d4ed8, #0b1e3f);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 10px 30px rgba(29, 78, 216, 0.3);
      color: #38bdf8;
    }
    .topline {
      height: 10px;
      background: linear-gradient(90deg, var(--color-blue-royal), var(--color-cyan-circuit));
    }
    .topline.t1 {
      background: linear-gradient(90deg, var(--color-amber-tech), #f59e0b);
    }
    .topline.t2 {
      background: linear-gradient(90deg, #10b981, #059669);
    }
    @media (max-width: 600px) {
      .banner {
        padding: 1.5rem;
        gap: 1.25rem;
      }
      .banner-icon {
        width: 72px;
        height: 72px;
      }
    }
  `,
  template: `
    <div class="page-section">
      <div class="page-container">
        <div class="glass-panel banner">
          <div class="banner-icon" aria-hidden="true"><app-icon name="monitor" [size]="56" [strokeWidth]="1.5" /></div>
          <div style="flex: 1; min-width: 220px">
            <h1 style="font-size: clamp(1.8rem, 3.5vw, 2.5rem); margin-bottom: 0.75rem">Nos <span class="accent">formations</span></h1>
            <p style="font-size: 1.05rem">Les formations et ateliers proposés par le Club Informatique de l’IST.</p>
          </div>
        </div>

        <app-data-zone [status]="list.status()" emptyMessage="Aucune formation n’est publiée pour le moment." emptyIcon="book-open" (retry)="list.reload()">
          <div zone-skeleton class="card-grid">
            @for (i of placeholders; track i) {
              <app-skeleton height="240px" radius="var(--radius-lg)" />
            }
          </div>
          <div class="card-grid">
            @for (formation of list.items(); track formation.id; let i = $index) {
              <article class="glass-card media-card">
                <div class="topline" [class.t1]="i % 3 === 1" [class.t2]="i % 3 === 2"></div>
                <div class="media-body" style="padding: 1.5rem">
                  <div class="flex flex-wrap items-center gap-2" style="margin-bottom: 0.75rem">
                    @if (formation.categorieNom) {
                      <app-badge [variant]="i % 3 === 1 ? 'amber' : 'primary'">{{ formation.categorieNom }}</app-badge>
                    }
                    <app-badge variant="neutral" style="font-size: 0.7rem">{{ niveaux[formation.niveau] }}</app-badge>
                  </div>
                  <h2 class="media-title" style="font-size: 1.15rem">
                    <a [routerLink]="['/formations', formation.slug]">{{ formation.titre }}</a>
                  </h2>
                  <p class="media-text line-clamp-3" style="margin-bottom: 1rem">{{ formation.description }}</p>
                  @if (formation.formateurNom) {
                    <div class="meta-line" style="margin-top: auto"><app-icon name="graduation-cap" [size]="15" /> {{ formation.formateurNom }}</div>
                  }
                </div>
              </article>
            }
          </div>
          <div style="margin-top: 2rem">
            <app-pagination [page]="list.page()" [totalPages]="list.totalPages()" label="Pages des formations" (pageChange)="list.goTo($event)" />
          </div>
        </app-data-zone>
      </div>
    </div>
  `,
})
export class FormationsListPage {
  private readonly api = inject(PublicApi);
  protected readonly placeholders = ['a', 'b', 'c'];
  protected readonly niveaux = NIVEAU_LABELS;
  protected readonly list = new PagedList<Formation>((query) => this.api.formations(query), 9);

  constructor() {
    inject(SeoService).apply({ title: 'Formations', description: 'Formations et ateliers du Club Informatique de l’IST.', path: '/formations' });
  }
}

/**
 * Formation, détail (écran 11). La maquette montre un lecteur de leçons, hors périmètre du CDC :
 * la page présente la fiche de la formation et ses sessions, dans la même composition (panneau latéral et contenu).
 */
@Component({
  selector: 'app-formation-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, DataZone, Skeleton, InscriptionAction, FrDatePipe, FrNumberPipe],
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
      align-items: start;
    }
    .side {
      padding: 1.5rem;
      position: sticky;
      top: 100px;
    }
    .fact {
      padding: 0.6rem 0;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 0.88rem;
    }
    .fact:last-child {
      border-bottom: 0;
    }
    .fact strong {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .session {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border-subtle);
    }
    .session:last-child {
      border-bottom: 0;
    }
    @media (max-width: 1024px) {
      .layout {
        grid-template-columns: 1fr;
      }
      .side {
        position: static;
      }
    }
  `,
  template: `
    <div class="page-section">
      <div class="page-container">
        <a routerLink="/formations" class="back-link"><app-icon name="arrow-left" [size]="16" /> Retour aux formations</a>
        <app-data-zone [status]="formation.status()" emptyMessage="Cette formation n’est plus disponible." [errorMessage]="errorMessage()" (retry)="formation.load()">
          <div zone-skeleton class="layout">
            <app-skeleton height="260px" radius="var(--radius-lg)" />
            <app-skeleton height="420px" radius="var(--radius-lg)" />
          </div>
          @if (formation.data(); as item) {
            <div class="layout">
              <aside class="glass-panel side" aria-labelledby="titre-fiche">
                <h2 id="titre-fiche" class="flex items-center gap-2" style="font-size: 1rem; margin-bottom: 0.75rem">
                  <app-icon name="book-open" [size]="16" /> En bref
                </h2>
                <div class="fact"><strong>Niveau</strong>{{ niveaux[item.niveau] }}</div>
                @if (item.categorieNom) {
                  <div class="fact"><strong>Catégorie</strong>{{ item.categorieNom }}</div>
                }
                @if (item.formateurNom) {
                  <div class="fact"><strong>Formateur</strong>{{ item.formateurNom }}</div>
                }
                @if (item.prerequis) {
                  <div class="fact"><strong>Prérequis</strong><span style="white-space: pre-line">{{ item.prerequis }}</span></div>
                }
              </aside>

              <div>
                <article class="glass-panel" style="padding: clamp(1.25rem, 4vw, 2rem); margin-bottom: 2rem">
                  <h1 style="font-size: 1.8rem; margin-bottom: 1rem">{{ item.titre }}</h1>
                  <div class="prose" style="font-size: 1rem">
                    @for (block of blocks(); track $index) {
                      <p>{{ block.text }}</p>
                    }
                  </div>
                  @if (item.objectifs) {
                    <h2 style="font-size: 1.2rem; margin: 1.5rem 0 0.75rem">Objectifs</h2>
                    <p style="white-space: pre-line">{{ item.objectifs }}</p>
                  }
                </article>

                <section class="glass-panel" style="padding: clamp(1.25rem, 4vw, 2rem); margin-bottom: 2rem" aria-labelledby="titre-sessions">
                  <h2 id="titre-sessions" style="font-size: 1.2rem; margin-bottom: 0.5rem">Sessions</h2>
                  <app-data-zone [status]="sessions.status()" emptyMessage="Aucune session n’est planifiée pour le moment." emptyIcon="calendar" (retry)="sessions.load()">
                    <div zone-skeleton><app-skeleton height="4rem" /></div>
                    @for (session of sessions.data() ?? []; track session.id) {
                      <div class="session">
                        <div class="min-w-0">
                          <div style="font-weight: 600">{{ session.dateDebut | frDate: 'long' }}</div>
                          <div class="flex flex-wrap gap-x-4 gap-y-1" style="margin-top: 0.25rem">
                            <span class="meta-line"><app-icon name="clock" [size]="14" /> {{ time(session) }}</span>
                            @if (session.lieu) {
                              <span class="meta-line"><app-icon name="map-pin" [size]="14" /> {{ session.lieu }}</span>
                            }
                            @if (session.placesRestantes !== null && session.placesRestantes !== undefined && session.capaciteMax) {
                              <span class="meta-line">
                                <app-icon name="users" [size]="14" />
                                @if (session.placesRestantes <= 0) {
                                  Complet
                                } @else {
                                  Places disponibles : {{ session.placesRestantes | frNumber }} sur {{ session.capaciteMax | frNumber }}
                                }
                              </span>
                            }
                          </div>
                        </div>
                        <div class="flex items-center gap-3">
                          @if (session.statut !== 'PLANIFIEE') {
                            <app-badge variant="neutral">{{ sessionLabels[session.statut] }}</app-badge>
                          }
                          <app-inscription-action
                            [target]="{ kind: 'session', id: session.id }"
                            [full]="(session.placesRestantes ?? 1) <= 0 && !!session.capaciteMax"
                            [closed]="closed(session)"
                            size="sm"
                            (changed)="sessions.refresh()"
                          />
                        </div>
                      </div>
                    }
                  </app-data-zone>
                </section>
              </div>
            </div>
          }
        </app-data-zone>
      </div>
    </div>
  `,
})
export class FormationDetailPage {
  readonly slug = input.required<string>();

  private readonly api = inject(PublicApi);
  private readonly seo = inject(SeoService);
  protected readonly niveaux = NIVEAU_LABELS;
  protected readonly sessionLabels = SESSION_LABELS;

  protected readonly formation = new ResourceState<Formation>(() => this.api.formation(this.slug()));
  protected readonly sessions = new ResourceState<readonly SessionFormation[]>(() => {
    const formation = this.formation.data();
    return formation ? this.api.sessions(formation.id) : of([]);
  });
  protected readonly blocks = computed(() => toBlocks(this.formation.data()?.description));
  protected readonly errorMessage = computed(() =>
    this.formation.error()?.kind === 'not-found' ? 'Cette formation est introuvable ou n’est plus publiée.' : null,
  );

  constructor() {
    this.seo.apply({ title: 'Formation', path: '/formations' });
    const a = toObservable(this.slug).subscribe(() => this.formation.load());
    const b = toObservable(this.formation.data).subscribe((item) => {
      if (!item) return;
      this.seo.apply({ title: item.titre, description: item.description.slice(0, 160), path: `/formations/${item.slug}` });
      this.sessions.load();
    });
    inject(DestroyRef).onDestroy(() => {
      a.unsubscribe();
      b.unsubscribe();
      this.formation.destroy();
      this.sessions.destroy();
    });
  }

  protected time(session: SessionFormation): string {
    return formatTimeRange(session.dateDebut, session.dateFin);
  }

  protected closed(session: SessionFormation): boolean {
    return session.statut === 'ANNULEE' || session.statut === 'TERMINEE' || (parseApiDate(session.dateDebut)?.getTime() ?? 0) < Date.now();
  }
}

/** Ressources publiques (écran 12) : aucun compteur de téléchargements, la donnée n'existe pas. */
@Component({
  selector: 'app-ressources-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Badge, InputGroup, Pagination, DataZone, Skeleton],
  styles: `
    .tile {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(29, 78, 216, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-active);
      flex-shrink: 0;
    }
    .tile.t1 {
      background: rgba(251, 191, 36, 0.15);
      color: var(--accent-amber-text);
    }
    .tile.t2 {
      background: rgba(16, 185, 129, 0.15);
      color: var(--badge-success-text);
    }
  `,
  template: `
    <div class="page-section">
      <div class="page-container">
        <h1 class="page-title">Ressources <span class="accent">pédagogiques</span></h1>
        <p class="page-lead">Les ressources mises à disposition de tous par le Club Informatique de l’IST.</p>

        <div class="glass-panel filter-bar" role="search">
          <div class="filter-search">
            <label class="sr-only" for="recherche-ressources">Rechercher une ressource</label>
            <app-input-group icon="search">
              <input
                id="recherche-ressources"
                type="search"
                class="form-input"
                placeholder="Rechercher une ressource"
                [value]="list.search()"
                (input)="list.onSearch($any($event.target).value)"
              />
            </app-input-group>
          </div>
        </div>

        <app-data-zone
          [status]="list.status()"
          [emptyMessage]="list.filtered() ? 'Aucun résultat. Modifiez votre recherche.' : 'Aucune ressource publique n’est disponible pour le moment.'"
          emptyIcon="file-text"
          (retry)="list.reload()"
        >
          <div zone-skeleton class="card-grid">
            @for (i of placeholders; track i) {
              <app-skeleton height="200px" radius="var(--radius-lg)" />
            }
          </div>
          <div class="card-grid" aria-live="polite">
            @for (resource of list.items(); track resource.id; let i = $index) {
              <article class="glass-card flex flex-col">
                <div class="flex items-center gap-4" style="margin-bottom: 1rem">
                  <div class="tile" [class.t1]="i % 3 === 1" [class.t2]="i % 3 === 2" aria-hidden="true"><app-icon [name]="icon(resource)" [size]="24" /></div>
                  <div class="min-w-0">
                    <h2 style="font-size: 1rem">{{ resource.titre }}</h2>
                    <app-badge variant="neutral" style="font-size: 0.68rem; margin-top: 0.3rem">{{ labels[resource.type] }}</app-badge>
                  </div>
                </div>
                @if (resource.description) {
                  <p class="media-text line-clamp-3" style="margin-bottom: 1rem">{{ resource.description }}</p>
                }
                <div style="margin-top: auto">
                  <a class="btn btn-outline btn-sm" [href]="resource.urlFichier" target="_blank" rel="noopener noreferrer">
                    {{ resource.type === 'LIEN_EXTERNE' || resource.type === 'VIDEO' ? 'Consulter' : 'Télécharger' }}
                    <app-icon [name]="resource.type === 'LIEN_EXTERNE' || resource.type === 'VIDEO' ? 'external-link' : 'download'" [size]="14" />
                    <span class="sr-only">{{ resource.titre }} (nouvel onglet)</span>
                  </a>
                </div>
              </article>
            }
          </div>
          <div style="margin-top: 2rem">
            <app-pagination [page]="list.page()" [totalPages]="list.totalPages()" label="Pages des ressources" (pageChange)="list.goTo($event)" />
          </div>
        </app-data-zone>
      </div>
    </div>
  `,
})
export class RessourcesPage {
  private readonly api = inject(PublicApi);
  protected readonly placeholders = ['a', 'b', 'c'];
  protected readonly labels = TYPE_RESSOURCE_LABELS;
  protected readonly list = new PagedList<Ressource>((query) => this.api.ressourcesPubliques(query), 12);

  constructor() {
    inject(SeoService).apply({ title: 'Ressources', description: 'Ressources pédagogiques publiques du Club Informatique de l’IST.', path: '/ressources' });
  }

  protected icon(resource: Ressource): IconName {
    return resource.type === 'LIEN_EXTERNE' ? 'external-link' : resource.type === 'CODE_SOURCE' ? 'code' : resource.type === 'VIDEO' ? 'monitor' : 'file-text';
  }
}
