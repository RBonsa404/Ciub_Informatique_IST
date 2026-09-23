import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page-hero">
      <div class="container-app">
        <span class="section-label">À Propos</span>
        <h1 class="section-title">Présentation du Club</h1>
        <p class="section-subtitle">Plus qu'un club, une communauté technologique d'excellence qui construit le numérique de demain.</p>
      </div>
    </section>

    <section class="section-padding">
      <div class="container-app">
        <div class="about-grid">
          <!-- Vision -->
          <div class="about-card glass-card">
            <div class="card-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <h2 class="about-card-title">Notre Vision</h2>
            <p class="about-card-desc">Créer un espace stimulant où les étudiants en informatique peuvent apprendre, collaborer, concevoir des architectures robustes et concrétiser des projets technologiques d'envergure.</p>
          </div>

          <!-- Mission -->
          <div class="about-card glass-card">
            <div class="card-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
            </div>
            <h2 class="about-card-title">Notre Mission</h2>
            <ul class="mission-list">
              <li>Développer des compétences techniques pointues chez les étudiants</li>
              <li>Favoriser l'apprentissage par les pairs et le partage de code</li>
              <li>Encourager la réalisation de projets informatiques open source</li>
              <li>Organiser des sessions et ateliers pratiques intensifs</li>
              <li>Valoriser les réalisations auprès des entreprises partenaires</li>
            </ul>
          </div>

          <!-- Valeurs -->
          <div class="about-card glass-card">
            <div class="card-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5M9 14c-.2-1-.7-1.7-1.5-2.5M6 9a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </div>
            <h2 class="about-card-title">Nos Valeurs</h2>
            <div class="values-grid">
              <span class="value-tag">Partage & Entraide</span>
              <span class="value-tag">Esprit d'équipe</span>
              <span class="value-tag">Créativité</span>
              <span class="value-tag">Innovation</span>
              <span class="value-tag">Excellence technique</span>
              <span class="value-tag">Responsabilité éthique</span>
            </div>
          </div>

          <!-- Esprit du club -->
          <div class="about-card glass-card">
            <div class="card-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h2 class="about-card-title">L'Esprit d'Excellence IST</h2>
            <p class="about-card-desc">Au-delà de la technique, le Club Informatique cultive la curiosité, l'engagement et l'audace pour relever les défis du numérique burkinabè et panafricain.</p>
            <p class="motto-tag">« Ensemble pour le numérique de demain »</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Activités -->
    <section class="section-padding activities-section">
      <div class="container-app text-center">
        <h2 class="section-title">Nos Activités Clés</h2>
        <p class="section-subtitle">Des parcours conçus pour apprendre, expérimenter et monter en compétence.</p>
        
        <div class="activities-grid">
          <div class="activity-card glass-card">
            <div class="activity-icon-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
            </div>
            <h3>Formations & Ateliers</h3>
            <p>Développement Web, Spring Boot, Angular, Cybersécurité, Réseaux et Cloud Computing.</p>
          </div>

          <div class="activity-card glass-card">
            <div class="activity-icon-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <h3>Projets Collaboratifs</h3>
            <p>Conception d'applications réelles en équipes agiles, portfolios et contributions open source.</p>
          </div>

          <div class="activity-card glass-card">
            <div class="activity-icon-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
            <h3>Hackathons & Défis</h3>
            <p>Compétitions de code, Capture The Flag (CTF) et hackathons inter-instituts.</p>
          </div>

          <div class="activity-card glass-card">
            <div class="activity-icon-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
            </div>
            <h3>Ressources Pédagogiques</h3>
            <p>Supports de cours, fiches mémos, devoirs pratiques et replays d'ateliers.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Ambitions -->
    <section class="section-padding">
      <div class="container-app text-center">
        <h2 class="section-title">Nos Ambitions</h2>
        <div class="ambitions-list">
          <div class="ambition-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Développer les talents et compétences techniques
          </div>
          <div class="ambition-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>
            Favoriser l'esprit d'innovation et de recherche
          </div>
          <div class="ambition-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            Concevoir des solutions numériques utiles à la société
          </div>
          <div class="ambition-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            Préparer l'insertion professionnelle des membres
          </div>
        </div>
        <div class="mt-12">
          <a routerLink="/auth/register" class="btn btn-primary btn-lg">Rejoindre l'aventure</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .page-hero {
      padding: 5rem 0 3rem;
      text-align: center;
      background: radial-gradient(circle at 50% 30%, rgba(27, 58, 140, 0.12) 0%, transparent 70%);
    }
    .about-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }
    .about-card {
      padding: 2.25rem;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: transform 0.3s ease, border-color 0.3s ease;
    }
    .about-card:hover {
      transform: translateY(-5px);
      border-color: rgba(27, 58, 140, 0.3);
    }
    [data-theme="dark"] .about-card:hover {
      border-color: rgba(245, 166, 35, 0.3);
    }
    .card-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(27, 58, 140, 0.08);
      color: var(--color-bleu-royal);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    [data-theme="dark"] .card-icon-box {
      background: rgba(245, 166, 35, 0.12);
      color: var(--color-amber-tech);
    }
    .about-card-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .about-card-desc {
      font-size: 0.92rem;
      color: var(--text-secondary);
      line-height: 1.65;
    }
    .mission-list {
      padding-left: 1.25rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.7;
    }
    .values-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }
    .value-tag {
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      background: rgba(27, 58, 140, 0.08);
      color: var(--color-bleu-royal);
      font-size: 0.82rem;
      font-weight: 600;
      border: 1px solid rgba(27, 58, 140, 0.15);
    }
    [data-theme="dark"] .value-tag {
      background: rgba(245, 166, 35, 0.12);
      color: var(--color-amber-tech);
      border-color: rgba(245, 166, 35, 0.2);
    }
    .motto-tag {
      font-style: italic;
      color: var(--color-amber-tech);
      font-weight: 600;
      margin-top: 0.5rem;
    }
    .activities-section {
      background: var(--bg-secondary);
    }
    .activities-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-top: 2.5rem;
    }
    .activity-card {
      padding: 2rem 1.5rem;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      transition: transform 0.3s ease;
    }
    .activity-card:hover {
      transform: translateY(-5px);
    }
    .activity-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: rgba(27, 58, 140, 0.08);
      color: var(--color-bleu-royal);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }
    [data-theme="dark"] .activity-icon-wrap {
      background: rgba(245, 166, 35, 0.12);
      color: var(--color-amber-tech);
    }
    .activity-card h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .activity-card p {
      font-size: 0.88rem;
      color: var(--text-secondary);
      line-height: 1.55;
    }
    .ambitions-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
      max-width: 900px;
      margin: 2.5rem auto 0;
    }
    .ambition-item {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.75rem 1.25rem;
      border-radius: 14px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow: var(--shadow-sm);
    }
    .ambition-item svg {
      color: var(--color-amber-tech);
    }
    .mt-12 { margin-top: 3rem; }
    .text-center { text-align: center; }
    @media (max-width: 1024px) {
      .activities-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .about-grid { grid-template-columns: 1fr; }
      .activities-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class About {}
export { About as AboutComponent };
