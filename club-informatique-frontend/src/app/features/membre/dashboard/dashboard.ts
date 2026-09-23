import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { Inscription, Devoir, Notification } from '../../../core/models';

@Component({
  selector: 'app-membre-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-page">
      <!-- Welcome Banner -->
      <div class="glass-card welcome-banner">
        <div class="welcome-text">
          <span class="user-role-badge">Espace Membre</span>
          <h1>Ravi de vous revoir, {{ auth.currentUser()?.prenom }}</h1>
          <p>Voici un aperçu de vos activités, formations en cours et prochains événements à l'IST.</p>
        </div>
        <div class="banner-quick-actions">
          <a routerLink="/formations" class="btn btn-secondary btn-sm">Explorer les formations</a>
          <a routerLink="/membre/proposer-projet" class="btn btn-outline btn-sm">Nouveau projet</a>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="stats-row">
        <div class="glass-card stat-box">
          <div class="stat-icon icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <div>
            <div class="stat-val">{{ inscriptions().length }}</div>
            <div class="stat-lbl">Inscriptions actives</div>
          </div>
        </div>

        <div class="glass-card stat-box">
          <div class="stat-icon icon-amber">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div class="stat-val">{{ devoirs().length }}</div>
            <div class="stat-lbl">Devoirs & TPs à rendre</div>
          </div>
        </div>

        <div class="glass-card stat-box">
          <div class="stat-icon icon-green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div>
            <div class="stat-val">100%</div>
            <div class="stat-lbl">Assiduité globale</div>
          </div>
        </div>

        <div class="glass-card stat-box">
          <div class="stat-icon icon-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
          <div>
            <div class="stat-val">{{ unreadNotifsCount() }}</div>
            <div class="stat-lbl">Nouvelles alertes</div>
          </div>
        </div>
      </div>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Left: Inscriptions & Formations -->
        <div class="grid-col-left">
          <div class="glass-card content-card">
            <div class="card-head">
              <h2>Mes Prochaines Sessions & Événements</h2>
              <a routerLink="/membre/inscriptions" class="see-all-link">Voir tout</a>
            </div>

            @if (inscriptions().length === 0) {
              <div class="empty-state">
                <p>Vous n'avez pas encore d'inscriptions actives.</p>
                <a routerLink="/formations" class="btn btn-primary btn-sm mt-3">S'inscrire à une formation</a>
              </div>
            } @else {
              <div class="items-list">
                @for (item of inscriptions(); track item.id) {
                  <div class="list-row">
                    <div class="row-icon">
                      @if (item.sessionFormation) {
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      } @else {
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      }
                    </div>
                    <div class="row-info">
                      <h4>{{ item.sessionFormation?.formation?.titre || item.evenement?.titre || 'Activité Club' }}</h4>
                      <p>
                        {{ item.sessionFormation?.titre || (item.evenement?.dateDebut | date:'dd/MM/yyyy HH:mm') }}
                      </p>
                    </div>
                    <span class="badge badge-success">Validée</span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Mes Devoirs & TPs -->
          <div class="glass-card content-card mt-6">
            <div class="card-head">
              <h2>Devoirs et Travaux Pratiques</h2>
              <a routerLink="/membre/devoirs" class="see-all-link">Consulter</a>
            </div>

            <div class="items-list">
              @for (d of devoirs(); track d.id) {
                <div class="list-row">
                  <div class="row-icon icon-amber">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div class="row-info">
                    <h4>{{ d.titre }}</h4>
                    <p>À rendre avant le {{ d.dateLimite | date:'dd/MM/yyyy à HH:mm' }}</p>
                  </div>
                  <span class="badge badge-warning">À faire</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right: Notifications & Profil Quick Info -->
        <div class="grid-col-right">
          <div class="glass-card content-card">
            <div class="card-head">
              <h2>Dernières Notifications</h2>
              <a routerLink="/membre/notifications" class="see-all-link">Toutes</a>
            </div>

            <div class="notifs-compact-list">
              @for (n of notifications(); track n.id) {
                <div class="notif-mini-item" [class.unread]="!n.lue">
                  <div class="notif-point"></div>
                  <div class="notif-mini-text">
                    <strong>{{ n.titre }}</strong>
                    <p>{{ n.message }}</p>
                    <span class="notif-time">{{ n.createdAt | date:'short' }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Badges & Certificats -->
          <div class="glass-card content-card mt-6">
            <h3>Mes Badges & Certificats</h3>
            <div class="badges-flex mt-4">
              <div class="badge-item" title="Membre Actif 2026">
                <div class="badge-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <span>Pionnier 26</span>
              </div>
              <div class="badge-item" title="Hackathon Finisher">
                <div class="badge-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
                </div>
                <span>Hackathon</span>
              </div>
              <div class="badge-item" title="Assiduité Parfaite">
                <div class="badge-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                </div>
                <span>Assidu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .welcome-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2.25rem 2.5rem;
      border-radius: 20px;
      gap: 1.5rem;
      background: radial-gradient(circle at 100% 0%, rgba(27, 58, 140, 0.15) 0%, transparent 60%), var(--bg-card);
    }
    .user-role-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-bleu-royal);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.4rem;
    }
    [data-theme="dark"] .user-role-badge { color: var(--color-amber-tech); }
    .welcome-text h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .welcome-text p { color: var(--text-secondary); font-size: 0.95rem; }
    .banner-quick-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }
    .stat-box {
      padding: 1.5rem;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-blue { background: rgba(27, 58, 140, 0.1); color: var(--color-bleu-royal); }
    .icon-amber { background: rgba(245, 166, 35, 0.1); color: var(--color-amber-tech); }
    .icon-green { background: rgba(34, 197, 94, 0.1); color: var(--color-success); }
    .icon-purple { background: rgba(147, 51, 234, 0.1); color: #9333ea; }
    .stat-val { font-size: 1.6rem; font-weight: 800; line-height: 1; }
    .stat-lbl { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }
    .dashboard-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }
    .content-card { padding: 1.75rem; border-radius: 20px; }
    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }
    .card-head h2 { font-size: 1.25rem; font-weight: 700; margin: 0; }
    .see-all-link { font-size: 0.85rem; font-weight: 600; color: var(--color-bleu-royal); }
    [data-theme="dark"] .see-all-link { color: var(--color-amber-tech); }
    .items-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .list-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1rem;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid var(--border-color);
    }
    .row-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: rgba(27, 58, 140, 0.08);
      color: var(--color-bleu-royal);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .row-info { flex: 1; }
    .row-info h4 { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.15rem; }
    .row-info p { font-size: 0.8rem; color: var(--text-muted); }
    .notifs-compact-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .notif-mini-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 10px;
      border-left: 3px solid transparent;
    }
    .notif-mini-item.unread {
      background: rgba(27, 58, 140, 0.04);
      border-left-color: var(--color-bleu-royal);
    }
    [data-theme="dark"] .notif-mini-item.unread {
      background: rgba(245, 166, 35, 0.05);
      border-left-color: var(--color-amber-tech);
    }
    .notif-point {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-amber-tech);
      margin-top: 0.35rem;
      flex-shrink: 0;
    }
    .notif-mini-text strong { font-size: 0.85rem; display: block; }
    .notif-mini-text p { font-size: 0.8rem; color: var(--text-secondary); margin: 0.2rem 0; }
    .notif-time { font-size: 0.7rem; color: var(--text-muted); }
    .badges-flex { display: flex; gap: 1rem; }
    .badge-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .badge-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.04);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }
    .empty-state { text-align: center; padding: 2rem; color: var(--text-muted); }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    @media (max-width: 900px) {
      .welcome-banner { flex-direction: column; align-items: flex-start; }
      .dashboard-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class MembreDashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly inscriptions = signal<Inscription[]>([]);
  readonly devoirs = signal<Devoir[]>([]);
  readonly notifications = signal<Notification[]>([]);

  readonly unreadNotifsCount = signal(0);

  ngOnInit(): void {
    this.api.getMesInscriptions().subscribe(data => this.inscriptions.set(data));
    this.api.getMesDevoirs().subscribe(data => this.devoirs.set(data));
    this.api.getMesNotifications().subscribe(data => {
      this.notifications.set(data);
      this.unreadNotifsCount.set(data.filter(n => !n.lue).length);
    });
  }
}
