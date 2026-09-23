import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface RoleDefinition {
  nom: string;
  description: string;
  permissions: string[];
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="roles-page">
      <div class="page-title-box">
        <h1>Rôles & Matrice des Permissions</h1>
        <p>Gouvernance hiérarchique RBAC conformément au Cahier des Charges de l'IST.</p>
      </div>

      <div class="roles-grid">
        @for (r of roles(); track r.nom) {
          <div class="glass-card role-card">
            <div class="role-head">
              <h3>{{ r.nom }}</h3>
              <span class="badge badge-primary">{{ r.permissions.length }} permissions</span>
            </div>
            <p class="role-desc">{{ r.description }}</p>

            <div class="permissions-tags">
              @for (p of r.permissions; track p) {
                <span class="perm-tag">✓ {{ p }}</span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .roles-page { display: flex; flex-direction: column; gap: 2rem; }
    .page-title-box h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .page-title-box p { color: var(--text-secondary); font-size: 0.95rem; }
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.5rem;
    }
    .role-card { padding: 1.75rem; border-radius: 20px; display: flex; flex-direction: column; }
    .role-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .role-head h3 { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .role-desc { font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 1.25rem; flex: 1; }
    .permissions-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .perm-tag {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      background: rgba(27, 58, 140, 0.08);
      color: var(--color-bleu-royal);
      font-weight: 500;
    }
    [data-theme="dark"] .perm-tag {
      background: rgba(245, 166, 35, 0.1);
      color: var(--color-amber-tech);
    }
  `]
})
export class AdminRolesComponent {
  readonly roles = signal<RoleDefinition[]>([
    {
      nom: 'ROLE_MEMBRE',
      description: 'Étudiant adhérent du Club. Inscription aux cours, soumission de projets, consultation des devoirs.',
      permissions: ['CONSULTER_FORMATIONS', 'INSCRIRE_SESSION', 'PROPOSER_PROJET', 'CONSULTER_DEVOIRS', 'GERER_PROFIL_PERSO']
    },
    {
      nom: 'ROLE_FORMATEUR',
      description: 'Enseignant ou étudiant pair formateur. Création de cours, émargement des présences et encadrement.',
      permissions: ['CREER_FORMATION', 'GERER_SESSIONS', 'VALIDER_PRESENCES', 'DEPOSER_RESSOURCES', 'SUIVRE_PROJETS']
    },
    {
      nom: 'ROLE_RESPONSABLE_CLUB',
      description: 'Membre du Bureau Exécutif. Publication des actualités, événements et validation des projets.',
      permissions: ['CRUD_ACTUALITES', 'CRUD_EVENEMENTS', 'VALIDER_PROJETS', 'DIFFUSER_NOTIFS_GLOBALES', 'GERER_INSCRIPTIONS']
    },
    {
      nom: 'ROLE_ADMIN',
      description: 'Administrateur technique de la plateforme. Supervision des comptes, statistiques et modération.',
      permissions: ['GERER_UTILISATEURS', 'SUSPENDRE_COMPTE', 'ACCES_AUDIT_LOGS', 'SUPERVISION_SECURITE', 'CMS_PAGES']
    },
    {
      nom: 'ROLE_SUPER_ADMIN',
      description: 'Privilèges maximaux. Configuration des paramètres critiques du système et gestion des rôles.',
      permissions: ['TOUTES_PERMISSIONS', 'CONFIG_SYSTEME', 'PURGE_LOGS', 'RESTORE_BACKUP']
    },
    {
      nom: 'ROLE_DSI',
      description: 'Direction des Systèmes d\'Information de l\'IST. Audit de conformité et inspection en lecture seule.',
      permissions: ['AUDIT_READ_ONLY', 'VERIF_CONFORMITE', 'EXPORT_LOGS_SECURITE']
    }
  ]);
}
