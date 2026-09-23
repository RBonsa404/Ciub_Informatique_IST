import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-actualites-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page-hero">
      <div class="container-app">
        <span class="section-label">Blog & Actualités</span>
        <h1 class="section-title">Actualités du Club</h1>
        <p class="section-subtitle">Restez informés des dernières nouvelles et annonces du Club Informatique.</p>
      </div>
    </section>

    <section class="section-padding">
      <div class="container-app">
        <!-- Filters -->
        <div class="filters">
          <div class="search-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Rechercher une actualité..." class="form-control search-input">
          </div>
          <div class="filter-tags">
            @for (cat of categories; track cat) {
              <button class="filter-tag" [class.active]="selectedCategory === cat" (click)="selectedCategory = cat">
                {{ cat }}
              </button>
            }
          </div>
        </div>

        <!-- Articles Grid -->
        <div class="articles-grid">
          @for (article of articles; track article.id) {
            <article class="article-card glass-card">
              <div class="article-img" [style.background]="article.gradient"></div>
              <div class="article-body">
                <div class="article-meta">
                  <span class="badge badge-primary">{{ article.categorie }}</span>
                  <span class="article-date">{{ article.date }}</span>
                </div>
                <h3 class="article-title">{{ article.titre }}</h3>
                <p class="article-excerpt">{{ article.resume }}</p>
                <div class="article-footer">
                  <div class="article-author">
                    <div class="author-avatar">{{ article.auteur.charAt(0) }}</div>
                    <span>{{ article.auteur }}</span>
                  </div>
                  <a [routerLink]="['/actualites', article.id]" class="article-read-more">
                    Lire →
                  </a>
                </div>
              </div>
            </article>
          }
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
    .filters {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0 1rem;
      max-width: 320px;
      width: 100%;
    }
    .search-box svg {
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .search-input {
      border: none !important;
      background: transparent !important;
      box-shadow: none !important;
      padding: 0.65rem 0 !important;
    }
    .filter-tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .filter-tag {
      padding: 0.4rem 0.85rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .filter-tag:hover, .filter-tag.active {
      background: var(--color-bleu-royal);
      color: #fff;
      border-color: var(--color-bleu-royal);
    }
    :host-context([data-theme="dark"]) .filter-tag:hover,
    :host-context([data-theme="dark"]) .filter-tag.active {
      background: var(--color-amber-tech);
      color: #0F172A;
      border-color: var(--color-amber-tech);
    }
    .articles-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    .article-card {
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .article-img {
      height: 180px;
      border-radius: 16px 16px 0 0;
    }
    .article-body {
      padding: 1.25rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .article-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .article-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .article-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      line-height: 1.3;
    }
    .article-excerpt {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.5;
      flex: 1;
    }
    .article-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }
    .article-author {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .author-avatar {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: var(--accent-gradient);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 700;
    }
    .article-read-more {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-bleu-royal);
      text-decoration: none;
    }
    :host-context([data-theme="dark"]) .article-read-more {
      color: var(--color-amber-tech);
    }
    @media (max-width: 1024px) {
      .articles-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .articles-grid { grid-template-columns: 1fr; }
      .filters { flex-direction: column; align-items: stretch; }
      .search-box { max-width: 100%; }
    }
  `],
})
export class ActualitesList {
  selectedCategory = 'Toutes';
  categories = ['Toutes', 'Web', 'IA', 'Cyber', 'Réseaux', 'Hackathon'];

  articles = [
    { id: 1, titre: 'Lancement du programme de formations 2026-2027', resume: 'Le Club Informatique ouvre les inscriptions pour ses nouvelles formations : Développement Web, IA, Cybersécurité et bien plus.', categorie: 'Web', date: '15 Sept 2026', auteur: 'Koné Moussa', gradient: 'linear-gradient(135deg, #1B3A8C, #2A4FA8)' },
    { id: 2, titre: 'Retour sur le Hackathon IST 2026', resume: "Plus de 50 étudiants ont participé à notre premier hackathon. Découvrez les projets lauréats et les moments forts de l'événement.", categorie: 'Hackathon', date: '10 Sept 2026', auteur: 'Sawadogo Fatima', gradient: 'linear-gradient(135deg, #F5A623, #FFBD4F)' },
    { id: 3, titre: 'Cybersécurité : les bonnes pratiques pour les étudiants', resume: 'Notre formateur en cybersécurité partage les gestes essentiels pour protéger vos données en ligne et vos projets académiques.', categorie: 'Cyber', date: '5 Sept 2026', auteur: 'Traoré Ibrahim', gradient: 'linear-gradient(135deg, #22C55E, #16A34A)' },
    { id: 4, titre: 'Partenariat avec les entreprises tech de Ouagadougou', resume: 'Le club noue de nouveaux partenariats pour offrir des stages et des opportunités professionnelles à ses membres les plus actifs.', categorie: 'Web', date: '1 Sept 2026', auteur: 'Ouédraogo Aminata', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
    { id: 5, titre: "Introduction à l'Intelligence Artificielle", resume: "Découvrez notre nouvelle formation IA : des bases du machine learning aux applications concrètes, en passant par Python et TensorFlow.", categorie: 'IA', date: '28 Août 2026', auteur: 'Compaoré Jean', gradient: 'linear-gradient(135deg, #0EA5E9, #0284C7)' },
    { id: 6, titre: 'Réseau et télécommunications : atelier pratique', resume: "Configuration de routeurs, mise en place de réseaux locaux, notre atelier pratique vous prépare aux défis du terrain.", categorie: 'Réseaux', date: '20 Août 2026', auteur: 'Zongo Michel', gradient: 'linear-gradient(135deg, #F43F5E, #E11D48)' },
  ];
}
