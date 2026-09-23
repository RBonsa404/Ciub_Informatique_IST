import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Projet } from '../../../core/models';

@Component({
  selector: 'app-responsable-projets-validation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="validation-page">
      <div class="page-title-box">
        <h1>Validation & Commission Projets</h1>
        <p>Examinez les propositions soumises par les étudiants membres, approuvez ou rejetez les initiatives.</p>
      </div>

      <div class="projets-validation-grid">
        @for (p of pendingProjets(); track p.id) {
          <div class="glass-card val-card">
            <div class="card-head">
              <span class="badge badge-warning">En attente d'approbation</span>
              <span class="text-xs text-muted">{{ p.createdAt | date:'dd/MM/yyyy' }}</span>
            </div>

            <h3>{{ p.titre }}</h3>
            <p class="desc">{{ p.description }}</p>

            <div class="meta-info">
              <div><strong>Porteur :</strong> {{ p.porteur.prenom }} {{ p.porteur.nom }}</div>
              <div><strong>Technologies :</strong> {{ p.technologies || 'Non spécifiées' }}</div>
            </div>

            <div class="action-buttons mt-4">
              <button type="button" class="btn btn-primary btn-sm flex-1" (click)="valider(p)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Approuver le projet
              </button>
              <button type="button" class="btn btn-outline btn-sm btn-reject flex-1" (click)="rejeter(p)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Rejeter
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .validation-page { display: flex; flex-direction: column; gap: 2rem; }
    .page-title-box h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .page-title-box p { color: var(--text-secondary); font-size: 0.95rem; }
    .projets-validation-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.5rem;
    }
    .val-card { padding: 1.75rem; border-radius: 20px; display: flex; flex-direction: column; }
    .card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .val-card h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.4rem; }
    .val-card .desc { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; flex: 1; }
    .meta-info {
      margin-top: 1rem;
      padding: 0.75rem;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.02);
      font-size: 0.82rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .action-buttons { display: flex; gap: 0.75rem; }
    .btn-reject { border-color: rgba(239, 68, 68, 0.4); color: var(--color-error); }
    .btn-reject:hover { background: rgba(239, 68, 68, 0.08); border-color: var(--color-error); }
    .flex-1 { flex: 1; }
    .mt-4 { margin-top: 1rem; }
    .text-xs { font-size: 0.75rem; }
  `]
})
export class ResponsableProjetsValidationComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly pendingProjets = signal<Projet[]>([
    {
      id: 101,
      titre: 'Smart Parking IST avec capteurs ultrasons',
      slug: 'smart-parking-ist',
      description: 'Détection en temps réel des places de parking libres sur le campus via des capteurs connectés et une application mobile pour les étudiants.',
      technologies: 'Arduino, ESP32, Flutter, Firebase',
      statut: 'PROPOSE',
      avancement: 10,
      porteur: { id: 7, nom: 'Diallo', prenom: 'Amadou' },
      membres: [],
      createdAt: '2026-09-22T10:00:00Z'
    },
    {
      id: 102,
      titre: 'Système d\'émargement biométrique hors-ligne',
      slug: 'emargement-biometrique-offline',
      description: 'Lecteur d\'empreintes digitales autonome avec synchronisation différée par Bluetooth pour les amphis sans connexion internet stable.',
      technologies: 'Raspberry Pi, Python, SQLite',
      statut: 'PROPOSE',
      avancement: 15,
      porteur: { id: 8, nom: 'Somda', prenom: 'Clarisse' },
      membres: [],
      createdAt: '2026-09-21T16:00:00Z'
    }
  ]);

  ngOnInit(): void {}

  valider(p: Projet): void {
    this.pendingProjets.update(list => list.filter(item => item.id !== p.id));
    this.toast.success(`Le projet "${p.titre}" a été approuvé avec succès ! Il figure désormais dans la galerie.`);
  }

  rejeter(p: Projet): void {
    const motif = prompt(`Motif du refus pour "${p.titre}" :`, 'Projet incomplet ou redondant');
    if (motif) {
      this.pendingProjets.update(list => list.filter(item => item.id !== p.id));
      this.toast.info(`Le projet "${p.titre}" a été refusé. Notification transmise au porteur.`);
    }
  }
}
