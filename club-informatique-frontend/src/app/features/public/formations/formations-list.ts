import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Formation, PageResponse } from '../../../core/models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-formations-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent],
  template: `
    <div class="formations-page">
      <!-- Header -->
      <section class="page-header">
        <div class="container-app text-center">
          <span class="section-label">Parcours & Compétences</span>
          <h1 class="page-title">Catalogue des Formations</h1>
          <p class="page-subtitle">
            Développez vos compétences techniques sur des stacks modernes encadrées par des formateurs pairs et des professionnels certifiés.
          </p>

          <!-- Level Filter Pills -->
          <div class="filter-pills">
            <button
              type="button"
              class="pill-filter"
              [class.active]="selectedNiveau() === ''"
              (click)="filterNiveau('')"
            >
              Toutes les formations
            </button>
            <button
              type="button"
              class="pill-filter"
              [class.active]="selectedNiveau() === 'DEBUTANT'"
              (click)="filterNiveau('DEBUTANT')"
            >
              Débutant
            </button>
            <button
              type="button"
              class="pill-filter"
              [class.active]="selectedNiveau() === 'INTERMEDIAIRE'"
              (click)="filterNiveau('INTERMEDIAIRE')"
            >
              Intermédiaire
            </button>
            <button
              type="button"
              class="pill-filter"
              [class.active]="selectedNiveau() === 'AVANCE'"
              (click)="filterNiveau('AVANCE')"
            >
              Avancé
            </button>
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
              @for (f of formations()?.content; track f.id) {
                <div class="glass-card formation-card">
                  <div class="card-img-wrap">
                    <img [src]="f.imageUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80'" [alt]="f.titre" class="card-img" />
                    <span class="level-badge" [class]="'level-' + f.niveau.toLowerCase()">
                      {{ f.niveau }}
                    </span>
                  </div>

                  <div class="card-body">
                    <div class="duration-meta">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {{ f.dureeHeures }} Heures de formation
                    </div>

                    <h3 class="card-title">
                      <a [routerLink]="['/formations', f.id]">{{ f.titre }}</a>
                    </h3>

                    <p class="card-desc">{{ f.description }}</p>

                    <div class="card-footer">
                      <div class="trainer-info">
                        <div class="trainer-avatar">
                          {{ f.formateur.prenom[0] }}{{ f.formateur.nom[0] }}
                        </div>
                        <span class="trainer-name">{{ f.formateur.prenom }} {{ f.formateur.nom }}</span>
                      </div>

                      <a [routerLink]="['/formations', f.id]" class="btn btn-primary btn-sm">
                        Découvrir
                      </a>
                    </div>
                  </div>
                </div>
              }
            </div>

            @if (formations() && formations()!.totalPages > 1) {
              <app-pagination
                [currentPage]="currentPage"
                [totalPages]="formations()!.totalPages"
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
      margin: 0 auto 2rem;
      font-size: 1.15rem;
      color: var(--text-secondary);
    }
    .filter-pills {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .pill-filter {
      padding: 0.5rem 1.25rem;
      border-radius: 9999px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pill-filter:hover {
      border-color: var(--color-bleu-royal);
      color: var(--color-bleu-royal);
    }
    .pill-filter.active {
      background: var(--color-bleu-royal);
      color: #fff;
      border-color: var(--color-bleu-royal);
    }
    [data-theme="dark"] .pill-filter.active {
      background: var(--color-amber-tech);
      color: #0F172A;
      border-color: var(--color-amber-tech);
    }
    .grid-layout {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 2rem;
    }
    .formation-card {
      overflow: hidden;
      padding: 0;
      display: flex;
      flex-direction: column;
      border-radius: 20px;
    }
    .card-img-wrap {
      position: relative;
      width: 100%;
      height: 220px;
      background: var(--bg-card);
      overflow: hidden;
    }
    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .formation-card:hover .card-img {
      transform: scale(1.05);
    }
    .level-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .level-debutant { background: rgba(34, 197, 94, 0.9); color: #fff; }
    .level-intermediaire { background: rgba(245, 166, 35, 0.9); color: #0F172A; }
    .level-avance { background: rgba(239, 68, 68, 0.9); color: #fff; }
    .card-body {
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .duration-meta {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }
    .card-title {
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1.35;
      margin-bottom: 0.75rem;
    }
    .card-title a { color: var(--text-primary); }
    .card-title a:hover { color: var(--color-bleu-royal); }
    [data-theme="dark"] .card-title a:hover { color: var(--color-amber-tech); }
    .card-desc {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 1.5rem;
      flex: 1;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
    }
    .trainer-info {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .trainer-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(27, 58, 140, 0.15);
      color: var(--color-bleu-royal);
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    [data-theme="dark"] .trainer-avatar {
      background: rgba(245, 166, 35, 0.2);
      color: var(--color-amber-tech);
    }
    .trainer-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .skeleton-card { height: 380px; padding: 0; overflow: hidden; }
    .img-sk { height: 200px; width: 100%; border-radius: 0; }
    .skeleton-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .title-sk { height: 24px; width: 75%; }
    .line-sk { height: 16px; width: 100%; }
    .text-center { text-align: center; }
  `]
})
export class FormationsListComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly formations = signal<PageResponse<Formation> | null>(null);
  readonly loading = signal(true);
  readonly selectedNiveau = signal<string>('');
  currentPage = 0;

  ngOnInit(): void {
    this.loadFormations(this.currentPage);
  }

  loadFormations(page: number): void {
    this.loading.set(true);
    this.currentPage = page;
    const niveau = this.selectedNiveau() || undefined;
    this.api.getFormations(page, 9, niveau).subscribe(res => {
      this.formations.set(res);
      this.loading.set(false);
    });
  }

  filterNiveau(niveau: string): void {
    this.selectedNiveau.set(niveau);
    this.loadFormations(0);
  }

  onPageChange(page: number): void {
    this.loadFormations(page);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }
}
