import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuditLog, AlerteSecurite } from '../../../core/models';

@Component({
  selector: 'app-admin-securite',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="securite-page">
      <div class="page-title-box">
        <div class="title-row">
          <div>
            <h1>Supervision de la Sécurité & Journal d'Audit</h1>
            <p>Détection des anomalies, protection anti brute-force et traçabilité des opérations sensibles.</p>
          </div>
          <button type="button" class="btn btn-outline btn-sm" (click)="refresh()">
            Actualiser les logs
          </button>
        </div>
      </div>

      <!-- Alertes Actives -->
      <div class="alerts-section">
        <h2>Alertes de Sécurité Récentes</h2>
        <div class="alerts-grid mt-4">
          @for (a of alertes(); track a.id) {
            <div class="glass-card alert-item" [class]="'sev-' + a.severite.toLowerCase()">
              <div class="alert-icon">⚠️</div>
              <div class="alert-body">
                <div class="alert-header">
                  <strong>{{ a.type }}</strong>
                  <span class="badge" [class.badge-error]="a.severite === 'CRITICAL'" [class.badge-warning]="a.severite === 'WARNING'">
                    {{ a.severite }}
                  </span>
                </div>
                <p>{{ a.description }}</p>
                <span class="text-xs text-muted">{{ a.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</span>
              </div>
              <button type="button" class="btn btn-outline btn-sm" (click)="resoudreAlerte(a.id)">
                Résoudre
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Journal d'Audit Logs -->
      <div class="glass-card audit-card mt-6">
        <div class="card-head p-6">
          <h2>Journal d'Audit Système (Audit Trail)</h2>
          <p class="text-xs text-muted">Historique immuable des actions d'authentification et de modification de données.</p>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Entité Cible</th>
              <th>Adresse IP</th>
            </tr>
          </thead>
          <tbody>
            @for (log of auditLogs(); track log.id) {
              <tr>
                <td>{{ log.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                <td><strong>{{ log.utilisateur }}</strong></td>
                <td>
                  <span class="badge badge-primary">{{ log.action }}</span>
                </td>
                <td>{{ log.entityType }} #{{ log.entityId }}</td>
                <td><code>{{ log.ipAddress }}</code></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .securite-page { display: flex; flex-direction: column; gap: 2rem; }
    .title-row { display: flex; align-items: center; justify-content: space-between; }
    .title-row h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .title-row p { color: var(--text-secondary); font-size: 0.95rem; }
    .alerts-grid { display: flex; flex-direction: column; gap: 1rem; }
    .alert-item {
      padding: 1.25rem 1.5rem;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .sev-warning { border-left: 4px solid var(--color-amber-tech); }
    .sev-critical { border-left: 4px solid var(--color-error); }
    .alert-icon { font-size: 1.5rem; }
    .alert-body { flex: 1; }
    .alert-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem; }
    .alert-body p { font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 0.25rem; }
    .audit-card { border-radius: 20px; overflow: hidden; padding: 0; }
    .p-6 { padding: 1.5rem; }
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
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .text-xs { font-size: 0.75rem; }
  `]
})
export class AdminSecuriteComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly auditLogs = signal<AuditLog[]>([]);
  readonly alertes = signal<AlerteSecurite[]>([]);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.api.getAuditLogs().subscribe(res => this.auditLogs.set(res.content));
    this.api.getAlertesSecurite().subscribe(res => this.alertes.set(res));
  }

  resoudreAlerte(id: number): void {
    this.alertes.update(list => list.filter(a => a.id !== id));
    this.toast.success('L\'alerte a été marquée comme résolue.');
  }
}
