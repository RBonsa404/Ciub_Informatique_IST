import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeType =
  | 'formation'
  | 'projet'
  | 'hackathon'
  | 'evenement'
  | 'active'
  | 'en_cours'
  | 'termine'
  | 'rejete'
  | 'propose'
  | 'role'
  | 'success'
  | 'warning'
  | 'info'
  | 'error'
  | 'niveau';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="app-badge" [ngClass]="badgeClass()">
      <span class="badge-icon-box">
        @switch (resolvedIcon()) {
          @case ('book') {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
          }
          @case ('code') {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          }
          @case ('calendar') {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          }
          @case ('trophy') {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34"/><path d="M18 4H6v7a6 6 0 0 0 12 0V4Z"/></svg>
          }
          @case ('clock') {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          }
          @case ('check') {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          }
          @case ('shield') {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          }
          @case ('sparkles') {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
          }
          @default {
            <span class="badge-dot"></span>
          }
        }
      </span>
      <span class="badge-label">{{ label }}</span>
    </span>
  `,
  styles: [`
    .app-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.32rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.76rem;
      font-weight: 600;
      font-family: var(--font-inter);
      letter-spacing: 0.02em;
      border: 1px solid transparent;
      white-space: nowrap;
      line-height: 1;
      transition: all 0.2s ease;
    }

    .badge-icon-box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }

    .badge-label {
      font-weight: 600;
    }

    /* Types sémantiques */
    .badge-formation {
      background: rgba(27, 58, 140, 0.08);
      color: var(--color-bleu-royal);
      border-color: rgba(27, 58, 140, 0.2);
    }

    .badge-projet {
      background: rgba(245, 166, 35, 0.12);
      color: #B45309;
      border-color: rgba(245, 166, 35, 0.3);
    }

    .badge-hackathon {
      background: rgba(168, 85, 247, 0.12);
      color: #9333EA;
      border-color: rgba(168, 85, 247, 0.3);
    }

    .badge-evenement {
      background: rgba(59, 130, 246, 0.1);
      color: #1D4ED8;
      border-color: rgba(59, 130, 246, 0.25);
    }

    .badge-active, .badge-success, .badge-termine {
      background: rgba(34, 197, 94, 0.1);
      color: #15803D;
      border-color: rgba(34, 197, 94, 0.25);
    }

    .badge-en_cours, .badge-propose, .badge-warning {
      background: rgba(245, 166, 35, 0.12);
      color: #B45309;
      border-color: rgba(245, 166, 35, 0.3);
    }

    .badge-rejete, .badge-error {
      background: rgba(239, 68, 68, 0.1);
      color: #B91C1C;
      border-color: rgba(239, 68, 68, 0.25);
    }

    .badge-role {
      background: rgba(15, 23, 42, 0.06);
      color: var(--text-primary);
      border-color: var(--border-color);
    }

    /* Dark mode */
    [data-theme="dark"] .badge-formation {
      background: rgba(42, 79, 168, 0.25);
      color: #93C5FD;
      border-color: rgba(147, 197, 253, 0.25);
    }

    [data-theme="dark"] .badge-projet,
    [data-theme="dark"] .badge-en_cours,
    [data-theme="dark"] .badge-propose,
    [data-theme="dark"] .badge-warning {
      background: rgba(245, 166, 35, 0.18);
      color: var(--color-amber-tech-light);
      border-color: rgba(245, 166, 35, 0.3);
    }

    [data-theme="dark"] .badge-hackathon {
      background: rgba(168, 85, 247, 0.2);
      color: #D8B4FE;
      border-color: rgba(216, 180, 254, 0.3);
    }

    [data-theme="dark"] .badge-evenement {
      background: rgba(59, 130, 246, 0.2);
      color: #93C5FD;
      border-color: rgba(147, 197, 253, 0.3);
    }

    [data-theme="dark"] .badge-active,
    [data-theme="dark"] .badge-success,
    [data-theme="dark"] .badge-termine {
      background: rgba(34, 197, 94, 0.18);
      color: #86EFAC;
      border-color: rgba(34, 197, 94, 0.3);
    }

    [data-theme="dark"] .badge-rejete,
    [data-theme="dark"] .badge-error {
      background: rgba(239, 68, 68, 0.18);
      color: #FCA5A5;
      border-color: rgba(239, 68, 68, 0.3);
    }

    [data-theme="dark"] .badge-role {
      background: rgba(255, 255, 255, 0.08);
      color: #F1F5F9;
      border-color: rgba(255, 255, 255, 0.12);
    }
  `]
})
export class BadgeComponent {
  @Input() type: BadgeType = 'info';
  @Input() label = '';
  @Input() icon?: string;

  readonly badgeClass = computed(() => `badge-${this.type.toLowerCase()}`);

  readonly resolvedIcon = computed(() => {
    if (this.icon) return this.icon;
    switch (this.type) {
      case 'formation': return 'book';
      case 'projet': return 'code';
      case 'hackathon': return 'trophy';
      case 'evenement': return 'calendar';
      case 'active':
      case 'termine':
      case 'success': return 'check';
      case 'en_cours':
      case 'propose':
      case 'warning': return 'clock';
      case 'role': return 'shield';
      default: return 'dot';
    }
  });
}
