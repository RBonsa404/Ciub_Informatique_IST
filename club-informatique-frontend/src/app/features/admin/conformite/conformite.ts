import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-conformite',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="conformite-page">
      <div class="page-title-box">
        <div class="title-row">
          <div>
            <h1>Espace DSI & Conformité Institutionnelle</h1>
            <p>Vue d'audit technique en lecture seule pour la Direction des Systèmes d'Information de l'IST.</p>
          </div>
          <span class="badge badge-success">Accès Lecture Seule (Read-Only)</span>
        </div>
      </div>

      <!-- Checklist de conformité -->
      <div class="glass-card checklist-card">
        <h2>Règles de Conformité & Sécurité Applicative</h2>
        <div class="check-items-list mt-4">
          <div class="check-item">
            <span class="status-icon success">✓</span>
            <div>
              <strong>Hachage des mots de passe en BCrypt (force 12)</strong>
              <p>Conforme aux recommandations de l'ANSSI et du standard NIST 800-63B.</p>
            </div>
          </div>

          <div class="check-item">
            <span class="status-icon success">✓</span>
            <div>
              <strong>Sessions Stateless sécurisées par JWT (HMAC-SHA256)</strong>
              <p>Clé secrète de signature chargée depuis les variables d'environnement externes.</p>
            </div>
          </div>

          <div class="check-item">
            <span class="status-icon success">✓</span>
            <div>
              <strong>Mécanisme anti brute-force et limitation de débit (Rate Limiting)</strong>
              <p>Verrouillage automatique après 5 tentatives infructueuses sur l'endpoint /api/v1/auth/login.</p>
            </div>
          </div>

          <div class="check-item">
            <span class="status-icon success">✓</span>
            <div>
              <strong>Ségrégation stricte des privilèges RBAC</strong>
              <p>Contrôle d'accès méthodique à chaque contrôleur via annotations &#64;PreAuthorize.</p>
            </div>
          </div>

          <div class="check-item">
            <span class="status-icon success">✓</span>
            <div>
              <strong>Traçabilité intégrale et journalisation d'audit</strong>
              <p>Toutes les créations, suppressions et modifications sensibles sont horodatées et persistées.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .conformite-page { display: flex; flex-direction: column; gap: 2rem; }
    .title-row { display: flex; align-items: center; justify-content: space-between; }
    .title-row h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .title-row p { color: var(--text-secondary); font-size: 0.95rem; }
    .checklist-card { padding: 2rem; border-radius: 20px; }
    .checklist-card h2 { font-size: 1.25rem; font-weight: 700; margin: 0; }
    .check-items-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .check-item { display: flex; align-items: flex-start; gap: 1rem; }
    .status-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 0.15rem;
    }
    .status-icon.success { background: rgba(34, 197, 94, 0.15); color: var(--color-success); }
    .check-item strong { font-size: 0.95rem; color: var(--text-primary); display: block; margin-bottom: 0.2rem; }
    .check-item p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; margin: 0; }
    .mt-4 { margin-top: 1rem; }
  `]
})
export class AdminConformiteComponent {}
