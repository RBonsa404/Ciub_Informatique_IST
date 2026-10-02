import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { map } from 'rxjs';
import { MembreBureau } from '../../core/api/models';
import { PublicApi } from '../../core/api/public.api';
import { ResourceState } from '../../core/api/resource-state';
import { FeatureService } from '../../core/config/feature.service';
import { SITE } from '../../core/config/site';
import { SeoService } from '../../core/seo/seo.service';
import { BrandIcon, Icon } from '../../shared/ui/icon/icon';
import { BrandName, IconName } from '../../shared/ui/icon/icon-names';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { RouterLink } from '@angular/router';

interface Section {
  readonly title: string;
  readonly paragraphs: readonly string[];
}

interface PresentationContent {
  readonly intro: readonly string[];
  readonly sections: readonly Section[];
}

/**
 * Découpe le contenu géré par l'administration : le texte placé avant le premier titre forme
 * l'introduction ; chaque titre (ligne commençant par « # ») ouvre une carte.
 */
export function parsePresentation(contenu: string): PresentationContent {
  const intro: string[] = [];
  const sections: { title: string; paragraphs: string[] }[] = [];
  for (const chunk of contenu.replace(/\\n/g, '\n').split(/\n{2,}/)) {
    const text = chunk.trim();
    if (!text) continue;
    const heading = text.match(/^#{1,6}\s+(.*)$/);
    if (heading) sections.push({ title: heading[1].trim(), paragraphs: [] });
    else if (sections.length === 0) intro.push(text);
    else sections[sections.length - 1].paragraphs.push(text);
  }
  // Un titre sans texte en tête de page n'apporte rien : son éventuel texte suivant devient l'introduction.
  if (intro.length === 0 && sections.length === 1) return { intro: sections[0].paragraphs, sections: [] };
  return { intro, sections: sections.filter((section) => section.paragraphs.length > 0) };
}

const SECTION_ICONS: readonly IconName[] = ['target', 'layers', 'shield'];
const SOCIAL: readonly { name: BrandName; label: string; href: string }[] = [
  { name: 'whatsapp', label: 'WhatsApp', href: SITE.whatsapp.href },
  { name: 'linkedin', label: 'LinkedIn', href: SITE.social.linkedin },
  { name: 'facebook', label: 'Facebook', href: SITE.social.facebook },
  { name: 'tiktok', label: 'TikTok', href: SITE.social.tiktok },
];

/** Présentation du club (écran 02). Le texte provient du contenu éditable par l'administration. */
@Component({
  selector: 'app-presentation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, BrandIcon, DataZone, Skeleton],
  styles: `
    .hero {
      padding: 4rem 0 3rem;
    }
    .hero h1 {
      font-size: clamp(2.5rem, 5vw, 3.5rem);
      line-height: 1.08;
      margin-bottom: 1.5rem;
    }
    .intro {
      font-size: 1.05rem;
      line-height: 1.75;
      margin-bottom: 1rem;
      max-width: 520px;
      white-space: pre-line;
    }
    .visual {
      width: 100%;
      height: 340px;
      border-radius: 20px;
      border: 2px solid rgba(56, 189, 248, 0.2);
      box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.4),
        0 0 25px rgba(56, 189, 248, 0.1);
      background: linear-gradient(135deg, #0b1e3f, #1d4ed8 60%, #0b1e3f);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .visual img {
      background: #fff;
      border-radius: 20px;
      padding: 5px;
      box-shadow: 0 0 30px rgba(56, 189, 248, 0.5);
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
      gap: 1.5rem;
    }
    .cards .glass-card {
      border-top: 3px solid var(--color-blue-royal);
    }
    .cards .glass-card:nth-child(3n + 2) {
      border-top-color: var(--color-amber-tech);
    }
    .cards .glass-card:nth-child(3n) {
      border-top-color: var(--color-cyan-circuit);
    }
    .cards h2 {
      font-size: 1.1rem;
      color: var(--accent-active);
    }
    .cards p {
      font-size: 0.92rem;
      line-height: 1.65;
      white-space: pre-line;
    }
    .strip {
      padding: 2rem 0;
      border-top: 1px solid var(--border-subtle);
    }
    .round {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
  `,
  template: `
    <section class="hero">
      <div class="page-container split">
        <div>
          <div class="pill" style="margin-bottom: 1.25rem">Présentation</div>
          <h1>Qui sommes-<span class="accent">nous</span></h1>
          <app-data-zone
            style="display: block; min-height: 4.4rem"
            [status]="page.status()"
            emptyMessage="Le contenu de cette page est en cours de mise à jour."
            emptyIcon="file-text"
            (retry)="page.load()"
          >
            <div zone-skeleton style="max-width: 520px">
              <app-skeleton height="1rem" />
              <div style="margin-top: 0.7rem"><app-skeleton height="1rem" /></div>
              <div style="margin-top: 0.7rem"><app-skeleton width="70%" height="1rem" /></div>
            </div>
            @for (paragraph of content()?.intro ?? []; track $index) {
              <p class="intro">{{ paragraph }}</p>
            }
          </app-data-zone>
          @if (bureauEnabled) {
            <a routerLink="/bureau" class="inline-flex items-center gap-2 font-bold accent-small" style="margin-top: 0.5rem">
              <app-icon name="arrow-right" [size]="18" /> Découvrir le bureau du club
            </a>
          }
        </div>
        <div class="split-decor" style="position: relative" aria-hidden="true">
          <div class="visual">
            <img src="img/logo-176.webp" alt="" width="90" height="90" />
            <svg style="position: absolute; top: 0; right: 0; width: 200px; height: 200px; opacity: 0.2" viewBox="0 0 200 200">
              <line x1="0" y1="50" x2="100" y2="50" stroke="#38BDF8" stroke-width="1.5" />
              <circle cx="100" cy="50" r="4" fill="#38BDF8" />
              <line x1="104" y1="50" x2="150" y2="100" stroke="#FBBF24" stroke-width="1.5" />
              <line x1="50" y1="0" x2="50" y2="80" stroke="#38BDF8" stroke-width="1" />
              <circle cx="50" cy="80" r="3" fill="#FBBF24" />
            </svg>
          </div>
        </div>
      </div>
    </section>

    @if (page.status() === 'loading') {
      <!-- Place des sections réservée pendant le chargement : la suite de la page ne se déplace pas à leur arrivée. -->
      <section style="padding: 3rem 0 4rem" aria-hidden="true">
        <div class="page-container cards">
          <app-skeleton height="9rem" radius="var(--radius-lg)" />
          <app-skeleton height="9rem" radius="var(--radius-lg)" />
          <app-skeleton height="9rem" radius="var(--radius-lg)" />
        </div>
      </section>
    }
    @if ((content()?.sections ?? []).length > 0) {
      <section style="padding: 3rem 0 4rem">
        <div class="page-container cards">
          @for (section of content()!.sections; track section.title; let i = $index) {
            <article class="glass-card">
              <div class="flex items-center gap-3" style="margin-bottom: 1rem">
                <div class="icon-disc" [class.amber]="i % 3 === 1"><app-icon [name]="icons[i % icons.length]" [size]="20" /></div>
                <h2>{{ section.title }}</h2>
              </div>
              @for (paragraph of section.paragraphs; track $index) {
                <p>{{ paragraph }}</p>
              }
            </article>
          }
        </div>
      </section>
    }

    <section class="strip">
      <div class="page-container flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <app-icon name="map-pin" class="accent-small" />
          <div>
            <div style="font-weight: 700; font-size: 0.95rem">{{ site.institution }}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted)">{{ site.city }}, {{ site.country }}</div>
          </div>
        </div>
        <div class="flex gap-[0.85rem]">
          @for (link of social; track link.name) {
            <a class="btn btn-secondary btn-icon round" [href]="link.href" target="_blank" rel="noopener noreferrer" [attr.aria-label]="link.label + ' (nouvel onglet)'">
              <app-brand-icon [name]="link.name" [size]="16" />
            </a>
          }
        </div>
      </div>
    </section>
  `,
})
export class PresentationPage {
  private readonly api = inject(PublicApi);
  protected readonly site = SITE;
  protected readonly social = SOCIAL;
  protected readonly icons = SECTION_ICONS;
  protected readonly bureauEnabled = inject(FeatureService).isEnabled('bureau');

  protected readonly page = new ResourceState<PresentationContent>(
    () => this.api.pageInfo('presentation').pipe(map((info) => parsePresentation(info.contenu))),
    (content) => content.intro.length === 0 && content.sections.length === 0,
  );
  protected readonly content = computed(() => this.page.data());

  constructor() {
    inject(SeoService).apply({
      title: 'Présentation',
      description: 'Présentation du Club Informatique de l’Institut Supérieur de Technologie de Ouagadougou.',
      path: '/presentation',
    });
    this.page.load();
    inject(DestroyRef).onDestroy(() => this.page.destroy());
  }
}

/** Bureau du club (écran 03). Avatars neutres : aucune photo. */
@Component({
  selector: 'app-bureau-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, DataZone, Skeleton],
  styles: `
    .rule {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2.5rem;
    }
    .rule-disc {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(29, 78, 216, 0.25);
      border: 2px solid var(--color-blue-royal);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-active);
    }
    .rule-line {
      flex: 1;
      max-width: 160px;
      height: 3px;
      background: linear-gradient(90deg, var(--color-blue-royal), var(--color-amber-tech));
      border-radius: 999px;
    }
    .head {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 320px));
      justify-content: center;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    .others {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
      gap: 2rem;
    }
    .member {
      text-align: center;
      padding: 2rem 1.5rem;
      border-bottom: 4px solid var(--color-blue-royal);
    }
    .role {
      display: inline-flex;
      align-items: center;
      background: var(--color-blue-royal);
      color: #fff;
      border-radius: 999px;
      padding: 0.3rem 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
    }
    .member.tone-1 {
      border-bottom-color: var(--color-amber-tech);
    }
    .member.tone-1 .role {
      background: var(--color-amber-tech);
      color: #0f172a;
    }
    .member.tone-2 {
      border-bottom-color: var(--color-success);
    }
    .member.tone-2 .role {
      background: #047857;
    }
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--bg-surface-hover);
      border: 3px solid var(--border-subtle);
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }
    .head .avatar {
      width: 90px;
      height: 90px;
    }
    .member h2 {
      font-size: 1.1rem;
      margin-bottom: 0.25rem;
    }
    .member p {
      font-size: 0.85rem;
      color: var(--accent-active);
    }
  `,
  template: `
    <div class="page-section">
      <div class="page-container">
        <h1 style="font-size: clamp(2.2rem, 4.5vw, 3rem); margin-bottom: 1rem">Bureau <span class="accent">du club</span></h1>
        <p class="page-lead" style="margin-bottom: 3rem">L’équipe qui dirige et anime le Club Informatique de l’IST.</p>

        <div class="rule" aria-hidden="true">
          <div class="rule-disc"><app-icon name="users" /></div>
          <div class="rule-line"></div>
        </div>

        <app-data-zone
          [status]="bureau.status()"
          emptyMessage="Les membres du bureau ne sont pas encore renseignés."
          emptyIcon="users"
          (retry)="bureau.load()"
        >
          <div zone-skeleton class="others">
            @for (i of placeholders; track i) {
              <app-skeleton height="240px" radius="var(--radius-lg)" />
            }
          </div>
          @if (bureau.data(); as members) {
            <div class="head">
              @for (member of members.slice(0, 2); track member.id; let i = $index) {
                <article class="glass-card member" [class]="'tone-' + (i % 3)">
                  <div class="role">{{ member.fonction }}</div>
                  <div class="avatar" aria-hidden="true"><app-icon name="user" [size]="40" [strokeWidth]="1.5" /></div>
                  <h2>{{ member.prenom }} {{ member.nom }}</h2>
                  @if (member.filiere) {
                    <p>{{ member.filiere }}</p>
                  }
                </article>
              }
            </div>
            <div class="others">
              @for (member of members.slice(2); track member.id; let i = $index) {
                <article class="glass-card member" [class]="'tone-' + ((i + 2) % 3)">
                  <div class="role">{{ member.fonction }}</div>
                  <div class="avatar" aria-hidden="true"><app-icon name="user" [size]="36" [strokeWidth]="1.5" /></div>
                  <h2>{{ member.prenom }} {{ member.nom }}</h2>
                  @if (member.filiere) {
                    <p>{{ member.filiere }}</p>
                  }
                </article>
              }
            </div>
          }
        </app-data-zone>
      </div>
    </div>
  `,
})
export class BureauPage {
  private readonly api = inject(PublicApi);
  protected readonly placeholders = ['a', 'b', 'c'];
  protected readonly bureau = new ResourceState<readonly MembreBureau[]>(() =>
    this.api.bureau().pipe(map((members) => [...members].sort((a, b) => a.ordre - b.ordre))),
  );

  constructor() {
    inject(SeoService).apply({ title: 'Bureau du club', description: 'Composition du bureau du Club Informatique de l’IST.', path: '/bureau' });
    this.bureau.load();
    inject(DestroyRef).onDestroy(() => this.bureau.destroy());
  }
}
