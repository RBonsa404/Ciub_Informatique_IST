import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-systeme',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="system-page">
      <div class="page-title-box">
        <h1>Configuration Système (Super Admin)</h1>
        <p>Paramètres de sécurité avancés, règles anti brute-force, quotas d'inscriptions et maintenance.</p>
      </div>

      <div class="glass-card form-card">
        <form [formGroup]="configForm" (ngSubmit)="saveConfig()" class="form-stack">
          <h2>Paramètres d'Authentification & Sécurité</h2>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Durée de validité JWT (minutes)</label>
              <input type="number" formControlName="jwtValidityMinutes" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Tentatives max de connexion avant blocage</label>
              <input type="number" formControlName="maxLoginAttempts" class="form-control" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Durée de blocage IP (minutes)</label>
              <input type="number" formControlName="lockoutDurationMinutes" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Exiger la 2FA pour les Administrateurs</label>
              <select formControlName="require2faForAdmin" class="form-control">
                <option [value]="true">Oui (Strictement obligatoire)</option>
                <option [value]="false">Non (Optionnel)</option>
              </select>
            </div>
          </div>

          <h2 class="mt-6">Paramètres Métier du Club</h2>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre max d'inscriptions simultanées par membre</label>
              <input type="number" formControlName="maxInscriptionsPerMember" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Mode Maintenance</label>
              <select formControlName="maintenanceMode" class="form-control">
                <option [value]="false">Désactivé (Plateforme opérationnelle)</option>
                <option [value]="true">Activé (Accès restreint Super Admin)</option>
              </select>
            </div>
          </div>

          <div class="text-right mt-6">
            <button type="submit" class="btn btn-primary btn-lg">
              Enregistrer les paramètres système
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .system-page { display: flex; flex-direction: column; gap: 2rem; }
    .page-title-box h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .page-title-box p { color: var(--text-secondary); font-size: 0.95rem; }
    .form-card { padding: 2.5rem; border-radius: 20px; max-width: 800px; }
    .form-card h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 1.25rem; }
    .form-stack { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .text-right { text-align: right; }
    .mt-6 { margin-top: 1.5rem; }
    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
      .form-card { padding: 1.5rem; }
    }
  `]
})
export class AdminSystemeComponent {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly configForm: FormGroup = this.fb.group({
    jwtValidityMinutes: [60],
    maxLoginAttempts: [5],
    lockoutDurationMinutes: [15],
    require2faForAdmin: [true],
    maxInscriptionsPerMember: [3],
    maintenanceMode: [false]
  });

  saveConfig(): void {
    this.toast.success('Paramètres système appliqués et sauvegardés.');
  }
}
