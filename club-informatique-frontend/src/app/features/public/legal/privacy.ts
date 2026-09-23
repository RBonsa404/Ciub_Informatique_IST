import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="legal-page section-padding">
      <div class="container-app">
        <div class="legal-content glass-card">
          <span class="section-label">Données Personnelles</span>
          <h1 class="legal-title">Politique de Confidentialité & Protection des Données</h1>
          <p class="updated-date">Conforme à la législation nationale burkinabè et aux standards internationaux — Septembre 2026</p>

          <section class="legal-sec">
            <h2>1. Collecte des données</h2>
            <p>
              Dans le cadre de votre inscription et de votre participation aux activités, le Club Informatique recueille uniquement les données strictement nécessaires : nom, prénom, adresse e-mail institutionnelle ou personnelle, numéro de téléphone, filière et niveau d'études.
            </p>
          </section>

          <section class="legal-sec">
            <h2>2. Finalité des traitements</h2>
            <p>
              Les données recueillies servent exclusivement à :
            </p>
            <ul class="legal-list">
              <li>Gérer votre compte utilisateur et vos inscriptions aux formations et hackathons.</li>
              <li>Vous transmettre les rappels importants et actualités de la vie du club.</li>
              <li>Établir des attestations de formation et feuilles de présence.</li>
              <li>Garantir la sécurité informatique de la plateforme via la journalisation des accès (audit logs).</li>
            </ul>
          </section>

          <section class="legal-sec">
            <h2>3. Conservation et Sécurité</h2>
            <p>
              Vos mots de passe sont rigoureusement hachés avec l'algorithme BCrypt. Les sessions sont sécurisées par jetons JWT signés et un mécanisme optionnel d'authentification à deux facteurs (TOTP/2FA). Vos données ne sont en aucun cas cédées ni vendues à des tiers commerciaux.
            </p>
          </section>

          <section class="legal-sec">
            <h2>4. Vos droits</h2>
            <p>
              Conformément à la réglementation en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Vous pouvez exercer ce droit à tout moment depuis votre espace profil ou en formulant une demande auprès de l'administrateur système.
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
      font-size: 2.3rem;
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
    .legal-list {
      margin-top: 0.5rem;
      padding-left: 1.5rem;
      color: var(--text-secondary);
      line-height: 1.7;
    }
    @media (max-width: 768px) {
      .legal-content { padding: 1.5rem; }
      .legal-title { font-size: 1.7rem; }
    }
  `]
})
export class PrivacyComponent {}
