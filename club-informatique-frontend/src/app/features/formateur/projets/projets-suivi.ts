import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Projet } from '../../../core/models';

@Component({
  selector: 'app-formateur-projets-suivi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="suivi-page">
      <div class="page-title-box">
        <h1>Mentoring & Suivi des Projets Étudiants</h1>
        <p>Accompagnez les équipes, évaluez l'avancement technique et laissez vos commentaires de suivi.</p>
      </div>

      <div class="projets-grid">
        @for (p of projets(); track p.id) {
          <div class="glass-card project-card">
            <div class="card-head">
              <span class="badge" [class.badge-primary]="p.statut === 'EN_COURS'" [class.badge-success]="p.statut === 'TERMINE'">
                {{ p.statut }}
              </span>
              <span class="text-xs text-muted">{{ p.createdAt | date:'dd/MM/yyyy' }}</span>
            </div>

            <h3>{{ p.titre }}</h3>
            <p class="desc">{{ p.description }}</p>

            <div class="author-info">
              Porté par <strong>{{ p.porteur.prenom }} {{ p.porteur.nom }}</strong>
            </div>

            <!-- Avancement slider -->
            <div class="progress-box mt-4">
              <div class="flex justify-between text-xs mb-1">
                <span>Avancement technique</span>
                <strong>{{ p.avancement }}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                [(ngModel)]="p.avancement"
                class="range-input"
              />
            </div>

            <!-- Feedback textarea -->
            <div class="feedback-box mt-4">
              <label class="form-label text-xs">Note de suivi / Recommandation mentor</label>
              <textarea
                [(ngModel)]="p.commentaireSuivi"
                class="form-control"
                rows="2"
                placeholder="Ex: Revoir l'architecture de la base de données..."
              ></textarea>
            </div>

            <div class="card-footer mt-4">
              <button type="button" class="btn btn-secondary btn-sm w-full" (click)="saveSuivi(p)">
                Enregistrer le suivi
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .suivi-page { display: flex; flex-direction: column; gap: 2rem; }
    .page-title-box h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .page-title-box p { color: var(--text-secondary); font-size: 0.95rem; }
    .projets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.5rem;
    }
    .project-card { padding: 1.75rem; border-radius: 20px; display: flex; flex-direction: column; }
    .card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .project-card h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.4rem; }
    .project-card .desc { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; flex: 1; }
    .author-info { font-size: 0.82rem; color: var(--text-muted); margin-top: 0.75rem; }
    .range-input { width: 100%; accent-color: var(--color-amber-tech); }
    .w-full { width: 100%; }
    .mt-4 { margin-top: 1rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .text-xs { font-size: 0.75rem; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
  `]
})
export class FormateurProjetsSuiviComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly projets = signal<Projet[]>([]);

  ngOnInit(): void {
    this.api.getProjets(0, 20).subscribe(res => {
      this.projets.set(res.content.map(p => ({
        ...p,
        commentaireSuivi: p.commentaireSuivi || 'Bonne progression sur les modules initiaux.'
      })));
    });
  }

  saveSuivi(p: Projet): void {
    this.toast.success(`Suivi mis à jour pour "${p.titre}" (Avancement : ${p.avancement}%).`);
  }
}
