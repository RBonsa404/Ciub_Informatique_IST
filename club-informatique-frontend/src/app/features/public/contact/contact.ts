import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="page-hero">
      <div class="container-app">
        <span class="section-label">Contact</span>
        <h1 class="section-title">Nous contacter</h1>
        <p class="section-subtitle">Une question, une idée, une proposition ? Écris-nous !</p>
      </div>
    </section>

    <section class="section-padding">
      <div class="container-app">
        <div class="contact-layout">
          <div class="contact-form-wrapper glass-card">
            <h2 style="font-size:1.2rem;margin-bottom:1.5rem">Envoyer un message</h2>
            <form (ngSubmit)="onSubmit()" class="contact-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="nom">Nom complet *</label>
                  <input id="nom" class="form-control" [(ngModel)]="form.nom" name="nom" placeholder="Ex: Ouédraogo Aminata" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="email">Email *</label>
                  <input id="email" type="email" class="form-control" [(ngModel)]="form.email" name="email" placeholder="votre@email.com" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="sujet">Sujet *</label>
                <input id="sujet" class="form-control" [(ngModel)]="form.sujet" name="sujet" placeholder="Objet de votre message" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="message">Message *</label>
                <textarea id="message" class="form-control" [(ngModel)]="form.message" name="message" rows="5" placeholder="Votre message..." required></textarea>
              </div>
              @if (submitted) {
                <div class="success-msg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Message envoyé avec succès ! Nous vous répondrons dans les meilleurs délais.
                </div>
              }
              <button type="submit" class="btn btn-primary" [disabled]="submitted" style="width:100%">
                {{ submitted ? 'Envoyé ✓' : 'Envoyer le message' }}
              </button>
            </form>
          </div>

          <div class="contact-info">
            <div class="info-card glass-card">
              <div class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <h3>Email</h3>
              <p>clubinformatique.ist&#64;gmail.com</p>
            </div>
            <div class="info-card glass-card">
              <div class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <h3>Localisation</h3>
              <p>IST Goughin, Ouagadougou<br>Burkina Faso</p>
            </div>
            <div class="info-card glass-card">
              <div class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3>Horaires</h3>
              <p>Lun - Ven : 08h00 - 18h00<br>Sam : 09h00 - 13h00</p>
            </div>
          </div>
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
    .contact-layout {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    .contact-form-wrapper {
      padding: 2rem;
    }
    .contact-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    textarea.form-control {
      resize: vertical;
      min-height: 120px;
    }
    .success-msg {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      background: rgba(34, 197, 94, 0.1);
      color: var(--color-success);
      font-size: 0.85rem;
      font-weight: 500;
    }
    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .info-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem;
    }
    .info-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(27, 58, 140, 0.08);
      color: var(--color-bleu-royal);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.25rem;
    }
    :host-context([data-theme="dark"]) .info-icon {
      background: rgba(245, 166, 35, 0.1);
      color: var(--color-amber-tech);
    }
    .info-card h3 {
      font-size: 0.95rem;
      color: var(--text-primary);
    }
    .info-card p {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    @media (max-width: 768px) {
      .contact-layout {
        grid-template-columns: 1fr;
      }
      .form-row {
        grid-template-columns: 1fr;
      }
      .contact-info {
        flex-direction: row;
        flex-wrap: wrap;
      }
      .info-card {
        flex: 1;
        min-width: 140px;
      }
    }
  `],
})
export class Contact {
  form = { nom: '', email: '', sujet: '', message: '' };
  submitted = false;

  onSubmit(): void {
    // In production, this would call the API
    this.submitted = true;
    setTimeout(() => {
      this.submitted = false;
      this.form = { nom: '', email: '', sujet: '', message: '' };
    }, 3000);
  }
}
