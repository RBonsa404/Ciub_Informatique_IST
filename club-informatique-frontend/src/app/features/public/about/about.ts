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
        <p class="section-subtitle">Plus qu'un club, une communauté qui construit le numérique de demain.</p>
      </div>
    </section>

    <section class="section-padding">
      <div class="container-app">
        <div class="about-grid">
          <div class="about-card glass-card">
            <h2 class="about-card-title">🎯 Notre Vision</h2>
            <p>Créer un espace où les étudiants peuvent apprendre, partager leurs connaissances, collaborer et développer des projets technologiques.</p>
          </div>
          <div class="about-card glass-card">
            <h2 class="about-card-title">🚀 Notre Mission</h2>
            <ul>
              <li>Développer les compétences techniques des étudiants</li>
              <li>Favoriser l'apprentissage entre pairs</li>
              <li>Encourager la réalisation de projets informatiques</li>
              <li>Organiser des formations et ateliers pratiques</li>
              <li>Créer une communauté informatique active</li>
              <li>Valoriser les projets et compétences des membres</li>
            </ul>
          </div>
          <div class="about-card glass-card">
            <h2 class="about-card-title">💡 Nos Valeurs</h2>
            <div class="values-grid">
              <span class="value-tag">Partage des connaissances</span>
              <span class="value-tag">Esprit d'équipe</span>
              <span class="value-tag">Créativité</span>
              <span class="value-tag">Innovation</span>
              <span class="value-tag">Excellence</span>
              <span class="value-tag">Responsabilité</span>
            </div>
          </div>
          <div class="about-card glass-card">
            <h2 class="about-card-title">🏫 Notre Esprit</h2>
            <p>Au-delà des compétences techniques, le Club Informatique de l'IST, c'est surtout une entraide constante, une collaboration entre étudiants et une communauté technologique dynamique.</p>
            <p style="margin-top:1rem;font-style:italic;color:var(--color-amber-tech)">« Ensemble, plus loin ! »</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section-padding" style="background:var(--bg-secondary)">
      <div class="container-app" style="text-align:center">
        <h2 class="section-title">Nos Activités</h2>
        <p class="section-subtitle" style="margin:0 auto 2rem">Des opportunités pour apprendre, partager et grandir ensemble.</p>
        <div class="activities-grid">
          <div class="activity-card glass-card">
            <span style="font-size:2rem">💻</span>
            <h3>Formations & Ateliers</h3>
            <p>Développement Web, Programmation, Réseaux, Cybersécurité, Electronique...</p>
          </div>
          <div class="activity-card glass-card">
            <span style="font-size:2rem">🚀</span>
            <h3>Projets</h3>
            <p>Développement d'applications, projets collaboratifs, valorisation des réalisations.</p>
          </div>
          <div class="activity-card glass-card">
            <span style="font-size:2rem">🎉</span>
            <h3>Événements</h3>
            <p>Hackathons, conférences, ateliers techniques, rencontres technologiques.</p>
          </div>
          <div class="activity-card glass-card">
            <span style="font-size:2rem">📚</span>
            <h3>Ressources</h3>
            <p>Actualités du club, ressources pédagogiques, devoirs & anciens sujets.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section-padding">
      <div class="container-app" style="text-align:center">
        <h2 class="section-title">Nos Ambitions</h2>
        <div class="ambitions-list">
          <div class="ambition-item"><span>🌟</span> Développer les talents</div>
          <div class="ambition-item"><span>💡</span> Encourager la créativité</div>
          <div class="ambition-item"><span>🔬</span> Favoriser l'innovation</div>
          <div class="ambition-item"><span>🛠️</span> Créer des solutions utiles</div>
          <div class="ambition-item"><span>📈</span> Préparer les compétences de demain</div>
        </div>
        <div style="margin-top:3rem">
          <a routerLink="/auth/register" class="btn btn-primary btn-lg">Rejoindre le club</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .page-hero {
      padding: 4rem 0 3rem;
      background: var(--bg-secondary);
      text-align: center;
    }
    .about-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    .about-card {
      padding: 2rem;
    }
    .about-card-title {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      color: var(--text-primary);
    }
    .about-card p, .about-card li {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.7;
    }
    .about-card ul {
      list-style: none;
      padding: 0;
    }
    .about-card li {
      padding: 0.3rem 0;
      padding-left: 1.2rem;
      position: relative;
    }
    .about-card li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: var(--color-success);
      font-weight: 700;
    }
    .values-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .value-tag {
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;
      background: rgba(27, 58, 140, 0.06);
      color: var(--color-bleu-royal);
    }
    :host-context([data-theme="dark"]) .value-tag {
      background: rgba(245, 166, 35, 0.1);
      color: var(--color-amber-tech);
    }
    .activities-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }
    .activity-card {
      padding: 2rem 1.5rem;
      text-align: center;
    }
    .activity-card h3 {
      font-size: 1rem;
      margin: 0.75rem 0 0.5rem;
      color: var(--text-primary);
    }
    .activity-card p {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .ambitions-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .ambition-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary);
    }
    @media (max-width: 768px) {
      .about-grid, .activities-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class About {}
