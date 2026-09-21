import { Component, inject } from '@angular/core';
import { ErrorNotificationService } from '../core/services/error-notification.service';

/**
 * Composant d'erreur global (section 2.6.3 du document de dispatch) : affiche
 * les erreurs API remontées par error.interceptor.ts, quel que soit l'écran
 * affiché. Placé une fois dans le shell (app.component).
 */
@Component({
  selector: 'app-error-banner',
  standalone: true,
  template: `
    @if (notifier.current(); as err) {
      <div class="error-banner" role="alert">
        {{ err.message }}
        <button type="button" (click)="notifier.clear()" aria-label="Fermer">✕</button>
      </div>
    }
  `,
  styles: [`
    .error-banner {
      background: #fdecea;
      color: #611a15;
      border: 1px solid #f5c2c0;
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .error-banner button {
      background: none;
      border: none;
      cursor: pointer;
      font-weight: bold;
    }
  `],
})
export class ErrorBannerComponent {
  protected readonly notifier = inject(ErrorNotificationService);
}
