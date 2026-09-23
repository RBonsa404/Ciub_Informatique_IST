import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Notification } from '../../../core/models';

@Component({
  selector: 'app-membre-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-page">
      <div class="page-title-box">
        <div class="title-row">
          <div>
            <h1>Centre de Notifications</h1>
            <p>Retrouvez toutes les alertes, rappels de cours et annonces officielles du Club.</p>
          </div>
          <button type="button" class="btn btn-outline btn-sm" (click)="marquerToutesLues()">
            Tout marquer comme lu
          </button>
        </div>
      </div>

      <div class="glass-card notifs-card">
        @if (notifications().length === 0) {
          <div class="empty-notifs">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <h3>Aucune notification</h3>
            <p>Vous êtes parfaitement à jour !</p>
          </div>
        } @else {
          <div class="notifs-list">
            @for (n of notifications(); track n.id) {
              <div class="notif-item" [class.unread]="!n.lue">
                <div class="notif-badge-icon" [class]="'badge-' + n.type.toLowerCase()">
                  @switch (n.type) {
                    @case ('INSCRIPTION') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    }
                    @case ('ALERTE') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    }
                    @default {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    }
                  }
                </div>

                <div class="notif-content">
                  <div class="notif-header">
                    <h4>{{ n.titre }}</h4>
                    <span class="notif-date">{{ n.createdAt | date:'dd MMM yyyy à HH:mm' }}</span>
                  </div>
                  <p class="notif-msg">{{ n.message }}</p>
                </div>

                @if (!n.lue) {
                  <button type="button" class="btn btn-ghost btn-sm btn-mark" (click)="marquerLue(n.id)" title="Marquer comme lu">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .notifications-page { display: flex; flex-direction: column; gap: 2rem; }
    .title-row { display: flex; align-items: center; justify-content: space-between; }
    .title-row h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .title-row p { color: var(--text-secondary); font-size: 0.95rem; }
    .notifs-card { border-radius: 20px; padding: 0; overflow: hidden; }
    .notifs-list { display: flex; flex-direction: column; }
    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      transition: background 0.2s;
    }
    .notif-item.unread {
      background: rgba(27, 58, 140, 0.03);
      border-left: 4px solid var(--color-bleu-royal);
    }
    [data-theme="dark"] .notif-item.unread {
      background: rgba(245, 166, 35, 0.04);
      border-left: 4px solid var(--color-amber-tech);
    }
    .notif-badge-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .badge-inscription { background: rgba(34, 197, 94, 0.1); color: var(--color-success); }
    .badge-alerte { background: rgba(239, 68, 68, 0.1); color: var(--color-error); }
    .badge-info, .badge-globale { background: rgba(27, 58, 140, 0.1); color: var(--color-bleu-royal); }
    [data-theme="dark"] .badge-info { color: var(--color-amber-tech); background: rgba(245, 166, 35, 0.1); }
    .notif-content { flex: 1; }
    .notif-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
    .notif-header h4 { font-size: 1rem; font-weight: 700; margin: 0; }
    .notif-date { font-size: 0.75rem; color: var(--text-muted); }
    .notif-msg { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.4; }
    .btn-mark { color: var(--text-muted); }
    .btn-mark:hover { color: var(--color-success); }
    .empty-notifs { padding: 4rem 2rem; text-align: center; color: var(--text-muted); }
    .empty-notifs h3 { margin: 1rem 0 0.25rem; color: var(--text-primary); }
  `]
})
export class MembreNotificationsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly notifications = signal<Notification[]>([]);

  ngOnInit(): void {
    this.api.getMesNotifications().subscribe(data => this.notifications.set(data));
  }

  marquerLue(id: number): void {
    this.api.marquerNotificationLue(id).subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => n.id === id ? { ...n, lue: true } : n));
      },
      error: () => {
        this.notifications.update(list => list.map(n => n.id === id ? { ...n, lue: true } : n));
      }
    });
  }

  marquerToutesLues(): void {
    this.notifications.update(list => list.map(n => ({ ...n, lue: true })));
    this.toast.success('Toutes les notifications sont marquées comme lues.');
  }
}
