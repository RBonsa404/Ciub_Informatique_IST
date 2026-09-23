import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Projet, PageResponse } from '../../../core/models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { BadgeComponent } from '../../../shared/components/badge/badge';

@Component({
  selector: 'app-projets-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent, BadgeComponent],
  template: `
    <div class="projets-page">
      <!-- Header -->
      <section class="page-header">
        <div class="container-app text-center">
          <span class="section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            Innovation & Réalisations
          </span>
          <h1 class="page-title">Galerie des Projets</h1>
          <p class="page-subtitle">
            Découvrez les initiatives technologiques, applications open source et prototypes développés par les étudiants membres du Club Informatique IST.
          </p>

          <div class="header-cta mt-4">
            <a routerLink="/membre/proposer-projet" class="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Proposer un projet
            </a>
          </div>
        </div>
      </section>

      <!-- Content -->
      <section class="section-padding">
        <div class="container-app">
          @if (loading()) {
            <div class="grid-layout">
              @for (i of [1,2,3]; track i) {
                <div class="glass-card skeleton-card">
                  <div class="skeleton img-sk"></div>
                  <div class="skeleton-content">
                    <div class="skeleton title-sk"></div>
                    <div class="skeleton line-sk"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (projets()?.content && projets()!.content.length > 0) {
            <div class="grid-layout">
              @for (p of projets()?.content; track p.id) {
                <div class="glass-card project-card">
                  <div class="img-wrap">
                    <img [src]="p.imageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'" [alt]="p.titre" class="project-img" />
                    <div class="badge-overlay">
                      <app-badge
                        [type]="p.statut === 'TERMINE' ? 'termine' : p.statut === 'EN_COURS' ? 'en_cours' : 'propose'"
                        [label]="p.statut === 'EN_COURS' ? 'En Cours' : p.statut === 'TERMINE' ? 'Terminé' : p.statut"
                      />
                    </div>
                  </div>

                  <div class="project-body">
                    <!-- Progress bar -->
                    <div class="progress-container">
                      <div class="progress-label">
                        <span>Avancement</span>
                        <span class="pct-val">{{ p.avancement }}%</span>
                      </div>
                      <div class="progress-bar-bg">
                        <div class="progress-bar-fill" [style.width.%]="p.avancement"></div>
                      </div>
                    </div>

                    <h3 class="project-title">
                      <a [routerLink]="['/projets', p.id]">{{ p.titre }}</a>
                    </h3>

                    <p class="project-desc">{{ p.description }}</p>

                    @if (p.technologies) {
                      <div class="tech-tags">
                        @for (tech of p.technologies.split(','); track tech) {
                          <span class="tech-tag">{{ tech.trim() }}</span>
                        }
                      </div>
                    }

                    <div class="project-footer">
                      <div class="porteur-info">
                        <div class="porteur-avatar">
                          {{ p.porteur.prenom[0] }}{{ p.porteur.nom[0] }}
                        </div>
                        <span class="author-label">{{ p.porteur.prenom }} {{ p.porteur.nom }}</span>
                      </div>
                      <a [routerLink]="['/projets', p.id]" class="btn btn-outline btn-sm">
                        Explorer
                      </a>
                    </div>
                  </div>
                </div>
              }
            </div>

            @if (projets() && projets()!.totalPages > 1) {
              <app-pagination
                [currentPage]="currentPage"
                [totalPages]="projets()!.totalPages"
                (pageChanged)="onPageChange($event)"
              />
            }
          } @else {
            <div class="empty-projects glass-card text-center">
              <div class="empty-icon-wrap">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              </div>
              <h2>Aucun projet publié pour le moment</h2>
              <p>
                Vous avez une idée d'application, de solution d'automatisation ou de projet open source ? Proposez-la au club pour former une équipe !
              </p>
              <a routerLink="/membre/proposer-projet" class="btn btn-primary">
                Proposer le premier projet
              </a>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page-header {
      padding: 5rem 0 3rem;
      background: radial-gradient(circle at 50% 25%, rgba(27, 58, 140, 0.15) 0%, transparent 70%);
    }
    .page-title {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 1.25rem;
    }
    .page-subtitle {
      max-width: 650px;
      margin: 0 auto 1.5rem;
      font-size: 1.15rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }
    .grid-layout {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 2rem;
    }
    .project-card {
      overflow: hidden;
      padding: 0;
      display: flex;
      flex-direction: column;
      border-radius: 22px;
      border: 1px solid var(--border-color);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .project-card:hover {
      transform: translateY(-7px);
      border-color: rgba(27, 58, 140, 0.35);
      box-shadow: 0 16px 36px rgba(27, 58, 140, 0.12);
    }
    [data-theme="dark"] .project-card:hover {
      border-color: rgba(245, 166, 35, 0.35);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
    }
    .img-wrap {
      position: relative;
      width: 100%;
      height: 220px;
      background: var(--bg-card);
      overflow: hidden;
    }
    .project-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .project-card:hover .project-img {
      transform: scale(1.05);
    }
    .badge-overlay {
      position: absolute;
      top: 1rem;
      right: 1rem;
      backdrop-filter: blur(8px);
    }
    .project-body {
      padding: 1.75rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .progress-container {
      margin-bottom: 1.25rem;
    }
    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 0.4rem;
    }
    .pct-val {
      color: var(--color-bleu-royal);
      font-weight: 700;
    }
    [data-theme="dark"] .pct-val {
      color: var(--color-amber-tech);
    }
    .progress-bar-bg {
      height: 8px;
      background: rgba(0, 0, 0, 0.06);
      border-radius: 9999px;
      overflow: hidden;
    }
    [data-theme="dark"] .progress-bar-bg {
      background: rgba(255, 255, 255, 0.08);
    }
    .progress-bar-fill {
      height: 100%;
      background: var(--accent-gradient);
      border-radius: 9999px;
      transition: width 0.6s ease;
    }
    .project-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.6rem;
      line-height: 1.35;
    }
    .project-title a {
      color: var(--text-primary);
    }
    .project-title a:hover {
      color: var(--color-bleu-royal);
    }
    [data-theme="dark"] .project-title a:hover {
      color: var(--color-amber-tech);
    }
    .project-desc {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 1.25rem;
      flex: 1;
    }
    .tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 1.5rem;
    }
    .tech-tag {
      font-size: 0.75rem;
      padding: 0.25rem 0.65rem;
      border-radius: 8px;
      background: rgba(27, 58, 140, 0.06);
      color: var(--color-bleu-royal);
      font-weight: 600;
      font-family: var(--font-mono);
      border: 1px solid rgba(27, 58, 140, 0.12);
    }
    [data-theme="dark"] .tech-tag {
      background: rgba(245, 166, 35, 0.08);
      color: var(--color-amber-tech);
      border-color: rgba(245, 166, 35, 0.2);
    }
    .project-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
    }
    .porteur-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .porteur-avatar {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: var(--accent-gradient);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .author-label {
      font-size: 0.82rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .empty-projects {
      max-width: 620px;
      margin: 2rem auto;
      padding: 3.5rem 2rem;
      border-radius: 24px;
      border: 1.5px dashed var(--border-color);
    }
    .empty-icon-wrap {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: rgba(27, 58, 140, 0.08);
      color: var(--color-bleu-royal);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }
    [data-theme="dark"] .empty-icon-wrap {
      background: rgba(245, 166, 35, 0.12);
      color: var(--color-amber-tech);
    }
    .empty-projects h2 {
      font-size: 1.45rem;
      font-weight: 800;
      margin-bottom: 0.75rem;
    }
    .empty-projects p {
      color: var(--text-secondary);
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .skeleton-card { height: 420px; padding: 0; overflow: hidden; }
    .img-sk { height: 220px; width: 100%; border-radius: 0; }
    .skeleton-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .title-sk { height: 24px; width: 75%; }
    .line-sk { height: 16px; width: 100%; }
    .mt-4 { margin-top: 1rem; }
    .text-center { text-align: center; }
    @media (max-width: 768px) {
      .grid-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class ProjetsListComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly projets = signal<PageResponse<Projet> | null>(null);
  readonly loading = signal(true);
  currentPage = 0;

  ngOnInit(): void {
    this.loadProjets(this.currentPage);
  }

  loadProjets(page: number): void {
    this.loading.set(true);
    this.currentPage = page;
    this.api.getProjets(page, 9).subscribe(res => {
      this.projets.set(res);
      this.loading.set(false);
    });
  }

  onPageChange(page: number): void {
    this.loadProjets(page);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }
}
