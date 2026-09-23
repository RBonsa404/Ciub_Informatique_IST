import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cgu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="legal-page section-padding">
      <div class="container-app">
        <div class="legal-content glass-card">
          <span class="section-label">Mentions Légales & Cadre</span>
          <h1 class="legal-title">Conditions Générales d'Utilisation (CGU)</h1>
          <p class="updated-date">Dernière mise à jour : 23 Septembre 2026</p>

          <section class="legal-sec">
            <h2>1. Objet de la plateforme</h2>
            <p>
              La plateforme web du Club Informatique de l'Institut Supérieur de Technologie (IST) a pour vocation de faciliter la gestion des activités du club, l'inscription aux formations, la diffusion d'actualités et d'événements, ainsi que la valorisation des projets techniques menés par la communauté estudiantine.
            </p>
          </section>

          <section class="legal-sec">
            <h2>2. Accès aux services</h2>
            <p>
              L'accès à la plateforme est ouvert à titre informatif à tout visiteur. Certaines fonctionnalités avancées (inscription aux sessions de formation, soumission de projets, consultation des devoirs, accès aux ressources privées) nécessitent la création d'un compte membre validé.
            </p>
          </section>

          <section class="legal-sec">
            <h2>3. Engagements et Comportement des membres</h2>
            <p>
              Tout membre s'engage à respecter les principes éthiques de l'IST, à ne pas utiliser les ressources informatiques mises à disposition à des fins illégales ou malveillantes (attaques par déni de service, tentatives de piratage, diffamation), et à veiller à la confidentialité de ses identifiants de connexion.
            </p>
          </section>

          <section class="legal-sec">
            <h2>4. Propriété intellectuelle</h2>
            <p>
              Les supports de formation, logos, marques et codes sources publiés sur la plateforme demeurent la propriété intellectuelle de leurs auteurs respectifs ou du Club Informatique de l'IST, sauf mention expresse de licence open-source (MIT, Apache 2.0).
            </p>
          </section>

          <section class="legal-sec">
            <h2>5. Contact</h2>
            <p>
              Pour toute question relative aux présentes conditions, vous pouvez contacter le Bureau Exécutif via la page de contact ou à l'adresse officielle : <a href="mailto:contact@clubinfo-ist.bf">contact@clubinfo-ist.bf</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .legal-page { padding: 5rem 0; }
    .legal-content {
      max-width: 860px;
      margin: 0 auto;
      padding: 3rem;
      border-radius: 24px;
    }
    .legal-title {
      font-size: 2.5rem;
      margin: 1rem 0 0.5rem;
    }
    .updated-date {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 2.5rem;
    }
    .legal-sec {
      margin-bottom: 2rem;
    }
    .legal-sec h2 {
      font-size: 1.35rem;
      margin-bottom: 0.75rem;
      color: var(--text-primary);
    }
    .legal-sec p {
      color: var(--text-secondary);
      line-height: 1.7;
    }
    @media (max-width: 768px) {
      .legal-content { padding: 1.5rem; }
      .legal-title { font-size: 1.8rem; }
    }
  `]
})
export class CguComponent {}
