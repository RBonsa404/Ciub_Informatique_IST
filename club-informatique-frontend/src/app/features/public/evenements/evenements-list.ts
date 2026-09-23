import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Evenement, PageResponse } from '../../../core/models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { BadgeComponent } from '../../../shared/components/badge/badge';

@Component({
  selector: 'app-evenements-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent, BadgeComponent],
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
          } @else if (evenements()?.content && evenements()!.content.length > 0) {
            <div class="grid-layout">
              @for (ev of evenements()?.content; track ev.id) {
                <div class="glass-card event-card">
                  <div class="event-image-wrap">
                    <img [src]="ev.imageUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80'" [alt]="ev.titre" class="event-image" />
                    <div class="date-badge-wrap">
                      <app-badge type="evenement" [label]="(ev.dateDebut | date:'dd MMM yyyy') || ''" icon="calendar" />
                    </div>
                  </div>
                  <div class="event-body">
                    <div class="event-meta">
                      <span class="meta-item">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        {{ ev.lieu }}
                      </span>
                      <span class="meta-item">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
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
          } @else {
            <div class="events-empty-state glass-card text-center">
              <div class="empty-icon-box">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </div>
              <h2>Aucun événement planifié pour le moment</h2>
              <p>
                Le calendrier des hackathons, conférences tech et meetups de la saison est en cours de validation par le bureau exécutif.
              </p>
              <div class="empty-actions">
                <a routerLink="/auth/register" class="btn btn-primary">
                  Rejoindre le club
                </a>
                <a routerLink="/contact" class="btn btn-outline">
                  Proposer un événement
                </a>
              </div>
            </div>
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
      border: 1px solid var(--border-color);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s;
    }
    .event-card:hover {
      transform: translateY(-6px);
      border-color: rgba(245, 166, 35, 0.4);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.2);
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
      transition: transform 0.5s ease;
    }
    .event-card:hover .event-image {
      transform: scale(1.06);
    }
    .date-badge-wrap {
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 2;
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
      gap: 0.4rem;
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
    .events-empty-state {
      max-width: 650px;
      margin: 2rem auto;
      padding: 3.5rem 2rem;
      border-radius: 24px;
      border: 1.5px dashed var(--border-color);
      background: var(--bg-card);
    }
    .empty-icon-box {
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
    [data-theme="dark"] .empty-icon-box {
      background: rgba(245, 166, 35, 0.12);
      color: var(--color-amber-tech);
    }
    .events-empty-state h2 {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 0.75rem;
    }
    .events-empty-state p {
      color: var(--text-secondary);
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .empty-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
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

