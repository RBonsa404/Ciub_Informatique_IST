import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Devoir } from '../../../core/models';

@Component({
  selector: 'app-membre-devoirs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="devoirs-page">
      <div class="page-title-box">
        <h1>Mes Devoirs & Travaux Pratiques</h1>
        <p>Retrouvez la liste des travaux assignés par vos formateurs et soumettez vos livrables.</p>
      </div>

      <div class="devoirs-list">
        @for (d of devoirs(); track d.id) {
          <div class="glass-card devoir-card">
            <div class="devoir-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>

            <div class="devoir-info">
              <div class="meta-row">
                <span class="badge badge-amber">Devoir / TP</span>
                <span class="due-date">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Date limite : {{ d.dateLimite | date:'dd MMMM yyyy à HH:mm' }}
                </span>
              </div>

              <h3>{{ d.titre }}</h3>
              <p class="desc">{{ d.description }}</p>

              <div class="actions mt-4">
                <button type="button" class="btn btn-outline btn-sm" (click)="telechargerSujet(d)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Télécharger le sujet
                </button>
                <button type="button" class="btn btn-primary btn-sm" (click)="deposerDevoir(d)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Déposer mon rendu (ZIP / GitHub)
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .devoirs-page { display: flex; flex-direction: column; gap: 2rem; }
    .page-title-box h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .page-title-box p { color: var(--text-secondary); font-size: 0.95rem; }
    .devoirs-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .devoir-card {
      padding: 1.75rem;
      border-radius: 20px;
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
    }
    .devoir-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(245, 166, 35, 0.1);
      color: var(--color-amber-tech);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .devoir-info { flex: 1; }
    .meta-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
    .due-date {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.82rem;
      color: var(--text-muted);
    }
    .devoir-info h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.4rem; }
    .devoir-info .desc { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; }
    .actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .mt-4 { margin-top: 1rem; }
  `]
})
export class MembreDevoirsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly devoirs = signal<Devoir[]>([]);

  ngOnInit(): void {
    this.api.getMesDevoirs().subscribe(data => this.devoirs.set(data));
  }

  telechargerSujet(d: Devoir): void {
    this.toast.info(`Téléchargement des consignes pour "${d.titre}"...`);
  }

  deposerDevoir(d: Devoir): void {
    const lien = prompt(`Veuillez coller le lien de votre dépôt GitHub ou archive pour "${d.titre}" :`);
    if (lien) {
      this.toast.success('Votre livrable a été transmis au formateur.');
    }
  }
}
