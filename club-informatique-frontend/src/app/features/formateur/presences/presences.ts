import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

interface EtudiantPresence {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  statut: 'PRESENT' | 'ABSENT' | 'EXCUSE';
}

@Component({
  selector: 'app-formateur-presences',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="presences-page">
      <div class="page-title-box">
        <div class="title-row">
          <div>
            <h1>Émargement & Feuilles de Présence</h1>
            <p>Contrôlez l'assiduité des apprenants pour chaque séance de cours et exportez les rapports.</p>
          </div>
          <button type="button" class="btn btn-primary" (click)="savePresences()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Enregistrer la feuille de présence
          </button>
        </div>
      </div>

      <div class="glass-card session-selector-card">
        <div class="selector-row">
          <div>
            <label class="form-label">Sélectionnez la session</label>
            <select class="form-control">
              <option>Fullstack Moderne : Angular 22 & Spring Boot 4 — Séance 4 (23/09/2026)</option>
              <option>Initiation à l'IA & Python — Séance 2</option>
              <option>Cybersécurité Pentest — Séance 1</option>
            </select>
          </div>
          <div class="quick-stats">
            <span class="badge badge-success">{{ countPresent() }} Présents</span>
            <span class="badge badge-error">{{ countAbsent() }} Absents</span>
            <span class="badge badge-warning">{{ countExcuse() }} Excusés</span>
          </div>
        </div>
      </div>

      <div class="glass-card table-card mt-6">
        <table class="data-table">
          <thead>
            <tr>
              <th>Étudiant</th>
              <th>Adresse e-mail</th>
              <th>Statut Émargement</th>
              <th>Actions Rapides</th>
            </tr>
          </thead>
          <tbody>
            @for (etudiant of etudiants(); track etudiant.id) {
              <tr>
                <td>
                  <strong>{{ etudiant.nom }} {{ etudiant.prenom }}</strong>
                </td>
                <td>{{ etudiant.email }}</td>
                <td>
                  <span
                    class="badge"
                    [class.badge-success]="etudiant.statut === 'PRESENT'"
                    [class.badge-error]="etudiant.statut === 'ABSENT'"
                    [class.badge-warning]="etudiant.statut === 'EXCUSE'"
                  >
                    {{ etudiant.statut }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="btn btn-sm"
                      [class.btn-primary]="etudiant.statut === 'PRESENT'"
                      [class.btn-outline]="etudiant.statut !== 'PRESENT'"
                      (click)="setStatus(etudiant, 'PRESENT')"
                    >
                      Présent
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm"
                      [class.btn-danger]="etudiant.statut === 'ABSENT'"
                      [class.btn-outline]="etudiant.statut !== 'ABSENT'"
                      (click)="setStatus(etudiant, 'ABSENT')"
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm"
                      [class.btn-secondary]="etudiant.statut === 'EXCUSE'"
                      [class.btn-outline]="etudiant.statut !== 'EXCUSE'"
                      (click)="setStatus(etudiant, 'EXCUSE')"
                    >
                      Excusé
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .presences-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .title-row { display: flex; align-items: center; justify-content: space-between; }
    .title-row h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .title-row p { color: var(--text-secondary); font-size: 0.95rem; }
    .session-selector-card { padding: 1.5rem; border-radius: 16px; }
    .selector-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; }
    .quick-stats { display: flex; gap: 0.75rem; }
    .table-card { border-radius: 20px; overflow: hidden; padding: 0; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th {
      padding: 1.25rem 1.5rem;
      font-size: 0.8rem;
      text-transform: uppercase;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      background: rgba(0,0,0,0.01);
    }
    .data-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; }
    .flex { display: flex; }
    .gap-2 { gap: 0.5rem; }
    .mt-6 { margin-top: 1.5rem; }
    @media (max-width: 768px) {
      .selector-row { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class FormateurPresencesComponent {
  private readonly toast = inject(ToastService);

  readonly etudiants = signal<EtudiantPresence[]>([
    { id: 1, nom: 'Kabore', prenom: 'Ibrahim', email: 'ibrahim.kabore@ist.bf', statut: 'PRESENT' },
    { id: 2, nom: 'Tapsoba', prenom: 'Nadine', email: 'nadine.tapsoba@ist.bf', statut: 'PRESENT' },
    { id: 3, nom: 'Boro', prenom: 'Alassane', email: 'alassane.boro@ist.bf', statut: 'ABSENT' },
    { id: 4, nom: 'Sanou', prenom: 'Cynthia', email: 'cynthia.sanou@ist.bf', statut: 'EXCUSE' },
    { id: 5, nom: 'Kinda', prenom: 'Benoit', email: 'benoit.kinda@ist.bf', statut: 'PRESENT' }
  ]);

  countPresent(): number { return this.etudiants().filter(e => e.statut === 'PRESENT').length; }
  countAbsent(): number { return this.etudiants().filter(e => e.statut === 'ABSENT').length; }
  countExcuse(): number { return this.etudiants().filter(e => e.statut === 'EXCUSE').length; }

  setStatus(e: EtudiantPresence, statut: 'PRESENT' | 'ABSENT' | 'EXCUSE'): void {
    this.etudiants.update(list => list.map(item => item.id === e.id ? { ...item, statut } : item));
  }

  savePresences(): void {
    this.toast.success('Feuille d\'émargement enregistrée avec succès.');
  }
}
