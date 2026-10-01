import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Page } from '../../core/api/api-client';
import { MemberApi } from '../../core/api/member.api';
import { NotificationItem, TYPE_NOTIFICATION_LABELS, TypeNotification } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
import { FeatureService } from '../../core/config/feature.service';
import { toApiError } from '../../core/http/problem';
import { NotificationsStore } from '../../core/notifications/notifications.store';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, FrNumberPipe } from '../../shared/format/format';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icon-names';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';

const TYPES: readonly TypeNotification[] = ['MESSAGE_GLOBAL', 'INSCRIPTION', 'VALIDATION_PROJET', 'RAPPEL_SESSION', 'SYSTEME'];
const ICONS: Record<TypeNotification, IconName> = {
  MESSAGE_GLOBAL: 'volume-2',
  INSCRIPTION: 'calendar',
  VALIDATION_PROJET: 'check-square',
  RAPPEL_SESSION: 'clock',
  SYSTEME: 'info',
};
const PAGE_SIZE = 10;

/** Lien interne d'une notification : seuls les chemins du site sont suivis. */
export function internalLink(value: string | null | undefined): string | null {
  return value && /^\/(?!\/)/.test(value) ? value : null;
}

/** Centre de notifications (écran 33) : notifications réelles de l'utilisateur, filtres et marquage comme lues. */
@Component({
  selector: 'app-notifications-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Button, Pagination, DataZone, Skeleton, FrDatePipe, FrNumberPipe],
  styles: `
    .controls {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .controls select {
      width: auto;
      min-width: 220px;
    }
    .wrap {
      max-width: 900px;
    }
    .rows {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .notice {
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
    .notice.unread {
      border-left: 4px solid var(--color-amber-tech);
    }
    .glyph {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent-active);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-amber-tech);
      flex-shrink: 0;
    }
    .when {
      font-size: 0.78rem;
      color: var(--text-muted);
      white-space: nowrap;
    }
    @media (max-width: 600px) {
      .controls select {
        width: 100%;
      }
      .glyph {
        display: none;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Centre de <span class="accent-cyan">notifications</span></h1>
        <p class="space-lead">Restez informé des annonces, des activités et des mises à jour du Club Informatique de l’IST.</p>
      </div>
      <div class="controls">
        <label class="sr-only" for="type-notification">Type de notification</label>
        <select id="type-notification" class="form-select" (change)="setType($event)">
          <option value="">Toutes les notifications</option>
          @for (type of types; track type) {
            <option [value]="type">{{ typeLabels[type] }}</option>
          }
        </select>
        @if (settingsEnabled) {
          <a class="btn btn-secondary" routerLink="/espace/parametres"><app-icon name="settings" [size]="16" /> Préférences</a>
        }
      </div>
    </div>

    <div class="wrap">
      <div class="chip-row" role="group" aria-label="Filtrer par état de lecture" style="margin-bottom: 1.5rem">
        <button type="button" class="btn btn-sm" [class.btn-primary]="!unreadOnly()" [class.btn-secondary]="unreadOnly()" [attr.aria-pressed]="!unreadOnly()" (click)="setUnreadOnly(false)">
          Tout
        </button>
        <button type="button" class="btn btn-sm" [class.btn-primary]="unreadOnly()" [class.btn-secondary]="!unreadOnly()" [attr.aria-pressed]="unreadOnly()" (click)="setUnreadOnly(true)">
          Non lues
          @if (store.unread(); as count) {
            ({{ count | frNumber }})
          }
        </button>
      </div>

      <app-data-zone [status]="status()" [emptyMessage]="emptyMessage()" emptyIcon="bell" (retry)="state.load()">
        <div zone-skeleton class="rows">
          <app-skeleton height="92px" radius="var(--radius-lg)" />
          <app-skeleton height="92px" radius="var(--radius-lg)" />
          <app-skeleton height="92px" radius="var(--radius-lg)" />
        </div>

        <ul class="rows" aria-live="polite">
          @for (item of items(); track item.id) {
            <li class="glass-card glass-card-static notice" [class.unread]="!item.lue">
              <div class="glyph" aria-hidden="true"><app-icon [name]="icons[item.type] ?? 'bell'" [size]="20" /></div>
              <div class="min-w-0" style="flex: 1">
                <div class="flex flex-wrap items-center justify-between gap-2" style="margin-bottom: 0.25rem">
                  <span class="flex min-w-0 items-center gap-2">
                    <strong style="font-size: 0.95rem">{{ item.titre }}</strong>
                    @if (!item.lue) {
                      <span class="dot" aria-hidden="true"></span>
                      <span class="sr-only">(non lue)</span>
                    }
                  </span>
                  <span class="when">{{ item.createdAt | frDate: 'court' }}, {{ item.createdAt | frDate: 'heure' }}</span>
                </div>
                <p style="font-size: 0.85rem; white-space: pre-line">{{ item.message }}</p>
                @if (link(item) || !item.lue) {
                  <div class="flex flex-wrap gap-2" style="margin-top: 0.75rem">
                    @if (link(item); as href) {
                      <a class="btn btn-outline btn-sm" [routerLink]="href" (click)="markRead(item, true)">Ouvrir<span class="sr-only"> : {{ item.titre }}</span></a>
                    }
                    @if (!item.lue) {
                      <button appBtn variant="secondary" size="sm" type="button" [loading]="pendingId() === item.id" (click)="markRead(item)">
                        Marquer comme lue<span class="sr-only"> : {{ item.titre }}</span>
                      </button>
                    }
                  </div>
                }
              </div>
            </li>
          }
        </ul>

        <div class="flex flex-wrap items-center justify-between gap-4">
          <button appBtn variant="secondary" size="sm" type="button" [loading]="allPending()" [disabled]="!hasUnread()" (click)="markAllRead()">
            <app-icon name="check" [size]="14" /> Tout marquer comme lu
          </button>
          <app-pagination [page]="page()" [totalPages]="totalPages()" label="Pages des notifications" (pageChange)="goTo($event)" />
        </div>
      </app-data-zone>
    </div>
  `,
})
export class NotificationsPage {
  private readonly api = inject(MemberApi);
  private readonly toasts = inject(ToastService);
  protected readonly store = inject(NotificationsStore);
  protected readonly settingsEnabled = inject(FeatureService).isEnabled('profil');

  protected readonly types = TYPES;
  protected readonly typeLabels = TYPE_NOTIFICATION_LABELS;
  protected readonly icons = ICONS;
  protected readonly link = (item: NotificationItem) => internalLink(item.lien);

  protected readonly type = signal<TypeNotification | null>(null);
  protected readonly unreadOnly = signal(false);
  protected readonly page = signal(0);
  protected readonly pendingId = signal<number | null>(null);
  protected readonly allPending = signal(false);

  protected readonly state = new ResourceState<Page<NotificationItem>>(() =>
    this.api.notifications({ page: this.page(), size: PAGE_SIZE, type: this.type(), lue: this.unreadOnly() ? false : null }),
  );
  /** Les filtres sont appliqués par le serveur et revérifiés sur la page reçue. */
  protected readonly items = computed(() =>
    (this.state.data()?.content ?? []).filter((item) => (!this.type() || item.type === this.type()) && (!this.unreadOnly() || !item.lue)),
  );
  protected readonly status = computed(() => (this.state.status() === 'ready' && this.items().length === 0 ? 'empty' : this.state.status()));
  protected readonly totalPages = computed(() => this.state.data()?.totalPages ?? 0);
  protected readonly hasUnread = computed(() => this.items().some((item) => !item.lue));
  protected readonly emptyMessage = computed(() =>
    this.unreadOnly() ? 'Vous n’avez aucune notification non lue.' : this.type() ? 'Vous n’avez aucune notification de ce type.' : 'Vous n’avez aucune notification.',
  );

  constructor() {
    inject(SeoService).apply({ title: 'Centre de notifications', noindex: true });
    this.state.load();
    inject(DestroyRef).onDestroy(() => this.state.destroy());
  }

  protected setType(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.type.set(value ? (value as TypeNotification) : null);
    this.page.set(0);
    this.state.load();
  }

  protected setUnreadOnly(value: boolean): void {
    if (value === this.unreadOnly()) return;
    this.unreadOnly.set(value);
    this.page.set(0);
    this.state.load();
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.state.load();
  }

  /** quiet : marquage à l'ouverture du lien, sans attente ni message. */
  protected markRead(item: NotificationItem, quiet = false): void {
    if (item.lue) return;
    if (!quiet) this.pendingId.set(item.id);
    this.api.marquerLue(item.id).subscribe({
      next: () => {
        this.pendingId.set(null);
        this.state.refresh();
        this.store.refresh();
      },
      error: (failure: unknown) => {
        this.pendingId.set(null);
        const kind = toApiError(failure).kind;
        if (!quiet && kind !== 'server' && kind !== 'rate-limit') this.toasts.danger('La notification n’a pas pu être marquée comme lue.');
      },
    });
  }

  protected markAllRead(): void {
    if (this.allPending()) return;
    this.allPending.set(true);
    this.api.toutMarquerLu().subscribe({
      next: () => {
        this.allPending.set(false);
        this.state.refresh();
        this.store.refresh();
        this.toasts.success('Toutes vos notifications sont marquées comme lues.');
      },
      error: (failure: unknown) => {
        this.allPending.set(false);
        const kind = toApiError(failure).kind;
        if (kind !== 'server' && kind !== 'rate-limit') this.toasts.danger('Vos notifications n’ont pas pu être marquées comme lues.');
      },
    });
  }
}
