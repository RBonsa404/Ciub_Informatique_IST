import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { Icon } from '../../shared/ui/icon/icon';
import { CONDITIONS_UTILISATION, LegalDocumentContent, MENTIONS_LEGALES, POLITIQUE_CONFIDENTIALITE } from './legal-content';

/** Mise en page des textes légaux (écrans 14 et 15) : sommaire collant et sections numérotées. */
@Component({
  selector: 'app-legal-document',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, Icon, FrDatePipe],
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 2.5rem;
      align-items: start;
    }
    .toc {
      padding: 1.5rem;
      position: sticky;
      top: 100px;
    }
    .toc ol {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.85rem;
    }
    .toc a {
      display: block;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-md);
      border-left: 3px solid transparent;
      color: var(--text-secondary);
    }
    .toc a.active,
    .toc a:hover {
      background: linear-gradient(90deg, rgba(29, 78, 216, 0.2), transparent);
      border-left-color: var(--accent-active);
      color: var(--accent-active);
      font-weight: 600;
    }
    .section {
      padding: 1.5rem;
      display: flex;
      gap: 1.25rem;
      align-items: flex-start;
      scroll-margin-top: 100px;
    }
    .number {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(29, 78, 216, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: var(--accent-active);
      font-size: 1.1rem;
      font-family: var(--font-heading);
    }
    .section:nth-child(3n) .number {
      background: rgba(251, 191, 36, 0.15);
      color: var(--accent-amber-text);
    }
    .section p,
    .section li {
      font-size: 0.92rem;
      line-height: 1.7;
      color: var(--text-secondary);
    }
    .section p + p,
    .section ul {
      margin-top: 0.6rem;
    }
    .section ul {
      list-style: disc;
      padding-left: 1.25rem;
    }
    .pending {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      padding: 0.6rem 0.8rem;
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--glass-bg-subtle);
    }
    @media (max-width: 1024px) {
      .layout {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      .toc {
        position: static;
      }
    }
    @media (max-width: 480px) {
      .section {
        flex-direction: column;
        gap: 0.75rem;
      }
    }
  `,
  template: `
    <div class="page-section">
      <div class="page-container layout">
        <nav class="glass-panel toc" aria-labelledby="titre-sommaire">
          <h2 id="titre-sommaire" class="flex items-center gap-2" style="font-size: 0.95rem; margin-bottom: 1.25rem">
            <app-icon name="file-text" [size]="16" /> Sommaire
          </h2>
          <ol>
            @for (section of content().sections; track section.id; let i = $index) {
              <li>
                <a [href]="path() + '#' + section.id" [class.active]="active() === section.id" (click)="go($event, section.id)">
                  {{ number(i) }}. {{ section.shortTitle ?? section.title }}
                </a>
              </li>
            }
          </ol>
        </nav>

        <div>
          <app-badge variant="primary" style="margin-bottom: 1rem">{{ content().badge }}</app-badge>
          <h1 style="font-size: clamp(1.8rem, 3.5vw, 2.5rem); margin-bottom: 0.5rem">
            {{ content().titleStart }} <span class="accent">{{ content().titleAccent }}</span>
          </h1>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 2.5rem">Dernière mise à jour : {{ content().updatedAt | frDate: 'long' }}</p>

          <div class="flex flex-col gap-6">
            @for (section of content().sections; track section.id; let i = $index) {
              <section class="glass-card glass-card-static section" [id]="section.id" [attr.aria-labelledby]="'titre-' + section.id" tabindex="-1">
                <div class="number" aria-hidden="true">{{ number(i) }}</div>
                <div class="min-w-0">
                  <h2 [id]="'titre-' + section.id" style="font-size: 1.1rem; margin-bottom: 0.5rem">{{ section.title }}</h2>
                  @for (paragraph of section.paragraphs; track $index) {
                    @if (paragraph.pending) {
                      <p class="pending"><app-icon name="info" [size]="16" /> <span>{{ paragraph.text }}</span></p>
                    } @else {
                      <p>{{ paragraph.text }}</p>
                    }
                  }
                  @if (section.items) {
                    <ul>
                      @for (item of section.items; track $index) {
                        <li>{{ item }}</li>
                      }
                    </ul>
                  }
                </div>
              </section>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LegalDocument {
  readonly content = input.required<LegalDocumentContent>();
  readonly path = input.required<string>();
  private readonly document = inject(DOCUMENT);
  private readonly selected = signal<string | null>(null);
  protected readonly active = computed(() => this.selected() ?? this.content().sections[0]?.id ?? null);

  /** Numéro de section sur deux chiffres : repère de structure, non une donnée. */
  protected number(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  protected go(event: Event, id: string): void {
    event.preventDefault();
    this.selected.set(id);
    const target = this.document.getElementById(id);
    target?.scrollIntoView({ block: 'start' });
    target?.focus({ preventScroll: true });
  }
}

@Component({
  selector: 'app-mentions-legales-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LegalDocument],
  template: `<app-legal-document [content]="content" path="/mentions-legales" />`,
})
export class MentionsLegalesPage {
  protected readonly content = MENTIONS_LEGALES;
  constructor() {
    inject(SeoService).apply({ title: 'Mentions légales', description: 'Mentions légales du site du Club Informatique de l’IST.', path: '/mentions-legales' });
  }
}

@Component({
  selector: 'app-confidentialite-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LegalDocument],
  template: `<app-legal-document [content]="content" path="/confidentialite" />`,
})
export class ConfidentialitePage {
  protected readonly content = POLITIQUE_CONFIDENTIALITE;
  constructor() {
    inject(SeoService).apply({
      title: 'Politique de confidentialité',
      description: 'Données collectées par le site du Club Informatique de l’IST, finalités, durées de conservation et droits des personnes.',
      path: '/confidentialite',
    });
  }
}

@Component({
  selector: 'app-conditions-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LegalDocument],
  template: `<app-legal-document [content]="content" path="/conditions-utilisation" />`,
})
export class ConditionsPage {
  protected readonly content = CONDITIONS_UTILISATION;
  constructor() {
    inject(SeoService).apply({
      title: 'Conditions d’utilisation',
      description: 'Conditions d’utilisation du site du Club Informatique de l’IST.',
      path: '/conditions-utilisation',
    });
  }
}
