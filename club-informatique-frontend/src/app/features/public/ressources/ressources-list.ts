import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Ressource, PageResponse } from '../../../core/models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-ressources-list',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <div class="ressources-page">
      <!-- Header -->
      <section class="page-header">
        <div class="container-app text-center">
          <span class="section-label">Documentation & Savoirs</span>
          <h1 class="page-title">Ressources & Supports</h1>
          <p class="page-subtitle">
            Accédez gratuitement aux supports de cours, fiches mémo, enregistrements et tutoriels élaborés par le Club Informatique.
          </p>

          <!-- Type filter pills -->
          <div class="filter-pills">
            <button type="button" class="pill-btn" [class.active]="selectedType() === ''" (click)="filterType('')">Tous</button>
            <button type="button" class="pill-btn" [class.active]="selectedType() === 'PDF'" (click)="filterType('PDF')">PDF / Supports</button>
            <button type="button" class="pill-btn" [class.active]="selectedType() === 'VIDEO'" (click)="filterType('VIDEO')">Vidéos & Replays</button>
            <button type="button" class="pill-btn" [class.active]="selectedType() === 'COURS'" (click)="filterType('COURS')">Cheat Sheets</button>
          </div>
        </div>
      </section>

      <!-- Grid -->
      <section class="section-padding">
        <div class="container-app">
          @if (loading()) {
            <div class="grid-layout">
              @for (i of [1,2,3]; track i) {
                <div class="glass-card skeleton-card">
                  <div class="skeleton title-sk"></div>
                  <div class="skeleton line-sk"></div>
                </div>
              }
            </div>
          } @else {
            <div class="grid-layout">
              @for (r of ressources()?.content; track r.id) {
                <div class="glass-card ressource-card">
                  <div class="res-icon" [class]="'type-' + r.type.toLowerCase()">
                    @switch (r.type) {
                      @case ('PDF') {
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      }
                      @case ('VIDEO') {
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                      }
                      @default {
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      }
                    }
                  </div>

                  <div class="res-body">
                    <span class="type-tag">{{ r.type }}</span>
                    <h3 class="res-title">{{ r.titre }}</h3>
                    <p class="res-desc">{{ r.description }}</p>

                    <div class="res-footer">
                      <span class="res-author">Par {{ r.auteur.prenom }} {{ r.auteur.nom }}</span>
                      <button type="button" class="btn btn-outline btn-sm" (click)="download(r)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Télécharger
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>

            @if (ressources() && ressources()!.totalPages > 1) {
              <app-pagination
                [currentPage]="currentPage"
                [totalPages]="ressources()!.totalPages"
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
    .pill-btn {
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
    .pill-btn:hover { border-color: var(--color-bleu-royal); color: var(--color-bleu-royal); }
    .pill-btn.active {
      background: var(--color-bleu-royal);
      color: #fff;
      border-color: var(--color-bleu-royal);
    }
    [data-theme="dark"] .pill-btn.active {
      background: var(--color-amber-tech);
      color: #0F172A;
      border-color: var(--color-amber-tech);
    }
    .grid-layout {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    .ressource-card {
      padding: 1.5rem;
      border-radius: 18px;
      display: flex;
      gap: 1.25rem;
      align-items: flex-start;
    }
    .res-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .type-pdf { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .type-video { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .type-cours { background: rgba(245, 166, 35, 0.1); color: #f5a623; }
    .res-body { flex: 1; }
    .type-tag {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .res-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0.25rem 0 0.5rem;
      line-height: 1.3;
    }
    .res-desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 1rem;
    }
    .res-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border-color);
      padding-top: 0.75rem;
    }
    .res-author {
      font-size: 0.78rem;
      color: var(--text-muted);
    }
    .skeleton-card { height: 160px; }
    .title-sk { height: 20px; width: 60%; margin-bottom: 1rem; }
    .line-sk { height: 14px; width: 90%; }
    .text-center { text-align: center; }
  `]
})
export class RessourcesListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly ressources = signal<PageResponse<Ressource> | null>(null);
  readonly loading = signal(true);
  readonly selectedType = signal<string>('');
  currentPage = 0;

  ngOnInit(): void {
    this.loadRessources(this.currentPage);
  }

  loadRessources(page: number): void {
    this.loading.set(true);
    this.currentPage = page;
    const type = this.selectedType() || undefined;
    this.api.getRessources(page, 12, type).subscribe(res => {
      this.ressources.set(res);
      this.loading.set(false);
    });
  }

  filterType(type: string): void {
    this.selectedType.set(type);
    this.loadRessources(0);
  }

  onPageChange(page: number): void {
    this.loadRessources(page);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

  download(r: Ressource): void {
    this.toast.info(`Téléchargement de "${r.titre}" démarré...`);
  }
}
