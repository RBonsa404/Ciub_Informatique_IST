import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-admin-utilisateurs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="manage-page">
      <div class="page-title-box">
        <h1>Gestion des Utilisateurs</h1>
        <p>Administration des comptes étudiants, formateurs, gestion des accès et suspensions.</p>
      </div>

      <div class="glass-card table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Filière & Année</th>
              <th>Rôle principal</th>
              <th>Statut Compte</th>
              <th>2FA</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (u of users(); track u.id) {
              <tr>
                <td>
                  <strong>{{ u.prenom }} {{ u.nom }}</strong>
                  <div class="text-xs text-muted">{{ u.email }}</div>
                </td>
                <td>{{ u.filiere || 'Non renseigné' }} {{ u.anneeEtude ? '(L' + u.anneeEtude + ')' : '' }}</td>
                <td>
                  <span class="badge badge-primary">{{ u.roles[0]?.nom?.replace('ROLE_', '') }}</span>
                </td>
                <td>
                  <span
                    class="badge"
                    [class.badge-success]="u.statut === 'ACTIF'"
                    [class.badge-error]="u.statut === 'SUSPENDU'"
                    [class.badge-warning]="u.statut === 'INACTIF'"
                  >
                    {{ u.statut }}
                  </span>
                </td>
                <td>
                  <span class="text-xs font-semibold" [style.color]="u.twoFactorEnabled ? 'var(--color-success)' : 'var(--text-muted)'">
                    {{ u.twoFactorEnabled ? 'Oui' : 'Non' }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    @if (u.statut === 'ACTIF') {
                      <button type="button" class="btn btn-outline btn-sm text-error" (click)="toggleStatut(u, 'SUSPENDU')">Suspendre</button>
                    } @else {
                      <button type="button" class="btn btn-outline btn-sm text-success" (click)="toggleStatut(u, 'ACTIF')">Réactiver</button>
                    }
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
    .text-success { color: var(--color-success); }
    .font-semibold { font-weight: 600; }
  `]
})
export class AdminUtilisateursComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly users = signal<User[]>([]);

  ngOnInit(): void {
    this.api.getUtilisateurs(0, 50).subscribe(res => this.users.set(res.content));
  }

  toggleStatut(u: User, newStatut: 'ACTIF' | 'SUSPENDU' | 'INACTIF'): void {
    this.users.update(list => list.map(item => item.id === u.id ? { ...item, statut: newStatut } : item));
    this.toast.success(`Le statut du compte ${u.email} a été mis à jour : ${newStatut}.`);
  }
}
