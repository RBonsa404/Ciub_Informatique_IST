import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { Inscription } from '../../../core/models';

@Component({
  selector: 'app-responsable-inscriptions-manage',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="manage-page">
      <div class="page-title-box">
        <h1>Gestion Centralisée des Inscriptions</h1>
        <p>Validez les demandes d'adhésion et d'inscription aux événements et sessions du Club.</p>
      </div>

      <div class="glass-card table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Candidat / Étudiant</th>
              <th>Activité Demandée</th>
              <th>Date de Demande</th>
              <th>Statut</th>
              <th>Décision</th>
            </tr>
          </thead>
          <tbody>
            @for (ins of inscriptions(); track ins.id) {
              <tr>
                <td>
                  <strong>{{ ins.utilisateur.prenom }} {{ ins.utilisateur.nom }}</strong>
                  <div class="text-xs text-muted">{{ ins.utilisateur.email }}</div>
                </td>
                <td>
                  {{ ins.sessionFormation?.formation?.titre || ins.evenement?.titre || 'Session Spéciale' }}
                </td>
                <td>{{ ins.dateInscription | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>
                  <span class="badge" [class.badge-success]="ins.statut === 'CONFIRMEE'" [class.badge-warning]="ins.statut === 'EN_ATTENTE'">
                    {{ ins.statut }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button type="button" class="btn btn-primary btn-sm" (click)="changerStatut(ins, 'CONFIRMEE')">Valider</button>
                    <button type="button" class="btn btn-outline btn-sm text-error" (click)="changerStatut(ins, 'REFUSEE')">Refuser</button>
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
    .manage-page { display: flex; flex-direction: column; gap: 2rem; }
    .page-title-box h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .page-title-box p { color: var(--text-secondary); font-size: 0.95rem; }
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
    .text-xs { font-size: 0.75rem; }
    .text-error { color: var(--color-error); }
  `]
})
export class ResponsableInscriptionsManageComponent implements OnInit {
  private readonly toast = inject(ToastService);

  readonly inscriptions = signal<Inscription[]>([
    {
      id: 1,
      statut: 'EN_ATTENTE',
      dateInscription: '2026-09-22T14:30:00Z',
      utilisateur: { id: 21, nom: 'Zida', prenom: 'Patrick', email: 'patrick.zida@ist.bf' },
      sessionFormation: { id: 101, titre: 'Session Octobre', dateDebut: '2026-10-05', formation: { id: 1, titre: 'Fullstack Moderne : Angular 22 & Spring Boot 4' } }
    },
    {
      id: 2,
      statut: 'EN_ATTENTE',
      dateInscription: '2026-09-22T15:10:00Z',
      utilisateur: { id: 22, nom: 'Kere', prenom: 'Valerie', email: 'valerie.kere@ist.bf' },
      evenement: { id: 1, titre: 'IST Code Clash 2026 — Hackathon 48H', dateDebut: '2026-10-15' }
    },
    {
      id: 3,
      statut: 'CONFIRMEE',
      dateInscription: '2026-09-21T09:00:00Z',
      utilisateur: { id: 23, nom: 'Nassa', prenom: 'Paul', email: 'paul.nassa@ist.bf' },
      evenement: { id: 1, titre: 'IST Code Clash 2026 — Hackathon 48H', dateDebut: '2026-10-15' }
    }
  ]);

  ngOnInit(): void {}

  changerStatut(ins: Inscription, nouveauStatut: 'CONFIRMEE' | 'REFUSEE'): void {
    this.inscriptions.update(list => list.map(item => item.id === ins.id ? { ...item, statut: nouveauStatut } : item));
    this.toast.success(`Inscription pour ${ins.utilisateur.prenom} ${ins.utilisateur.nom} marquée comme ${nouveauStatut}.`);
  }
}
