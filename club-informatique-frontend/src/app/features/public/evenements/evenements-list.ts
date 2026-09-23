import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Evenement, PageResponse } from '../../../core/models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-evenements-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent],
  template: `
    <div class="evenements-page">
      <!-- Header -->
      <section class="page-header">
        <div class="container-app text-center">
          <span class="section-label">Agenda & Rencontres</span>
          <h1 class="page-title">Événements du Club</h1>
          <p class="page-subtitle">
            Participez aux hackathons, conférences, masterclasses et workshops organisés tout au long de l'année universitaire.
          </p>
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
                    <div class="skeleton line-sk"></div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="grid-layout">
              @for (ev of evenements()?.content; track ev.id) {
                <div class="glass-card event-card">
                  <div class="event-image-wrap">
                    <img [src]="ev.imageUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80'" [alt]="ev.titre" class="event-image" />
                    <span class="date-badge">
                      {{ ev.dateDebut | date:'dd MMM yyyy' }}
                    </span>
                  </div>
                  <div class="event-body">
                    <div class="event-meta">
                      <span class="meta-item">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {{ ev.lieu }}
                      </span>
                      <span class="meta-item">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        {{ ev.nbInscrits }} / {{ ev.capaciteMax }} inscrits
                      </span>
                    </div>

                    <h3 class="event-title">
                      <a [routerLink]="['/evenements', ev.id]">{{ ev.titre }}</a>
                    </h3>

                    <p class="event-desc">{{ ev.description }}</p>

                    <div class="event-footer">
                      <a [routerLink]="['/evenements', ev.id]" class="btn btn-outline btn-sm">
                        Détails & Inscription
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </a>
                    </div>
                  </div>
                </div>
              }
            </div>

            @if (evenements() && evenements()!.totalPages > 1) {
              <app-pagination
                [currentPage]="currentPage"
                [totalPages]="evenements()!.totalPages"
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
      margin: 0 auto;
      font-size: 1.15rem;
      color: var(--text-secondary);
    }
    .grid-layout {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 2rem;
    }
    .event-card {
      overflow: hidden;
      padding: 0;
      display: flex;
      flex-direction: column;
      border-radius: 20px;
    }
    .event-image-wrap {
      position: relative;
      width: 100%;
      height: 220px;
      background: var(--bg-card);
      overflow: hidden;
    }
    .event-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .event-card:hover .event-image {
      transform: scale(1.05);
    }
    .date-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(10, 14, 26, 0.85);
      backdrop-filter: blur(8px);
      color: var(--color-amber-tech);
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      border: 1px solid rgba(245, 166, 35, 0.3);
    }
    .event-body {
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .event-meta {
      display: flex;
      gap: 1.25rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.85rem;
      flex-wrap: wrap;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .event-title {
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1.35;
      margin-bottom: 0.75rem;
    }
    .event-title a {
      color: var(--text-primary);
    }
    .event-title a:hover {
      color: var(--color-bleu-royal);
    }
    [data-theme="dark"] .event-title a:hover {
      color: var(--color-amber-tech);
    }
    .event-desc {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 1.5rem;
      flex: 1;
    }
    .event-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
    }
    .skeleton-card {
      height: 380px;
      padding: 0;
      overflow: hidden;
    }
    .img-sk { height: 200px; width: 100%; border-radius: 0; }
    .skeleton-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .title-sk { height: 24px; width: 75%; }
    .line-sk { height: 16px; width: 100%; }
    .text-center { text-align: center; }
  `]
})
export class EvenementsListComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly evenements = signal<PageResponse<Evenement> | null>(null);
  readonly loading = signal(true);
  currentPage = 0;

  ngOnInit(): void {
    this.loadEvents(this.currentPage);
  }

  loadEvents(page: number): void {
    this.loading.set(true);
    this.currentPage = page;
    this.api.getEvenements(page, 9, false).subscribe(res => {
      this.evenements.set(res);
      this.loading.set(false);
    });
  }

  onPageChange(page: number): void {
    this.loadEvents(page);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }
}
