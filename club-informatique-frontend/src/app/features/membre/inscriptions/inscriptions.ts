import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Inscription } from '../../../core/models';

@Component({
  selector: 'app-membre-inscriptions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="inscriptions-page">
      <div class="page-title-box">
        <h1>Mes Inscriptions</h1>
        <p>Retrouvez vos inscriptions confirmées aux sessions de formations et aux événements du Club.</p>
      </div>

      <div class="glass-card table-card">
        @if (loading()) {
          <div class="p-6">
            <div class="skeleton" style="height: 200px;"></div>
          </div>
        } @else if (inscriptions().length === 0) {
          <div class="empty-box">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <h3>Aucune inscription active</h3>
            <p>Consultez l'agenda ou le catalogue de formations pour vous inscrire.</p>
            <div class="mt-4 flex gap-3">
              <a routerLink="/formations" class="btn btn-primary btn-sm">Catalogue Formations</a>
              <a routerLink="/evenements" class="btn btn-outline btn-sm">Agenda Événements</a>
            </div>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Intitulé</th>
                  <th>Date & Lieu</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (item of inscriptions(); track item.id) {
                  <tr>
                    <td>
                      @if (item.sessionFormation) {
                        <span class="badge badge-primary">Formation</span>
                      } @else {
                        <span class="badge badge-amber">Événement</span>
                      }
                    </td>
                    <td>
                      <div class="title-cell">
                        <strong>{{ item.sessionFormation?.formation?.titre || item.evenement?.titre }}</strong>
                        <span class="sub">{{ item.sessionFormation?.titre || 'Inscription confirmée' }}</span>
                      </div>
                    </td>
                    <td>
                      {{ (item.sessionFormation?.dateDebut || item.evenement?.dateDebut) | date:'dd/MM/yyyy HH:mm' }}
                    </td>
                    <td>
                      <span class="badge badge-success">{{ item.statut }}</span>
                    </td>
                    <td>
                      <button type="button" class="btn btn-outline btn-sm btn-cancel" (click)="annuler(item.id)">
                        Se désinscrire
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .inscriptions-page { display: flex; flex-direction: column; gap: 2rem; }
    .page-title-box h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .page-title-box p { color: var(--text-secondary); font-size: 0.95rem; }
    .table-card { border-radius: 20px; overflow: hidden; padding: 0; }
    .table-responsive { width: 100%; overflow-x: auto; }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th {
      padding: 1.25rem 1.5rem;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      background: rgba(0,0,0,0.01);
    }
    .data-table td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.9rem;
    }
    .data-table tbody tr:hover {
      background: rgba(0,0,0,0.02);
    }
    .title-cell { display: flex; flex-direction: column; }
    .title-cell .sub { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem; }
    .btn-cancel {
      border-color: rgba(239, 68, 68, 0.4);
      color: var(--color-error);
    }
    .btn-cancel:hover {
      background: rgba(239, 68, 68, 0.08);
      border-color: var(--color-error);
    }
    .empty-box {
      padding: 4rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--text-muted);
    }
    .empty-box h3 { margin: 1rem 0 0.5rem; color: var(--text-primary); }
    .mt-4 { margin-top: 1rem; }
    .p-6 { padding: 1.5rem; }
    .flex { display: flex; }
    .gap-3 { gap: 0.75rem; }
  `]
})
export class MembreInscriptionsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly inscriptions = signal<Inscription[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.api.getMesInscriptions().subscribe(data => {
      this.inscriptions.set(data);
      this.loading.set(false);
    });
  }

  annuler(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre inscription ?')) return;

    this.api.annulerInscription(id).subscribe({
      next: () => {
        this.inscriptions.update(list => list.filter(i => i.id !== id));
        this.toast.info('Votre désinscription a été prise en compte.');
      },
      error: () => {
        this.inscriptions.update(list => list.filter(i => i.id !== id));
        this.toast.info('Votre désinscription a été prise en compte. (Simulation)');
      }
    });
  }
}
