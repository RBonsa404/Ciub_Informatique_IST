import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Page } from '../../core/api/api-client';
import { ManagementApi } from '../../core/api/management.api';
import { MessageContact } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
import { toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';

type MessageFilter = 'tous' | 'nouveaux' | 'traites';

const FILTERS: readonly { key: MessageFilter; label: string; traite: boolean | null }[] = [
  { key: 'tous', label: 'Tous', traite: null },
  { key: 'nouveaux', label: 'Nouveaux', traite: false },
  { key: 'traites', label: 'Traités', traite: true },
];

const EMPTY_MESSAGES: Record<MessageFilter, string> = {
  tous: 'Aucun message n’a été reçu.',
  nouveaux: 'Aucun message n’est en attente de traitement.',
  traites: 'Aucun message n’a encore été traité.',
};

const PAGE_SIZE = 10;

/** Adresse de réponse : lien « mailto » avec le sujet d'origine. */
export function replyLink(message: MessageContact): string {
  return `mailto:${message.email}?subject=${encodeURIComponent(`Re : ${message.sujet}`)}`;
}

/** Messages de contact (page dérivée D4) : messages reçus par le formulaire public, réponse par courriel, suivi du traitement. */
@Component({
  selector: 'app-contact-messages-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Badge, Button, Pagination, DataZone, Skeleton, FrDatePipe],
  styles: `
    .rows {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 2rem;
      max-width: 950px;
    }
    .message {
      padding: 1.5rem;
      border-radius: 20px;
    }
    .message.new {
      border-left: 4px solid var(--color-amber-tech);
    }
    .body {
      font-size: 0.9rem;
      line-height: 1.6;
      white-space: pre-line;
      overflow-wrap: anywhere;
      margin: 0.85rem 0 1.25rem;
    }
    @media (max-width: 600px) {
      .message {
        padding: 1.25rem;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Messages de contact</h1>
        <p class="space-lead">Messages reçus par le formulaire de contact du site. La réponse se fait par courriel.</p>
      </div>
    </div>

    <div class="chip-row" role="group" aria-label="Filtrer les messages">
      @for (option of filters; track option.key) {
        <button
          type="button"
          class="btn btn-sm"
          [class.btn-primary]="filter() === option.key"
          [class.btn-secondary]="filter() !== option.key"
          [attr.aria-pressed]="filter() === option.key"
          (click)="setFilter(option.key)"
        >
          {{ option.label }}
        </button>
      }
    </div>

    <app-data-zone [status]="state.status()" [emptyMessage]="emptyMessage()" emptyIcon="inbox" (retry)="state.load()">
      <div zone-skeleton class="rows">
        <app-skeleton height="170px" radius="20px" />
        <app-skeleton height="170px" radius="20px" />
      </div>

      <ul class="rows" aria-live="polite">
        @for (message of state.data()?.content ?? []; track message.id) {
          <li class="glass-panel message" [class.new]="!message.traite">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem">{{ message.sujet }}</h2>
                <span style="font-size: 0.82rem; color: var(--text-muted); overflow-wrap: anywhere">
                  {{ message.nom }} • {{ message.email }} • {{ message.createdAt | frDate: 'long' }}, {{ message.createdAt | frDate: 'heure' }}
                </span>
              </div>
              <app-badge [variant]="message.traite ? 'success' : 'amber'">{{ message.traite ? 'Traité' : 'Nouveau' }}</app-badge>
            </div>
            <p class="body">{{ message.message }}</p>
            <div class="flex flex-wrap items-center gap-3">
              <a class="btn btn-primary btn-sm" [href]="reply(message)"><app-icon name="mail" [size]="14" /> Répondre par courriel<span class="sr-only"> à {{ message.nom }}</span></a>
              @if (!message.traite) {
                <button appBtn variant="secondary" size="sm" type="button" [loading]="pendingId() === message.id" (click)="markDone(message)">
                  <app-icon name="check" [size]="14" /> Marquer comme traité<span class="sr-only"> : {{ message.sujet }}</span>
                </button>
              } @else if (message.reponseParNom) {
                <span style="font-size: 0.8rem; color: var(--text-muted)">
                  Traité par {{ message.reponseParNom }}
                  @if (message.dateReponse) {
                    le {{ message.dateReponse | frDate: 'court' }}
                  }
                </span>
              }
            </div>
          </li>
        }
      </ul>
      <app-pagination [page]="page()" [totalPages]="totalPages()" label="Pages des messages" (pageChange)="goTo($event)" />
    </app-data-zone>
  `,
})
export class ContactMessagesPage {
  private readonly api = inject(ManagementApi);
  private readonly toasts = inject(ToastService);

  protected readonly filters = FILTERS;
  protected readonly reply = replyLink;
  protected readonly filter = signal<MessageFilter>('tous');
  protected readonly page = signal(0);
  protected readonly pendingId = signal<number | null>(null);

  protected readonly state = new ResourceState<Page<MessageContact>>(() =>
    this.api.messagesContact({ page: this.page(), size: PAGE_SIZE, sort: 'createdAt,desc', traite: FILTERS.find((option) => option.key === this.filter())?.traite ?? null }),
  );
  protected readonly totalPages = computed(() => this.state.data()?.totalPages ?? 0);
  protected readonly emptyMessage = computed(() => EMPTY_MESSAGES[this.filter()]);

  constructor() {
    inject(SeoService).apply({ title: 'Messages de contact', noindex: true });
    this.state.load();
    inject(DestroyRef).onDestroy(() => this.state.destroy());
  }

  protected setFilter(filter: MessageFilter): void {
    if (filter === this.filter()) return;
    this.filter.set(filter);
    this.page.set(0);
    this.state.load();
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.state.load();
  }

  protected markDone(message: MessageContact): void {
    if (this.pendingId()) return;
    this.pendingId.set(message.id);
    this.api.marquerMessageTraite(message.id).subscribe({
      next: () => {
        this.pendingId.set(null);
        this.state.refresh();
        this.toasts.success('Le message est marqué comme traité.');
      },
      error: (failure: unknown) => {
        this.pendingId.set(null);
        const error = toApiError(failure);
        if (error.kind !== 'server' && error.kind !== 'rate-limit') this.toasts.danger(error.userMessage);
      },
    });
  }
}
