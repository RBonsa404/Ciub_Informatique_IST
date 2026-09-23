import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Projet, PageResponse } from '../../../core/models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-projets-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent],
  template: `
    <div class="projets-page">
      <!-- Header -->
      <section class="page-header">
        <div class="container-app text-center">
          <span class="section-label">Innovation & Réalisations</span>
          <h1 class="page-title">Galerie des Projets</h1>
          <p class="page-subtitle">
            Découvrez les projets open-source, applications web/mobiles et prototypes IoT développés par les étudiants membres du Club.
          </p>

          <div class="header-cta mt-4">
            <a routerLink="/membre/proposer-projet" class="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Proposer une idée de projet
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
          } @else {
            <div class="grid-layout">
              @for (p of projets()?.content; track p.id) {
                <div class="glass-card project-card">
                  <div class="img-wrap">
                    <img [src]="p.imageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'" [alt]="p.titre" class="project-img" />
                    <span class="status-badge" [class]="'badge-' + p.statut.toLowerCase()">
                      {{ p.statut === 'EN_COURS' ? 'En Cours' : p.statut === 'TERMINE' ? 'Terminé' : p.statut }}
                    </span>
                  </div>

                  <div class="project-body">
                    <!-- Progress bar -->
                    <div class="progress-container">
                      <div class="progress-label">
                        <span>Avancement</span>
                        <span>{{ p.avancement }}%</span>
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
                      <span class="author-label">Porté par {{ p.porteur.prenom }} {{ p.porteur.nom }}</span>
                      <a [routerLink]="['/projets', p.id]" class="btn btn-outline btn-sm">
                        Voir le projet
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
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page-header {
      padding: 5rem 0 3rem;
      background: radial-gradient(circle at 50% 20%, rgba(27, 58, 140, 0.1) 0%, transparent 70%);
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
      border-radius: 20px;
    }
    .img-wrap {
      position: relative;
      width: 100%;
      height: 220px;
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
    .status-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-en_cours { background: rgba(37, 99, 235, 0.9); color: #fff; }
    .badge-termine { background: rgba(34, 197, 94, 0.9); color: #fff; }
    .badge-propose { background: rgba(245, 166, 35, 0.9); color: #0F172A; }
    .project-body {
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .progress-container {
      margin-bottom: 1rem;
    }
    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .progress-bar-bg {
      height: 6px;
      border-radius: 9999px;
      background: var(--border-color);
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 9999px;
      background: var(--amber-gradient);
    }
    .project-title {
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1.35;
      margin-bottom: 0.75rem;
    }
    .project-title a { color: var(--text-primary); }
    .project-title a:hover { color: var(--color-bleu-royal); }
    [data-theme="dark"] .project-title a:hover { color: var(--color-amber-tech); }
    .project-desc {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 1.25rem;
      flex: 1;
    }
    .tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 1.25rem;
    }
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
      color: var(--text-secondary);
    }
    .project-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
    }
    .author-label {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .skeleton-card { height: 380px; padding: 0; overflow: hidden; }
    .img-sk { height: 200px; width: 100%; border-radius: 0; }
    .skeleton-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .title-sk { height: 24px; width: 75%; }
    .line-sk { height: 16px; width: 100%; }
    .mt-4 { margin-top: 1rem; }
    .text-center { text-align: center; }
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
