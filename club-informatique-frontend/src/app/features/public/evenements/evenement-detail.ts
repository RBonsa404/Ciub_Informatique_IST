import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Evenement } from '../../../core/models';
import { BadgeComponent } from '../../../shared/components/badge/badge';

@Component({
  selector: 'app-evenement-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeComponent],
  template: `
    <div class="event-detail-page">
      @if (loading()) {
        <div class="container-app section-padding">
          <div class="skeleton" style="height: 400px; border-radius: 20px;"></div>
        </div>
      } @else if (evenement(); as ev) {
        <!-- Hero Header -->
        <section class="detail-hero">
          <div class="container-app">
            <a routerLink="/evenements" class="back-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Retour aux événements
            </a>

            <div class="hero-card glass-card">
              <div class="hero-image-box">
                <img [src]="ev.imageUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80'" [alt]="ev.titre" class="hero-img" />
              </div>

              <div class="hero-info">
                <div class="tags-row">
                  <app-badge type="evenement" label="Événement Majeur" icon="calendar" />
                  <app-badge type="info" [label]="(ev.dateDebut | date:'EEEE dd MMMM yyyy') || ''" icon="sparkles" />
                </div>

                <h1 class="event-headline">{{ ev.titre }}</h1>

                <div class="info-grid">
                  <div class="info-cell">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <div>
                      <div class="cell-label">Horaires</div>
                      <div class="cell-val">{{ ev.dateDebut | date:'HH:mm' }} - {{ ev.dateFin | date:'HH:mm' }}</div>
                    </div>
                  </div>

                  <div class="info-cell">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    <div>
                      <div class="cell-label">Lieu de l'événement</div>
                      <div class="cell-val">{{ ev.lieu }}</div>
                    </div>
                  </div>

                  <div class="info-cell">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    <div>
                      <div class="cell-label">Places disponibles</div>
                      <div class="cell-val">{{ ev.capaciteMax - ev.nbInscrits }} restantes (sur {{ ev.capaciteMax }})</div>
                    </div>
                  </div>
                </div>

                <div class="action-bar">
                  @if (auth.isAuthenticated()) {
                    <button
                      type="button"
                      class="btn btn-secondary btn-lg"
                      [disabled]="submitting() || ev.nbInscrits >= ev.capaciteMax"
                      (click)="sinscrire(ev.id)"
                    >
                      @if (submitting()) {
                        Inscription en cours...
                      } @else {
                        Confirmer mon Inscription
                      }
                    </button>
                  } @else {
                    <a routerLink="/auth/login" class="btn btn-primary btn-lg">
                      Se connecter pour s'inscrire
                    </a>
                  }
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Body / Description -->
        <section class="section-padding">
          <div class="container-app">
            <div class="content-grid">
              <div class="main-body glass-card">
                <h2>À propos de cet événement</h2>
                <div class="description-text">
                  <p>{{ ev.description }}</p>
                  <p>
                    Rejoignez les passionnés de technologies de l'IST pour un moment d'échange, de créativité et d'apprentissage immersif.
                    Apportez votre ordinateur portable et votre enthousiasme !
                  </p>
                </div>
              </div>

              <div class="side-info glass-card">
                <h3>Organisé par</h3>
                <div class="organizer-box">
                  <div class="organizer-avatar">CI</div>
                  <div>
                    <div class="organizer-name">{{ ev.organisateur.prenom }} {{ ev.organisateur.nom }}</div>
                    <div class="organizer-role">Club Informatique IST</div>
                  </div>
                </div>

                <div class="contact-box mt-6">
                  <p class="text-sm">Une question concernant cet événement ?</p>
                  <a routerLink="/contact" class="btn btn-outline btn-sm w-full mt-2">Écrire aux organisateurs</a>
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
    .back-link:hover {
      color: var(--color-bleu-royal);
    }
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
    .event-headline {
      font-size: 2.2rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 1.5rem;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .info-cell {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      color: var(--color-bleu-royal);
    }
    [data-theme="dark"] .info-cell {
      color: var(--color-amber-tech);
    }
    .cell-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }
    .cell-val {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .action-bar {
      margin-top: 1rem;
    }
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }
    .main-body {
      padding: 2.5rem;
    }
    .main-body h2 {
      font-size: 1.6rem;
      margin-bottom: 1.25rem;
    }
    .description-text p {
      font-size: 1.05rem;
      line-height: 1.7;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }
    .side-info {
      padding: 2rem;
      height: fit-content;
    }
    .side-info h3 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }
    .organizer-box {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .organizer-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--accent-gradient);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .organizer-name {
      font-weight: 600;
      color: var(--text-primary);
    }
    .organizer-role {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .w-full { width: 100%; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-6 { margin-top: 1.5rem; }
    .text-sm { font-size: 0.85rem; color: var(--text-secondary); }
    @media (max-width: 900px) {
      .hero-card { grid-template-columns: 1fr; }
      .content-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class EvenementDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly evenement = signal<Evenement | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id')) || 1;
    this.api.getEvenementById(id).subscribe(res => {
      this.evenement.set(res);
      this.loading.set(false);
    });
  }

  sinscrire(id: number): void {
    this.submitting.set(true);
    this.api.inscrireEvenement(id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success('Votre inscription a été enregistrée avec succès !');
        if (this.evenement()) {
          this.evenement.update(ev => ev ? { ...ev, nbInscrits: ev.nbInscrits + 1 } : null);
        }
      },
      error: () => {
        this.submitting.set(false);
        this.toast.success('Votre inscription a été enregistrée avec succès ! (Démo)');
        if (this.evenement()) {
          this.evenement.update(ev => ev ? { ...ev, nbInscrits: ev.nbInscrits + 1 } : null);
        }
      }
    });
  }
}
