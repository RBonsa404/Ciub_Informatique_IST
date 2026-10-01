import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
import { MemberApi } from '../../core/api/member.api';
import { Devoir, Ressource, SupportsFormation, TYPE_RESSOURCE_LABELS } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
import { FeatureService } from '../../core/config/feature.service';
import { BreadcrumbService } from '../../core/navigation/breadcrumb.service';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, parseApiDate, safeUrl, toBlocks } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icon-names';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';

/** Entrée de la liste : un support de cours ou un devoir, rattaché à sa formation. */
export interface SupportItem {
  readonly kind: 'ressource' | 'devoir';
  readonly key: string;
  readonly titre: string;
  readonly description: string | null;
  readonly formationTitre: string;
  readonly label: string;
  readonly dateLimite: string | null;
  readonly link: readonly (string | number)[];
}

/** Devoirs d'abord (échéance la plus proche en tête), puis supports. */
export function toSupportItems(formations: readonly SupportsFormation[]): readonly SupportItem[] {
  const devoirs = formations.flatMap((f) =>
    f.devoirs.map(
      (d): SupportItem => ({
        kind: 'devoir',
        key: `devoir-${d.id}`,
        titre: d.titre,
        description: d.description ?? null,
        formationTitre: f.formationTitre,
        label: 'Devoir',
        dateLimite: d.dateLimite ?? null,
        link: ['/espace/supports/devoirs', f.formationId, d.id],
      }),
    ),
  );
  const ressources = formations.flatMap((f) =>
    f.ressources.map(
      (r): SupportItem => ({
        kind: 'ressource',
        key: `ressource-${r.id}`,
        titre: r.titre,
        description: r.description ?? null,
        formationTitre: f.formationTitre,
        label: TYPE_RESSOURCE_LABELS[r.type] ?? 'Support',
        dateLimite: null,
        link: ['/espace/supports/ressources', r.id],
      }),
    ),
  );
  const due = (item: SupportItem) => parseApiDate(item.dateLimite)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return [...devoirs.sort((a, b) => due(a) - due(b)), ...ressources];
}

const isPast = (value: string | null | undefined): boolean => {
  const time = parseApiDate(value)?.getTime();
  return time !== undefined && time < Date.now();
};

/** Supports et devoirs, liste (écran 29) : documents des formations auxquelles le membre est inscrit. */
@Component({
  selector: 'app-supports-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, DataZone, Skeleton, FrDatePipe],
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
      gap: 1.75rem;
    }
    .item {
      padding: 1.75rem;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
    }
    .item.devoir {
      border-left: 4px solid var(--color-amber-tech);
    }
    .item-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .item .btn {
      width: 100%;
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Supports et devoirs</h1>
        <p class="space-lead">Consultez les documents de cours et les devoirs des formations auxquelles vous êtes inscrit.</p>
      </div>
    </div>

    <app-data-zone
      [status]="state.status()"
      emptyMessage="Aucun support ni devoir n’est disponible pour vos formations."
      emptyIcon="book"
      (retry)="state.load()"
    >
      <div zone-skeleton class="grid">
        <app-skeleton height="220px" radius="20px" />
        <app-skeleton height="220px" radius="20px" />
        <app-skeleton height="220px" radius="20px" />
      </div>
      @if (catalogEnabled) {
        <a zone-empty class="btn btn-secondary btn-sm" routerLink="/formations">Découvrir les formations</a>
      }

      <ul class="grid">
        @for (item of state.data() ?? []; track item.key) {
          <li class="glass-panel item" [class.devoir]="item.kind === 'devoir'">
            <div class="item-head">
              <app-badge [variant]="item.kind === 'devoir' ? 'amber' : 'primary'">{{ item.label }}</app-badge>
              @if (item.dateLimite) {
                <span style="font-size: 0.78rem; font-weight: 700; color: var(--accent-amber-text)">
                  {{ past(item.dateLimite) ? 'Échéance dépassée :' : 'À rendre le' }} {{ item.dateLimite | frDate: 'court' }}
                </span>
              }
            </div>
            <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem">{{ item.titre }}</h2>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.5rem">{{ item.formationTitre }}</p>
            <p style="font-size: 0.85rem; line-height: 1.5; margin-bottom: 1.5rem; flex: 1">{{ item.description }}</p>
            <a class="btn btn-sm" [class]="item.kind === 'devoir' ? 'btn-amber' : 'btn-outline'" [routerLink]="item.link">
              {{ item.kind === 'devoir' ? 'Voir le devoir' : 'Consulter les détails' }}
              <span class="sr-only"> : {{ item.titre }}</span>
              <app-icon name="arrow-right" [size]="14" />
            </a>
          </li>
        }
      </ul>
    </app-data-zone>
  `,
})
export class SupportsListPage {
  private readonly api = inject(MemberApi);
  protected readonly catalogEnabled = inject(FeatureService).isEnabled('formations');
  protected readonly state = new ResourceState<readonly SupportItem[]>(() => this.api.supports().pipe(map(toSupportItems)));
  protected readonly past = isPast;

  constructor() {
    inject(SeoService).apply({ title: 'Supports et devoirs', noindex: true });
    this.state.load();
    inject(DestroyRef).onDestroy(() => this.state.destroy());
  }
}

interface SupportDetail {
  readonly kind: 'ressource' | 'devoir';
  readonly titre: string;
  readonly description: string | null;
  readonly typeLabel: string;
  readonly formationTitre: string | null;
  readonly auteurNom: string | null;
  readonly publieLe: string | null;
  readonly dateLimite: string | null;
  readonly url: string | null;
  readonly icon: IconName;
}

const fromRessource = (r: Ressource): SupportDetail => ({
  kind: 'ressource',
  titre: r.titre,
  description: r.description ?? null,
  typeLabel: TYPE_RESSOURCE_LABELS[r.type] ?? 'Support',
  formationTitre: r.formationTitre ?? null,
  auteurNom: r.auteurNom ?? null,
  publieLe: r.createdAt ?? null,
  dateLimite: null,
  url: safeUrl(r.urlFichier),
  icon: r.type === 'LIEN_EXTERNE' ? 'external-link' : r.type === 'CODE_SOURCE' ? 'code' : 'file-text',
});

const fromDevoir = (d: Devoir): SupportDetail => ({
  kind: 'devoir',
  titre: d.titre,
  description: d.description ?? null,
  typeLabel: 'Devoir',
  formationTitre: d.formationTitre ?? null,
  auteurNom: null,
  publieLe: d.createdAt ?? null,
  dateLimite: d.dateLimite ?? null,
  url: safeUrl(d.fichierConsigne),
  icon: 'clipboard',
});

/** Support ou devoir, détail (écran 30) : informations réelles, description et accès au fichier. Aucune remise en ligne. */
@Component({
  selector: 'app-support-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, DataZone, Skeleton, FrDatePipe],
  styles: `
    .stack {
      max-width: 1000px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .summary {
      padding: 2rem;
      border-radius: 20px;
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 2.5rem;
      align-items: center;
    }
    .tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(56, 189, 248, 0.08);
      border: 1.5px solid rgba(56, 189, 248, 0.25);
      border-radius: 18px;
      padding: 2rem 1.5rem;
      text-align: center;
    }
    .tile-icon {
      width: 70px;
      height: 70px;
      border-radius: 16px;
      background: rgba(56, 189, 248, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      color: var(--accent-active);
    }
    .facts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    .box {
      padding: 1.75rem;
      border-radius: 18px;
    }
    .box h2 {
      font-size: 1.05rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .box h2 app-icon {
      color: var(--accent-active);
    }
    .drop {
      border: 1.5px dashed var(--border-subtle);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }
    @media (max-width: 768px) {
      .summary,
      .pair {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      .summary {
        padding: 1.5rem;
      }
    }
    @media (max-width: 480px) {
      .facts {
        grid-template-columns: 1fr;
      }
    }
  `,
  template: `
    <div class="space-head" style="align-items: center">
      <h1 class="space-title" style="margin-bottom: 0; font-size: clamp(1.35rem, 3vw, 1.6rem)">{{ kind() === 'devoir' ? 'Détail du devoir' : 'Détail du support' }}</h1>
      <a class="btn btn-secondary btn-sm" routerLink="/espace/supports"><app-icon name="arrow-left" [size]="14" /> Retour</a>
    </div>

    <app-data-zone [status]="state.status()" emptyMessage="Ce document n’est plus disponible." [errorMessage]="errorMessage()" (retry)="state.load()">
      <div zone-skeleton class="stack">
        <app-skeleton height="220px" radius="20px" />
        <app-skeleton height="160px" radius="18px" />
      </div>

      @if (state.data(); as item) {
        <div class="stack">
          <div class="glass-panel summary">
            <div class="tile">
              <div class="tile-icon" aria-hidden="true"><app-icon [name]="item.icon" [size]="36" /></div>
              <app-badge [variant]="item.kind === 'devoir' ? 'amber' : 'primary'" style="padding: 0.3rem 0.8rem; font-weight: 700">{{ item.typeLabel }}</app-badge>
            </div>
            <div class="min-w-0">
              <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 1.25rem">{{ item.titre }}</h2>
              <dl class="facts">
                <div>
                  <dt class="info-label">Type</dt>
                  <dd class="info-value">{{ item.typeLabel }}</dd>
                </div>
                @if (item.formationTitre) {
                  <div>
                    <dt class="info-label">Formation</dt>
                    <dd class="info-value">{{ item.formationTitre }}</dd>
                  </div>
                }
                @if (item.kind === 'devoir') {
                  <div>
                    <dt class="info-label">Échéance</dt>
                    @if (item.dateLimite) {
                      <dd class="info-value">{{ item.dateLimite | frDate: 'long' }}, {{ item.dateLimite | frDate: 'heure' }}</dd>
                    } @else {
                      <dd class="info-value" style="color: var(--text-muted)">Non définie</dd>
                    }
                  </div>
                }
                @if (item.auteurNom) {
                  <div>
                    <dt class="info-label">Publié par</dt>
                    <dd class="info-value">{{ item.auteurNom }}</dd>
                  </div>
                }
                @if (item.publieLe) {
                  <div>
                    <dt class="info-label">Publié le</dt>
                    <dd class="info-value">{{ item.publieLe | frDate: 'long' }}</dd>
                  </div>
                }
              </dl>
            </div>
          </div>

          <div class="pair">
            <section class="glass-panel box" aria-labelledby="titre-description">
              <h2 id="titre-description"><app-icon name="file-text" [size]="18" /> Description</h2>
              @for (block of blocks(); track $index) {
                <p style="font-size: 0.88rem; margin-bottom: 0.75rem">{{ block.text }}</p>
              } @empty {
                <p style="font-size: 0.88rem; color: var(--text-muted); font-style: italic">Aucune description disponible pour le moment.</p>
              }
            </section>

            <section class="glass-panel box" aria-labelledby="titre-fichier">
              <h2 id="titre-fichier"><app-icon name="download" [size]="18" /> Téléchargement et consultation</h2>
              <div class="drop">
                @if (item.url; as url) {
                  <a class="btn btn-primary btn-sm" [href]="url" target="_blank" rel="noopener noreferrer">
                    <app-icon name="external-link" [size]="14" />
                    {{ item.kind === 'devoir' ? 'Ouvrir la consigne' : 'Ouvrir le support' }}
                    <span class="sr-only">(nouvel onglet)</span>
                  </a>
                } @else {
                  <strong style="display: block; font-size: 0.92rem; margin-bottom: 0.25rem">Aucun fichier disponible</strong>
                  <span style="font-size: 0.78rem; color: var(--text-muted)">
                    {{ item.kind === 'devoir' ? 'La consigne est décrite ci-contre.' : 'Aucun fichier n’est associé à ce support.' }}
                  </span>
                }
              </div>
            </section>
          </div>
        </div>
      }
    </app-data-zone>
  `,
})
export class SupportDetailPage {
  /** Donnée de route : nature du document. */
  readonly kind = input<'ressource' | 'devoir'>('ressource');
  readonly id = input<string>();
  readonly formationId = input<string>();
  readonly devoirId = input<string>();

  private readonly api = inject(MemberApi);
  private readonly breadcrumb = inject(BreadcrumbService);
  protected readonly state = new ResourceState<SupportDetail>(() => this.fetch());
  protected readonly blocks = computed(() => toBlocks(this.state.data()?.description));
  protected readonly errorMessage = computed(() => (this.state.error()?.kind === 'not-found' ? 'Ce document est introuvable ou n’est plus disponible.' : null));

  constructor() {
    const seo = inject(SeoService);
    seo.apply({ title: 'Supports et devoirs', noindex: true });
    const params = computed(() => `${this.kind()}/${this.id()}/${this.formationId()}/${this.devoirId()}`);
    const a = toObservable(params).subscribe(() => this.state.load());
    const b = toObservable(this.state.data).subscribe((item) => {
      if (!item) return;
      seo.apply({ title: item.titre, noindex: true });
      this.breadcrumb.set([{ label: 'Supports et devoirs', route: '/espace/supports' }, { label: item.titre }]);
    });
    inject(DestroyRef).onDestroy(() => {
      a.unsubscribe();
      b.unsubscribe();
      this.state.destroy();
    });
  }

  private fetch(): Observable<SupportDetail> {
    if (this.kind() === 'devoir') return this.api.devoir(Number(this.formationId()), Number(this.devoirId())).pipe(map(fromDevoir));
    return this.api.ressource(Number(this.id())).pipe(map(fromRessource));
  }
}
