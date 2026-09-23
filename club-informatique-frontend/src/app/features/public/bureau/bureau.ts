import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface MembreBureau {
  nom: string;
  role: string;
  filiere: string;
  annee: string;
  initiales: string;
  bio: string;
  linkedin?: string;
  github?: string;
}

@Component({
  selector: 'app-bureau',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bureau-page">
      <!-- Hero -->
      <section class="bureau-hero">
        <div class="container-app text-center">
          <span class="section-label">Gouvernance & Leadership</span>
          <h1 class="hero-title">Le Bureau Exécutif</h1>
          <p class="hero-subtitle">
            Découvrez l'équipe d'étudiants passionnés et dévoués qui anime, coordonne et propulse les initiatives du Club Informatique de l'IST pour le mandat 2026-2027.
          </p>
        </div>
      </section>

      <!-- Membres Grid -->
      <section class="section-padding">
        <div class="container-app">
          <div class="bureau-grid">
            @for (membre of membres; track membre.nom) {
              <div class="glass-card membre-card">
                <div class="card-avatar-wrapper">
                  <div class="initials-avatar">
                    <span class="avatar-text">{{ membre.initiales }}</span>
                  </div>
                  <span class="role-badge">{{ membre.role }}</span>
                </div>
                <div class="card-content">
                  <h3 class="membre-nom">{{ membre.nom }}</h3>
                  <p class="membre-formation">{{ membre.filiere }} — {{ membre.annee }}</p>
                  <p class="membre-bio">{{ membre.bio }}</p>
                  <div class="membre-socials">
                    @if (membre.linkedin) {
                      <a [href]="membre.linkedin" target="_blank" rel="noopener" class="social-btn" aria-label="LinkedIn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                      </a>
                    }
                    @if (membre.github) {
                      <a [href]="membre.github" target="_blank" rel="noopener" class="social-btn" aria-label="GitHub">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                      </a>
                    }
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Join the movement CTA -->
          <div class="glass-card cta-box mt-16 text-center">
            <h2>Vous souhaitez vous investir dans la vie du Club ?</h2>
            <p>Le Club Informatique organise régulièrement des commissions de travail ouvertes à tous les membres.</p>
            <div class="cta-actions">
              <a routerLink="/auth/register" class="btn btn-primary">Rejoindre le Club</a>
              <a routerLink="/contact" class="btn btn-outline">Contacter le Bureau</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .bureau-hero {
      padding: 5rem 0 3rem;
      background: radial-gradient(circle at 50% 30%, rgba(27, 58, 140, 0.12) 0%, transparent 70%);
    }
    .hero-title {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 1.25rem;
    }
    .hero-subtitle {
      max-width: 680px;
      margin: 0 auto;
      font-size: 1.15rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }
    .bureau-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;
    }
    .membre-card {
      overflow: hidden;
      padding: 0;
      display: flex;
      flex-direction: column;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .membre-card:hover {
      transform: translateY(-6px);
      border-color: rgba(245, 166, 35, 0.4);
      box-shadow: 0 15px 35px rgba(27, 58, 140, 0.1);
    }
    [data-theme="dark"] .membre-card:hover {
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
    }
    .card-avatar-wrapper {
      position: relative;
      width: 100%;
      height: 180px;
      background: linear-gradient(135deg, #0A0E1A 0%, #1B3A8C 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .initials-avatar {
      width: 88px;
      height: 88px;
      border-radius: 24px;
      background: linear-gradient(135deg, rgba(245, 166, 35, 0.25), rgba(27, 58, 140, 0.6));
      border: 2px solid rgba(245, 166, 35, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s ease;
    }
    .membre-card:hover .initials-avatar {
      transform: scale(1.08);
      border-color: var(--color-amber-tech);
    }
    .avatar-text {
      font-family: var(--font-poppins);
      font-weight: 800;
      font-size: 2rem;
      color: #FFFFFF;
      letter-spacing: 0.05em;
    }
    .role-badge {
      position: absolute;
      bottom: 0.75rem;
      left: 1rem;
      background: rgba(10, 14, 26, 0.85);
      backdrop-filter: blur(8px);
      color: var(--color-amber-tech);
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.35rem 0.8rem;
      border-radius: 9999px;
      border: 1px solid rgba(245, 166, 35, 0.35);
    }
    .card-content {
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .membre-nom {
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      color: var(--text-primary);
    }
    .membre-formation {
      font-size: 0.85rem;
      color: var(--color-bleu-royal);
      font-weight: 600;
      margin-bottom: 0.85rem;
    }
    [data-theme="dark"] .membre-formation {
      color: var(--color-amber-tech);
    }
    .membre-bio {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.55;
      margin-bottom: 1.25rem;
      flex: 1;
    }
    .membre-socials {
      display: flex;
      gap: 0.5rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
    }
    .social-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      background: rgba(0, 0, 0, 0.04);
      transition: all 0.2s;
    }
    .social-btn:hover {
      color: var(--color-bleu-royal);
      background: rgba(27, 58, 140, 0.1);
      transform: translateY(-2px);
    }
    .cta-box {
      padding: 3rem 2rem;
      margin-top: 4rem;
      border-radius: 20px;
    }
    .cta-box h2 {
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }
    .cta-box p {
      color: var(--text-secondary);
      max-width: 600px;
      margin: 0 auto 1.75rem;
    }
    .cta-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .mt-16 { margin-top: 4rem; }
    .text-center { text-align: center; }
  `]
})
export class BureauComponent {
  readonly membres: MembreBureau[] = [
    {
      nom: 'Moussa Ouédraogo',
      role: 'Président du Club',
      filiere: 'Génie Logiciel',
      annee: 'Master 1',
      initiales: 'MO',
      bio: 'Passionné de Cloud Computing et d’architecture logicielle. Pilote les grandes orientations stratégiques et partenariats du Club.',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com'
    },
    {
      nom: 'Aïcha Sawadogo',
      role: 'Vice-Présidente',
      filiere: 'Systèmes d’Information',
      annee: 'Licence 3',
      initiales: 'AS',
      bio: 'Spécialiste de la gestion de projets agiles et du design UI/UX. Supervise la coordination interne et la vie associative.',
      linkedin: 'https://linkedin.com'
    },
    {
      nom: 'David Compaoré',
      role: 'Responsable Pôle Formations',
      filiere: 'Génie Logiciel',
      annee: 'Master 1',
      initiales: 'DC',
      bio: 'Développeur Fullstack Angular & Spring Boot. Conçoit les programmes de formation, devoirs et ateliers certifiants.',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com'
    },
    {
      nom: 'Mariam Traoré',
      role: 'Secrétaire Générale',
      filiere: 'Réseaux & Télécoms',
      annee: 'Licence 3',
      initiales: 'MT',
      bio: 'Gère les registres, procès-verbaux, adhésions et correspondances administratives de l’association.',
      linkedin: 'https://linkedin.com'
    },
    {
      nom: 'Stéphane Zongo',
      role: 'Responsable Pôle Projets & Hackathons',
      filiere: 'Sécurité Informatique',
      annee: 'Master 1',
      initiales: 'SZ',
      bio: 'Enthousiaste de cybersécurité et de solutions open-source. Encadre les projets techniques et organise les hackathons.',
      github: 'https://github.com'
    },
    {
      nom: 'Fatou Nikiéma',
      role: 'Trésorière Générale',
      filiere: 'Audit & Gestion Informatique',
      annee: 'Licence 3',
      initiales: 'FN',
      bio: 'Assure la gestion budgétaire, le suivi financier des cotisations et la transparence des comptes du Club.',
      linkedin: 'https://linkedin.com'
    }
  ];
}
