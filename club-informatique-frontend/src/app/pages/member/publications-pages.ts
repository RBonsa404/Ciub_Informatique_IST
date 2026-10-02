import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MemberApi } from '../../core/api/member.api';
import { Actualite } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
import { BreadcrumbService } from '../../core/navigation/breadcrumb.service';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, initialsOf, toBlocks } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { Icon } from '../../shared/ui/icon/icon';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone, PagedList } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';

const AUTHOR_STYLES = `
  .author {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    min-width: 0;
  }
  .avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-blue-royal), var(--color-cyan-circuit));
    color: #fff;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
`;

const PAGE_SIZE = 8;

/**
 * Publications réservées aux membres (écran 23, décision D-01) : annonces internes en lecture seule,
 * sans réactions ni commentaires.
 */
@Component({
  selector: 'app-publications-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, Pagination, DataZone, Skeleton, FrDatePipe],
  styles: `
    ${AUTHOR_STYLES}
    .feed {
      max-width: 800px;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    .post {
      padding: 1.75rem;
      border-radius: 20px;
    }
    .summary {
      font-size: 0.92rem;
      line-height: 1.6;
      margin-bottom: 1.25rem;
      white-space: pre-line;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    @media (max-width: 600px) {
      .post {
        padding: 1.25rem;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Publications du club</h1>
        <p class="space-lead">Les annonces du bureau réservées aux membres.</p>
      </div>
    </div>

    <app-data-zone [status]="list.status()" emptyMessage="Aucune publication n’est disponible pour le moment." emptyIcon="rss" (retry)="list.reload()">
      <div zone-skeleton class="feed">
        <app-skeleton height="200px" radius="20px" />
        <app-skeleton height="200px" radius="20px" />
      </div>

      <div class="feed">
        @for (post of list.items(); track post.id; let odd = $odd) {
          <article class="glass-panel post">
            <div class="flex flex-wrap items-center justify-between gap-3" style="margin-bottom: 1.25rem">
              <div class="author">
                <div class="avatar" aria-hidden="true">{{ initials(post) }}</div>
                <div class="min-w-0">
                  <strong style="display: block; font-size: 0.95rem">{{ post.auteurNom ?? 'Club Informatique de l’IST' }}</strong>
                  <span style="font-size: 0.78rem; color: var(--text-muted)">{{ post.datePublication ?? post.createdAt | frDate: 'long' }}</span>
                </div>
              </div>
              @if (post.categorieNom) {
                <app-badge [variant]="odd ? 'amber' : 'primary'">{{ post.categorieNom }}</app-badge>
              }
            </div>
            <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.6rem">{{ post.titre }}</h2>
            <p class="summary">{{ post.resume || post.contenu }}</p>
            <div class="flex justify-end">
              <a class="btn btn-outline btn-sm" [routerLink]="['/espace/publications', post.slug]">
                Lire la suite<span class="sr-only"> : {{ post.titre }}</span> <app-icon name="arrow-right" [size]="14" />
              </a>
            </div>
          </article>
        }
        <app-pagination [page]="list.page()" [totalPages]="list.totalPages()" label="Pages des publications" (pageChange)="list.goTo($event)" />
      </div>
    </app-data-zone>
  `,
})
export class PublicationsListPage {
  private readonly api = inject(MemberApi);
  protected readonly list = new PagedList<Actualite>((query) => this.api.publications({ page: query.page, size: query.size }), PAGE_SIZE);

  constructor() {
    inject(SeoService).apply({ title: 'Publications du club', noindex: true });
  }

  protected initials(post: Actualite): string {
    return initialsOf(post.auteurNom) || 'CI';
  }
}

/** Publication, détail (écran 24) : texte de l'annonce, sans commentaires ni partage. */
@Component({
  selector: 'app-publication-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, DataZone, Skeleton, FrDatePipe],
  styles: `
    ${AUTHOR_STYLES}
    .post {
      max-width: 800px;
      padding: 2.5rem;
      border-radius: 24px;
    }
    .avatar {
      width: 48px;
      height: 48px;
    }
    @media (max-width: 600px) {
      .post {
        padding: 1.5rem;
      }
    }
  `,
  template: `
    <a routerLink="/espace/publications" class="back-link"><app-icon name="arrow-left" [size]="16" /> Retour aux publications</a>

    <app-data-zone [status]="post.status()" emptyMessage="Cette publication n’est plus disponible." [errorMessage]="errorMessage()" (retry)="post.load()">
      <div zone-skeleton style="max-width: 800px">
        <app-skeleton height="360px" radius="24px" />
      </div>

      @if (post.data(); as item) {
        <article class="glass-panel post">
          <div class="flex flex-wrap items-center justify-between gap-3" style="margin-bottom: 1.5rem">
            <div class="author">
              <div class="avatar" aria-hidden="true">{{ initials() }}</div>
              <div class="min-w-0">
                <strong style="display: block">{{ item.auteurNom ?? 'Club Informatique de l’IST' }}</strong>
                <span style="font-size: 0.8rem; color: var(--text-muted)">{{ item.datePublication ?? item.createdAt | frDate: 'long' }}</span>
              </div>
            </div>
            @if (item.categorieNom) {
              <app-badge variant="primary">{{ item.categorieNom }}</app-badge>
            }
          </div>
          <h1 style="font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 800; margin-bottom: 1.25rem">{{ item.titre }}</h1>
          <div class="prose">
            @for (block of blocks(); track $index) {
              @switch (block.kind) {
                @case ('heading') {
                  <h2 style="font-size: 1.2rem; margin: 1.5rem 0 0.5rem">{{ block.text }}</h2>
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
  `,
})
export class PublicationDetailPage {
  readonly slug = input.required<string>();

  private readonly api = inject(MemberApi);
  private readonly breadcrumb = inject(BreadcrumbService);
  protected readonly post = new ResourceState<Actualite>(() => this.api.publication(this.slug()));
  protected readonly blocks = computed(() => toBlocks(this.post.data()?.contenu));
  protected readonly initials = computed(() => initialsOf(this.post.data()?.auteurNom) || 'CI');
  protected readonly errorMessage = computed(() => (this.post.error()?.kind === 'not-found' ? 'Cette publication est introuvable ou n’est plus publiée.' : null));

  constructor() {
    const seo = inject(SeoService);
    seo.apply({ title: 'Publication', noindex: true });
    const a = toObservable(this.slug).subscribe(() => this.post.load());
    const b = toObservable(this.post.data).subscribe((item) => {
      if (!item) return;
      seo.apply({ title: item.titre, noindex: true });
      this.breadcrumb.set([{ label: 'Publications', route: '/espace/publications' }, { label: item.titre }]);
    });
    inject(DestroyRef).onDestroy(() => {
      a.unsubscribe();
      b.unsubscribe();
      this.post.destroy();
    });
  }
}
