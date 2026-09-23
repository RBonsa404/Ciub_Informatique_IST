import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Actualite } from '../../../core/models';

@Component({
  selector: 'app-actualites-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="actu-detail-page">
      @if (loading()) {
        <div class="container-app section-padding">
          <div class="skeleton" style="height: 400px; border-radius: 20px;"></div>
        </div>
      } @else if (actualite(); as a) {
        <section class="detail-hero">
          <div class="container-app">
            <a routerLink="/actualites" class="back-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
              Retour aux actualités
            </a>

            <div class="hero-header text-center">
              <span class="badge badge-amber">Communiqué Officiel</span>
              <h1 class="hero-title mt-4">{{ a.titre }}</h1>
              <div class="meta-row mt-3">
                <span>Par {{ a.auteur.prenom }} {{ a.auteur.nom }}</span>
                <span>•</span>
                <span>{{ a.createdAt | date:'dd MMMM yyyy' }}</span>
              </div>
            </div>

            <div class="hero-img-box mt-6 glass-card">
              <img [src]="a.imageUrl || 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80'" [alt]="a.titre" class="cover-img" />
            </div>
          </div>
        </section>

        <section class="section-padding">
          <div class="container-app">
            <div class="content-box glass-card">
              <div class="lead-text">{{ a.resume }}</div>
              <div class="body-text mt-6">
                <p>{{ a.contenu }}</p>
              </div>

              <div class="share-box mt-8">
                <span class="text-sm font-semibold">Partager cet article :</span>
                <div class="share-btns">
                  <a href="#" class="btn btn-outline btn-sm">WhatsApp</a>
                  <a href="#" class="btn btn-outline btn-sm">LinkedIn</a>
                  <a href="#" class="btn btn-outline btn-sm">Twitter / X</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .detail-hero { padding: 4rem 0 2rem; background: radial-gradient(circle at 50% 20%, rgba(27, 58, 140, 0.1) 0%, transparent 60%); }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); margin-bottom: 2rem; }
    .back-link:hover { color: var(--color-bleu-royal); }
    .hero-title { font-size: 2.8rem; font-weight: 800; max-width: 900px; margin: 0 auto; line-height: 1.2; }
    .meta-row { display: flex; justify-content: center; gap: 0.75rem; color: var(--text-muted); font-size: 0.9rem; }
    .hero-img-box { max-width: 960px; height: 420px; margin: 2rem auto 0; overflow: hidden; border-radius: 24px; padding: 0; }
    .cover-img { width: 100%; height: 100%; object-fit: cover; }
    .content-box { max-width: 860px; margin: 0 auto; padding: 3rem; border-radius: 24px; }
    .lead-text { font-size: 1.25rem; font-weight: 600; line-height: 1.6; color: var(--text-primary); border-left: 4px solid var(--color-amber-tech); padding-left: 1.25rem; }
    .body-text p { font-size: 1.05rem; line-height: 1.8; color: var(--text-secondary); white-space: pre-line; }
    .share-box { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .share-btns { display: flex; gap: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .mt-8 { margin-top: 2rem; }
    .text-center { text-align: center; }
    .font-semibold { font-weight: 600; }
    @media (max-width: 768px) {
      .hero-title { font-size: 1.85rem; }
      .hero-img-box { height: 240px; }
      .content-box { padding: 1.5rem; }
    }
  `]
})
export class ActualitesDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);

  readonly actualite = signal<Actualite | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || 'lancement-annee-academique-2026-hackathon';
    this.api.getActualiteBySlug(slug).subscribe(res => {
      this.actualite.set(res);
      this.loading.set(false);
    });
  }
}
