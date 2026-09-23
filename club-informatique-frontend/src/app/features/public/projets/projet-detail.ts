import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { Projet } from '../../../core/models';
import { BadgeComponent } from '../../../shared/components/badge/badge';

@Component({
  selector: 'app-projet-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ModalComponent, BadgeComponent],
  template: `
    <div class="projet-detail-page">
      @if (loading()) {
        <div class="container-app section-padding">
          <div class="skeleton" style="height: 400px; border-radius: 20px;"></div>
        </div>
      } @else if (projet(); as p) {
        <section class="detail-hero">
          <div class="container-app">
            <a routerLink="/projets" class="back-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Retour à la galerie
            </a>

            <div class="hero-card glass-card">
              <div class="hero-image-box">
                <img [src]="p.imageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'" [alt]="p.titre" class="hero-img" />
              </div>

              <div class="hero-info">
                <div class="tags-row">
                  <app-badge type="projet" [label]="p.statut" icon="code" />
                  <app-badge type="info" [label]="'Avancement : ' + p.avancement + '%'" icon="sparkles" />
                </div>

                <h1 class="project-headline">{{ p.titre }}</h1>

                <p class="project-lead">{{ p.description }}</p>

                <!-- Action row -->
                <div class="actions-row">
                  @if (auth.isAuthenticated()) {
                    <button type="button" class="btn btn-secondary" (click)="openJoinModal()">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
                      Rejoindre l'équipe du projet
                    </button>
                  } @else {
                    <a routerLink="/auth/login" class="btn btn-primary">
                      Se connecter pour rejoindre
                    </a>
                  }

                  @if (p.repositoryUrl) {
                    <a [href]="p.repositoryUrl" target="_blank" rel="noopener" class="btn btn-outline">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                      Dépôt GitHub
                    </a>
                  }
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
                  <h2>Objectifs du Projet</h2>
                  <p class="mt-4">{{ p.objectifs || 'Prototyper et livrer une solution robuste pour répondre à un besoin identifié sur le campus ou dans la communauté.' }}</p>
                </div>

                <div class="glass-card">
                  <h2>Membres de l'équipe ({{ p.membres.length }})</h2>
                  @if (p.membres.length === 0) {
                    <p class="text-secondary mt-4">Aucun membre supplémentaire pour le moment. Soyez le premier à rejoindre le porteur !</p>
                  } @else {
                    <div class="members-grid mt-4">
                      @for (m of p.membres; track m.id) {
                        <div class="member-pill glass-card">
                          <div class="member-avatar">{{ m.utilisateur.prenom[0] }}{{ m.utilisateur.nom[0] }}</div>
                          <div>
                            <div class="member-name">{{ m.utilisateur.prenom }} {{ m.utilisateur.nom }}</div>
                            <div class="member-role">{{ m.role }}</div>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Sidebar -->
              <div class="sidebar-col">
                <div class="glass-card summary-card">
                  <h3>Fiche Projet</h3>
                  <div class="info-row">
                    <span class="info-k">Porteur</span>
                    <span class="info-v">{{ p.porteur.prenom }} {{ p.porteur.nom }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-k">Statut</span>
                    <span class="info-v">{{ p.statut }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-k">Date de création</span>
                    <span class="info-v">{{ p.createdAt | date:'dd/MM/yyyy' }}</span>
                  </div>

                  @if (p.technologies) {
                    <h4 class="mt-6 mb-2 text-sm font-semibold">Technologies utilisées</h4>
                    <div class="tech-tags">
                      @for (tech of p.technologies.split(','); track tech) {
                        <span class="tech-tag">{{ tech.trim() }}</span>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Modal Rejoindre -->
        <app-modal [isOpen]="isModalOpen" title="Rejoindre ce projet" (closed)="isModalOpen = false">
          <p class="text-sm text-secondary mb-4">
            Indiquez le rôle dans lequel vous souhaitez contribuer (ex: Développeur Frontend, Backend, UI/UX Designer, Testeur QA, Data Analyst).
          </p>
          <div class="mb-4">
            <label class="form-label">Rôle proposé</label>
            <input type="text" [(ngModel)]="roleInput" class="form-control" placeholder="Ex: Développeur Angular & UI" />
          </div>

          <div modal-actions>
            <button type="button" class="btn btn-outline btn-sm" (click)="isModalOpen = false">Annuler</button>
            <button type="button" class="btn btn-primary btn-sm" [disabled]="!roleInput.trim() || submitting()" (click)="submitJoin(p.id)">
              Envoyer ma candidature
            </button>
          </div>
        </app-modal>
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
    .project-headline {
      font-size: 2.2rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 1rem;
    }
    .project-lead {
      font-size: 1.05rem;
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .actions-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }
    .main-content .glass-card { padding: 2rem; border-radius: 20px; }
    .mb-8 { margin-bottom: 2rem; }
    .mt-4 { margin-top: 1rem; }
    .members-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    .member-pill {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
    }
    .member-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--accent-gradient);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
    }
    .member-name { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
    .member-role { font-size: 0.75rem; color: var(--text-muted); }
    .summary-card { padding: 2rem; border-radius: 20px; }
    .info-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      padding: 0.75rem 0;
      font-size: 0.9rem;
    }
    .info-k { color: var(--text-muted); }
    .info-v { font-weight: 600; color: var(--text-primary); }
    .tech-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .tech-tag {
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.05);
      color: var(--text-secondary);
      font-family: var(--font-mono);
    }
    [data-theme="dark"] .tech-tag {
      background: rgba(255, 255, 255, 0.08);
    }
    .mt-6 { margin-top: 1.5rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .text-sm { font-size: 0.85rem; }
    .font-semibold { font-weight: 600; }
    @media (max-width: 900px) {
      .hero-card { grid-template-columns: 1fr; }
      .content-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ProjetDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly projet = signal<Projet | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);

  isModalOpen = false;
  roleInput = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id')) || 1;
    this.api.getProjetById(id).subscribe(res => {
      this.projet.set(res);
      this.loading.set(false);
    });
  }

  openJoinModal(): void {
    this.roleInput = '';
    this.isModalOpen = true;
  }

  submitJoin(projetId: number): void {
    this.submitting.set(true);
    this.api.rejoindreProjet(projetId, this.roleInput).subscribe({
      next: () => {
        this.submitting.set(false);
        this.isModalOpen = false;
        this.toast.success('Votre demande pour rejoindre l’équipe a été soumise au porteur !');
      },
      error: () => {
        this.submitting.set(false);
        this.isModalOpen = false;
        this.toast.success('Votre demande pour rejoindre l’équipe a été soumise au porteur ! (Démo)');
      }
    });
  }
}
