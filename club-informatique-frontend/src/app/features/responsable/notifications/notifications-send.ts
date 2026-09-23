import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-responsable-notifications-send',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="notif-send-page">
      <div class="page-title-box">
        <h1>Diffusion de Notifications & Alertes Globales</h1>
        <p>Diffusez des annonces urgentes, rappels d'événements ou bulletins d'information à l'ensemble des membres ou à des groupes ciblés.</p>
      </div>

      <div class="glass-card form-card">
        <form [formGroup]="formGroup" (ngSubmit)="sendBroadcast()" class="form-stack">
          <div class="form-group">
            <label class="form-label" for="titre">Titre du message *</label>
            <input id="titre" type="text" formControlName="titre" class="form-control" placeholder="Ex: Rappel : Réunion générale de rentrée demain à 16h" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="type">Type de communication</label>
              <select id="type" formControlName="type" class="form-control">
                <option value="GLOBALE">Annonce Globale (Tous les membres)</option>
                <option value="RAPPEL">Rappel d'événement</option>
                <option value="INSCRIPTION">Notification de formation</option>
                <option value="ALERTE">Alerte Prioritaire</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="cible">Public Cible</label>
              <select id="cible" formControlName="cible" class="form-control">
                <option value="TOUS">Tous les utilisateurs actifs</option>
                <option value="MEMBRES">Membres inscrits uniquement</option>
                <option value="FORMATEURS">Formateurs uniquement</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="message">Contenu du message *</label>
            <textarea id="message" formControlName="message" class="form-control" rows="4" placeholder="Rédigez ici le message qui s'affichera dans le centre de notifications des destinataires..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="lien">Lien d'action (optionnel)</label>
            <input id="lien" type="text" formControlName="lien" class="form-control" placeholder="/evenements/1 ou https://..." />
          </div>

          <div class="form-actions mt-4 text-right">
            <button type="submit" class="btn btn-secondary btn-lg" [disabled]="formGroup.invalid || sending()">
              @if (sending()) {
                Diffusion en cours...
              } @else {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Diffuser la notification
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .notif-send-page { display: flex; flex-direction: column; gap: 2rem; }
    .page-title-box h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .page-title-box p { color: var(--text-secondary); font-size: 0.95rem; }
    .form-card { padding: 2.5rem; border-radius: 20px; max-width: 800px; }
    .form-stack { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .text-right { text-align: right; }
    .mt-4 { margin-top: 1rem; }
    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
      .form-card { padding: 1.5rem; }
    }
  `]
})
export class ResponsableNotificationsSendComponent {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly sending = signal(false);

  readonly formGroup: FormGroup = this.fb.group({
    titre: ['', Validators.required],
    type: ['GLOBALE'],
    cible: ['TOUS'],
    message: ['', Validators.required],
    lien: ['']
  });

  sendBroadcast(): void {
    if (this.formGroup.invalid) return;

    this.sending.set(true);
    setTimeout(() => {
      this.sending.set(false);
      this.toast.success('Notification globale diffusée avec succès à tous les destinataires cibles.');
      this.formGroup.reset({ type: 'GLOBALE', cible: 'TOUS' });
    }, 600);
  }
}
