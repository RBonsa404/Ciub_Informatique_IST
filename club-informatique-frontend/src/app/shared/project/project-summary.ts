import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Projet, STATUT_PROJET_LABELS, StatutProjet } from '../../core/api/models';
import { initialsOf, safeUrl, toBlocks } from '../format/format';
import { BadgeVariant, Badge } from '../ui/card/card';
import { Icon } from '../ui/icon/icon';

export const PROJECT_BADGES: Record<StatutProjet, BadgeVariant> = { PROPOSE: 'amber', VALIDE: 'primary', EN_COURS: 'primary', TERMINE: 'success', REJETE: 'danger' };

/** Avancement borné entre 0 et 100 ; null si le serveur ne le fournit pas. */
export function progressValue(projet: Projet): number | null {
  const value = projet.avancementPourcentage;
  return value === null || value === undefined ? null : Math.min(100, Math.max(0, Math.round(value)));
}

interface Participant {
  readonly initials: string;
  readonly label: string;
}

/** Fiche d'un projet pour les espaces de gestion : statut, description, objectifs, technologies, équipe et liens réels. */
@Component({
  selector: 'app-project-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, Icon],
  host: { class: 'glass-panel', style: 'display:block; padding: 2rem; border-radius: 24px' },
  styles: `
    .label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 0.6rem;
    }
    .block {
      margin-top: 1.5rem;
    }
    .people {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .person {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-blue-royal), var(--color-cyan-circuit));
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .link {
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      font-size: 0.85rem;
    }
    @media (max-width: 600px) {
      :host {
        padding: 1.25rem !important;
      }
    }
  `,
  template: `
    @let item = projet();
    <div class="flex flex-wrap items-center justify-between gap-3" style="margin-bottom: 1rem">
      <h2 style="font-size: 1.4rem; font-weight: 800">{{ item.titre }}</h2>
      <app-badge [variant]="badges[item.statut]">{{ labels[item.statut] }}</app-badge>
    </div>
    @if (item.categorieNom) {
      <p class="accent-cyan" style="font-size: 0.88rem; font-weight: 600; margin-bottom: 0.75rem">{{ item.categorieNom }}</p>
    }
    @for (block of blocks(); track $index) {
      <p style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 0.75rem">{{ block.text }}</p>
    }

    @if (item.objectifs) {
      <div class="block">
        <span class="label">Objectifs</span>
        <p style="font-size: 0.9rem; white-space: pre-line">{{ item.objectifs }}</p>
      </div>
    }
    @if (technologies().length > 0) {
      <div class="block">
        <span class="label">Technologies</span>
        <div class="flex flex-wrap gap-2">
          @for (technology of technologies(); track technology) {
            <app-badge variant="neutral">{{ technology }}</app-badge>
          }
        </div>
      </div>
    }

    <div class="block">
      <span class="label">Participants</span>
      <div class="people">
        @for (person of participants(); track $index) {
          <span class="person" aria-hidden="true">{{ person.initials }}</span>
        }
        <span style="font-size: 0.85rem; margin-left: 0.5rem">{{ participantsText() }}</span>
      </div>
    </div>

    @if (links().length > 0) {
      <div class="block">
        <span class="label">Liens du projet</span>
        <div class="flex flex-col gap-2">
          @for (link of links(); track link.href) {
            <div class="glass-card glass-card-static link">
              <span class="min-w-0" style="overflow-wrap: anywhere">{{ link.label }}</span>
              <a class="btn btn-secondary btn-sm" [href]="link.href" target="_blank" rel="noopener noreferrer">
                <app-icon name="external-link" [size]="14" /> Ouvrir<span class="sr-only"> {{ link.label }} (nouvel onglet)</span>
              </a>
            </div>
          }
        </div>
      </div>
    }
    <ng-content />
  `,
})
export class ProjectSummary {
  readonly projet = input.required<Projet>();

  protected readonly labels = STATUT_PROJET_LABELS;
  protected readonly badges = PROJECT_BADGES;
  protected readonly blocks = computed(() => toBlocks(this.projet().description).filter((block) => block.kind !== 'heading'));
  protected readonly technologies = computed(() =>
    (this.projet().technologies ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
  protected readonly participants = computed<readonly Participant[]>(() => {
    const item = this.projet();
    const members = (item.membres ?? []).map((m) => ({ initials: initialsOf(m.utilisateurNom), label: m.role === 'PORTEUR' ? `${m.utilisateurNom} (porteur)` : m.utilisateurNom }));
    if (members.length > 0) return members;
    return item.porteurNom ? [{ initials: initialsOf(item.porteurNom), label: `${item.porteurNom} (porteur)` }] : [];
  });
  protected readonly participantsText = computed(() => this.participants().map((p) => p.label).join(', ') || 'Aucun participant renseigné');
  protected readonly links = computed(() => {
    const item = this.projet();
    const candidates = [
      { label: 'Dépôt du code', href: safeUrl(item.depotGit) },
      { label: 'Documentation', href: safeUrl(item.documentationUrl) },
    ];
    return candidates.filter((link): link is { label: string; href: string } => link.href !== null);
  });
}
