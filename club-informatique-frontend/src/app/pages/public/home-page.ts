import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { PublicApi } from '../../core/api/public.api';
import { ResourceState } from '../../core/api/resource-state';
import { FeatureService } from '../../core/config/feature.service';
import { SITE } from '../../core/config/site';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, formatTimeRange, toBlocks } from '../../shared/format/format';
import { Button } from '../../shared/ui/button/button';
import { Badge } from '../../shared/ui/card/card';
import { Icon } from '../../shared/ui/icon/icon';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';

/**
 * Accueil (écran 01). Les sections « prochains événements » et « dernières actualités » ne s'affichent
 * que si le backend renvoie des éléments publiés ; sans donnée, elles sont masquées.
 */
@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon, Badge, DataZone, Skeleton, FrDatePipe],
  styles: `
    .hero {
      padding: 4rem 0 3rem;
      position: relative;
      overflow: hidden;
    }
    .hero h1 {
      font-size: clamp(2.5rem, 5vw, 3.5rem);
      line-height: 1.1;
      margin-bottom: 1rem;
    }
    .hero-ist {
      color: var(--color-blue-royal);
      font-weight: 800;
    }
    :host-context([data-theme='dark']) .hero-ist {
      color: #60a5fa;
    }
    .hero-text {
      font-size: 1rem;
      color: var(--text-muted);
      margin-bottom: 2rem;
      max-width: 500px;
      line-height: 1.7;
      white-space: pre-line;
    }
    .hero-cta {
      border-radius: 10px;
      padding: 0.85rem 1.8rem;
    }
    .hero-cta.primary {
      background: linear-gradient(90deg, #0055ff, #0088ff);
    }
    .hero-cta.secondary {
      border: 1.5px solid var(--border-strong);
    }
    .visual-wrap {
      position: relative;
      display: flex;
      justify-content: center;
    }
    .arc-amber {
      position: absolute;
      top: -20px;
      right: -30px;
      width: 350px;
      height: 350px;
      border: 3px solid var(--color-amber-tech);
      border-radius: 0 50% 50% 0;
      opacity: 0.5;
    }
    .arc-cyan {
      position: absolute;
      bottom: -30px;
      left: -20px;
      width: 250px;
      height: 250px;
      border: 2px solid var(--color-cyan-circuit);
      border-radius: 50%;
      opacity: 0.3;
    }
    .visual {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 500px;
      height: 340px;
      border-radius: 20px;
      overflow: hidden;
      border: 3px solid rgba(56, 189, 248, 0.2);
      box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.4),
        0 0 30px rgba(56, 189, 248, 0.15);
      background: linear-gradient(135deg, #0b1e3f 0%, #1d4ed8 50%, #0b1e3f 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .visual img {
      background: #fff;
      border-radius: 16px;
      padding: 4px;
      box-shadow: 0 0 25px rgba(56, 189, 248, 0.5);
      margin-bottom: 1rem;
    }
    .hero-rule {
      position: absolute;
      bottom: -15px;
      right: 10%;
      width: 60%;
      height: 4px;
      background: linear-gradient(90deg, transparent, var(--color-amber-tech), transparent);
      border-radius: 999px;
    }
    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .section-head h2 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.5rem;
    }
    .see-all {
      color: var(--accent-amber-text);
      font-weight: 600;
      font-size: 0.9rem;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      white-space: nowrap;
    }
    .events {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
      gap: 1.5rem;
    }
    .news {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
      gap: 1.25rem;
    }
    .news .media-visual {
      height: 140px;
    }
  `,
  template: `
    <section class="hero">
      <div class="page-container split">
        <div>
          <h1>Club Informatique<br />de l’<span class="hero-ist">IST</span></h1>
          <app-data-zone [status]="intro.status()" emptyMessage="" [hideWhenEmpty]="true">
            <div zone-skeleton style="max-width: 500px; margin-bottom: 2rem">
              <app-skeleton height="1rem" />
              <div style="margin-top: 0.6rem"><app-skeleton width="85%" height="1rem" /></div>
              <div style="margin-top: 0.6rem"><app-skeleton width="60%" height="1rem" /></div>
            </div>
            @if (intro.data(); as text) {
              <p class="hero-text">{{ text }}</p>
            }
          </app-data-zone>
          <div class="flex flex-wrap gap-4">
            <a appBtn size="lg" routerLink="/presentation" class="hero-cta primary">Découvrir le club <app-icon name="arrow-right" [size]="18" /></a>
            @if (authEnabled) {
              <a appBtn variant="secondary" size="lg" routerLink="/inscription" class="hero-cta secondary">
                <app-icon name="user-plus" [size]="16" /> Rejoindre le club
              </a>
            }
          </div>
        </div>

        <div class="visual-wrap split-decor" aria-hidden="true">
          <div class="arc-amber"></div>
          <div class="arc-cyan"></div>
          <div class="visual">
            <img src="img/logo-176.webp" alt="" width="80" height="80" />
            <div class="font-heading" style="font-size: 1.3rem; font-weight: 800">{{ site.shortName }}</div>
            <svg style="position: absolute; bottom: 0; left: 0; width: 100%; height: 60px; opacity: 0.3" viewBox="0 0 500 60">
              <line x1="0" y1="30" x2="150" y2="30" stroke="#38BDF8" stroke-width="1.5" />
              <circle cx="150" cy="30" r="4" fill="#38BDF8" />
              <line x1="154" y1="30" x2="300" y2="15" stroke="#FBBF24" stroke-width="1.5" />
              <circle cx="300" cy="15" r="3" fill="#FBBF24" />
              <line x1="303" y1="15" x2="500" y2="45" stroke="#38BDF8" stroke-width="1" />
            </svg>
          </div>
          <div class="hero-rule"></div>
        </div>
      </div>
    </section>

    @if (eventsEnabled && events.status() !== 'empty' && events.status() !== 'error') {
      <section class="page-section" aria-labelledby="titre-evenements">
        <div class="page-container">
          <div class="section-head">
            <h2 id="titre-evenements"><app-icon name="calendar" [size]="22" /> Prochains événements</h2>
            <a routerLink="/evenements" class="see-all">Voir tout <app-icon name="arrow-right" [size]="14" /></a>
          </div>
          <app-data-zone [status]="events.status()" emptyMessage="" [hideWhenEmpty]="true">
            <div zone-skeleton class="events">
              <app-skeleton height="150px" radius="var(--radius-lg)" />
              <app-skeleton height="150px" radius="var(--radius-lg)" />
            </div>
            <div class="events">
              @for (event of events.data() ?? []; track event.id; let odd = $odd) {
                <article class="glass-card date-card" [class.alt]="odd">
                  <div class="date-chip" aria-hidden="true">
                    <span class="date-chip-day">{{ event.dateDebut | frDate: 'jour' }}</span>
                    <span class="date-chip-month">{{ event.dateDebut | frDate: 'mois' }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3 style="font-size: 1.05rem; margin-bottom: 0.4rem">
                      <a class="media-title-link" [routerLink]="['/evenements', event.slug]">{{ event.titre }}</a>
                    </h3>
                    <div class="flex flex-col gap-1" style="margin-bottom: 0.6rem">
                      <span class="meta-line"><span class="sr-only">Date :</span> {{ event.dateDebut | frDate: 'long' }}</span>
                      <span class="meta-line"><app-icon name="clock" [size]="14" /> {{ time(event.dateDebut, event.dateFin) }}</span>
                      <span class="meta-line"><app-icon name="map-pin" [size]="14" /> {{ event.lieu }}</span>
                    </div>
                    @if (event.categorieNom) {
                      <app-badge [variant]="odd ? 'amber' : 'primary'" style="font-size: 0.72rem">{{ event.categorieNom }}</app-badge>
                    }
                  </div>
                </article>
              }
            </div>
          </app-data-zone>
        </div>
      </section>
    }

    @if (newsEnabled && news.status() !== 'empty' && news.status() !== 'error') {
      <section class="page-section" aria-labelledby="titre-actualites">
        <div class="page-container">
          <div class="section-head">
            <h2 id="titre-actualites"><app-icon name="newspaper" [size]="22" /> Nos dernières actualités</h2>
            <a routerLink="/actualites" class="see-all">Voir tout <app-icon name="arrow-right" [size]="14" /></a>
          </div>
          <app-data-zone [status]="news.status()" emptyMessage="" [hideWhenEmpty]="true">
            <div zone-skeleton class="news">
              @for (i of placeholders; track i) {
                <app-skeleton height="260px" radius="var(--radius-lg)" />
              }
            </div>
            <div class="news">
              @for (item of news.data() ?? []; track item.id; let i = $index) {
                <article class="glass-card media-card">
                  <div class="media-visual" [class.v2]="i % 3 === 1" [class.v3]="i % 3 === 2">
                    @if (item.image) {
                      <img [src]="item.image" alt="" loading="lazy" />
                    } @else {
                      <app-icon name="newspaper" [size]="40" [strokeWidth]="1.5" />
                    }
                  </div>
                  <div class="media-body" style="padding: 1rem">
                    <h3 class="media-title" style="font-size: 0.95rem; line-height: 1.3">
                      <a [routerLink]="['/actualites', item.slug]">{{ item.titre }}</a>
                    </h3>
                    <span class="meta-line" style="font-size: 0.78rem">
                      <app-icon name="calendar" [size]="13" /> {{ item.datePublication ?? item.createdAt | frDate: 'court' }}
                    </span>
                    @if (item.categorieNom) {
                      <div style="margin-top: 0.75rem"><app-badge variant="primary" style="font-size: 0.68rem">{{ item.categorieNom }}</app-badge></div>
                    }
                  </div>
                </article>
              }
            </div>
          </app-data-zone>
        </div>
      </section>
    }
  `,
})
export class HomePage {
  private readonly api = inject(PublicApi);
  private readonly features = inject(FeatureService);
  protected readonly site = SITE;
  protected readonly authEnabled = this.features.isEnabled('authentification');
  protected readonly eventsEnabled = this.features.isEnabled('evenements');
  protected readonly newsEnabled = this.features.isEnabled('actualites');
  protected readonly placeholders = ['a', 'b', 'c', 'd'];

  /** Texte d'introduction géré par l'administration (page d'information « accueil »). */
  protected readonly intro = new ResourceState<string>(
    () =>
      this.api.pageInfo('accueil').pipe(
        map((page) =>
          toBlocks(page.contenu)
            .filter((block) => block.kind === 'paragraph')
            .map((block) => block.text)
            .join('\n\n'),
        ),
        catchError(() => of('')),
      ),
    (text) => text === '',
  );
  protected readonly events = new ResourceState(() => this.api.evenements({ aVenir: true, size: 2, sort: 'dateDebut,asc' }).pipe(map((page) => page.content)));
  protected readonly news = new ResourceState(() => this.api.actualites({ size: 4 }).pipe(map((page) => page.content)));
  protected readonly hasContent = computed(() => this.events.status() === 'ready' || this.news.status() === 'ready');

  constructor() {
    const seo = inject(SeoService);
    seo.apply({
      title: 'Accueil',
      fullTitle: 'Club Informatique de l’IST | Formations, projets et événements à Ouagadougou',
      description: 'Le club des étudiants de l’Institut Supérieur de Technologie qui pratiquent l’informatique : formations, ateliers, projets en équipe et événements.',
      path: '/',
    });
    seo.setOrganizationJsonLd();
    this.intro.load();
    if (this.eventsEnabled) this.events.load();
    if (this.newsEnabled) this.news.load();
    inject(DestroyRef).onDestroy(() => {
      this.intro.destroy();
      this.events.destroy();
      this.news.destroy();
    });
  }

  protected time(start: string, end: string): string {
    return formatTimeRange(start, end);
  }
}
