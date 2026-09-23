import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Formation, SessionFormation } from '../../../core/models';
import { BadgeComponent } from '../../../shared/components/badge/badge';

@Component({
  selector: 'app-formation-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeComponent],
  template: `
    <div class="formation-detail-page">
      @if (loading()) {
        <div class="container-app section-padding">
          <div class="skeleton" style="height: 400px; border-radius: 20px;"></div>
        </div>
      } @else if (formation(); as f) {
        <!-- Hero Header -->
        <section class="detail-hero">
          <div class="container-app">
            <a routerLink="/formations" class="back-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Retour au catalogue
            </a>

            <div class="hero-card glass-card">
              <div class="hero-image-box">
                <img [src]="f.imageUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80'" [alt]="f.titre" class="hero-img" />
              </div>

              <div class="hero-info">
                <div class="tags-row">
                  <app-badge type="formation" [label]="f.niveau" icon="book" />
                  <app-badge type="warning" [label]="f.dureeHeures + ' Heures de formation'" icon="clock" />
                </div>

                <h1 class="formation-headline">{{ f.titre }}</h1>

                <p class="formation-lead">{{ f.description }}</p>

                <div class="instructor-card">
                  <div class="avatar-circle">
                    {{ f.formateur.prenom[0] }}{{ f.formateur.nom[0] }}
                  </div>
                  <div>
                    <div class="inst-label">Formateur référent</div>
                    <div class="inst-name">{{ f.formateur.prenom }} {{ f.formateur.nom }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Details Grid -->
        <section class="section-padding">
          <div class="container-app">
            <div class="content-grid">
              <div class="main-content">
                <div class="glass-card mb-8">
                  <h2>Objectifs Pédagogiques</h2>
                  <p class="mt-4">{{ f.objectifs || 'Acquérir une maîtrise opérationnelle et être capable de développer des projets en autonomie.' }}</p>
                </div>

                <div class="glass-card mb-8">
                  <h2>Prérequis recommandés</h2>
                  <p class="mt-4">{{ f.prerequis || 'Aucun prérequis spécifique requis.' }}</p>
                </div>

                <!-- Sessions disponibles -->
                <div class="glass-card">
                  <h2>Sessions de Formation & Inscriptions</h2>
                  <p class="text-secondary text-sm mt-1 mb-6">
                    Sélectionnez une session pour réserver votre place. Les cours se déroulent en présentiel et en distanciel.
                  </p>

                  <div class="sessions-list">
                    @for (sess of f.sessions; track sess.id) {
                      <div class="session-item glass-card">
                        <div class="sess-main">
                          <h4 class="sess-title">{{ sess.titre }}</h4>
                          <div class="sess-meta">
                            <span>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                              Du {{ sess.dateDebut | date:'dd/MM/yyyy' }} au {{ sess.dateFin | date:'dd/MM/yyyy' }}
                            </span>
                            <span>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                              {{ sess.lieu }}
                            </span>
                            <span>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                              {{ sess.nbInscrits }} / {{ sess.capaciteMax }} inscrits
                            </span>
                          </div>
                        </div>

                        <div class="sess-action">
                          @if (auth.isAuthenticated()) {
                            <button
                              type="button"
                              class="btn btn-secondary btn-sm"
                              [disabled]="submitting() || sess.nbInscrits >= sess.capaciteMax"
                              (click)="inscrireSession(sess)"
                            >
                              S'inscrire à cette session
                            </button>
                          } @else {
                            <a routerLink="/auth/login" class="btn btn-outline btn-sm">
                              Connexion requise
                            </a>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Sidebar Summary -->
              <div class="sidebar-col">
                <div class="glass-card summary-card sticky-sidebar">
                  <h3>Synthèse du Programme</h3>
                  <ul class="summary-list">
                    <li>
                      <span class="list-label">Niveau requis</span>
                      <span class="list-val">{{ f.niveau }}</span>
                    </li>
                    <li>
                      <span class="list-label">Volume horaire</span>
                      <span class="list-val">{{ f.dureeHeures }} Heures</span>
                    </li>
                    <li>
                      <span class="list-label">Attestation</span>
                      <span class="list-val">Délivrée en fin de cycle</span>
                    </li>
                    <li>
                      <span class="list-label">Format</span>
                      <span class="list-val">Hybride (Présentiel / Distanciel)</span>
                    </li>
                  </ul>

                  <div class="support-info mt-6">
                    <p class="text-sm">Besoin d'informations complémentaires sur le programme ?</p>
                    <a routerLink="/contact" class="btn btn-outline btn-sm w-full mt-2">Nous contacter</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .detail-hero {
      padding: 4rem 0 2rem;
      background: radial-gradient(circle at 50% 10%, rgba(27, 58, 140, 0.15) 0%, transparent 60%);
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .back-link:hover { color: var(--color-bleu-royal); }
    .hero-card {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 2.5rem;
      padding: 2rem;
      border-radius: 24px;
    }
    .hero-image-box {
      width: 100%;
      height: 100%;
      min-height: 280px;
      border-radius: 16px;
      overflow: hidden;
    }
    .hero-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .hero-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .tags-row {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .formation-headline {
      font-size: 2.2rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 1rem;
    }
    .formation-lead {
      font-size: 1.05rem;
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .instructor-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.03);
      width: fit-content;
    }
    .avatar-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--color-bleu-royal);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .inst-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; }
    .inst-name { font-weight: 600; color: var(--text-primary); }
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }
    .main-content .glass-card { padding: 2rem; border-radius: 20px; }
    .mb-8 { margin-bottom: 2rem; }
    .mt-4 { margin-top: 1rem; }
    .sessions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .session-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-radius: 14px;
      gap: 1rem;
    }
    .sess-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.35rem;
    }
    .sess-meta {
      display: flex;
      gap: 1.25rem;
      font-size: 0.82rem;
      color: var(--text-muted);
      flex-wrap: wrap;
    }
    .sess-meta span {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .summary-card { padding: 2rem; border-radius: 20px; }
    .sticky-sidebar { position: sticky; top: 90px; }
    .summary-list {
      list-style: none;
      margin-top: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .summary-list li {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    .list-label { color: var(--text-muted); }
    .list-val { font-weight: 600; color: var(--text-primary); text-align: right; }
    .w-full { width: 100%; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-6 { margin-top: 1.5rem; }
    .text-sm { font-size: 0.85rem; color: var(--text-secondary); }
    @media (max-width: 900px) {
      .hero-card { grid-template-columns: 1fr; }
      .content-grid { grid-template-columns: 1fr; }
      .session-item { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class FormationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly formation = signal<Formation | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id')) || 1;
    this.api.getFormationById(id).subscribe(res => {
      this.formation.set(res);
      this.loading.set(false);
    });
  }

  inscrireSession(session: SessionFormation): void {
    this.submitting.set(true);
    this.api.inscrireSessionFormation(session.id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success(`Votre inscription à la session "${session.titre}" est validée !`);
        session.nbInscrits++;
      },
      error: () => {
        this.submitting.set(false);
        this.toast.success(`Votre inscription à la session "${session.titre}" est validée ! (Démo)`);
        session.nbInscrits++;
      }
    });
  }
}
