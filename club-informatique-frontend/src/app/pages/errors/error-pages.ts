import { DOCUMENT, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { SeoService } from '../../core/seo/seo.service';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';

const ERROR_STYLES = `
  .wrap {
    padding: 5rem 0;
    min-height: 65vh;
    display: flex;
    align-items: center;
  }
  .kicker {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--badge-danger-text);
  }
  .kicker::before,
  .kicker::after {
    content: '';
    width: 30px;
    height: 2px;
    background: currentColor;
  }
  .kicker.warning {
    color: var(--accent-amber-text);
  }
  .code {
    font-family: var(--font-heading);
    font-size: clamp(5rem, 12vw, 8rem);
    font-weight: 900;
    line-height: 0.85;
    color: var(--color-blue-royal);
    margin-bottom: 1rem;
  }
  :host-context([data-theme='dark']) .code {
    color: #3b82f6;
  }
  h1 {
    font-size: clamp(1.8rem, 4vw, 2.5rem);
    margin-bottom: 1rem;
  }
  .text {
    font-size: 1rem;
    color: var(--text-muted);
    margin-bottom: 2rem;
    max-width: 450px;
  }
  .scene {
    width: 300px;
    height: 300px;
    position: relative;
  }
  .tile {
    width: 200px;
    height: 200px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(15deg);
    background: linear-gradient(135deg, rgba(29, 78, 216, 0.4), rgba(56, 189, 248, 0.2));
    border: 2px solid rgba(56, 189, 248, 0.4);
    border-radius: 24px;
    box-shadow:
      0 20px 60px rgba(29, 78, 216, 0.4),
      0 0 40px rgba(56, 189, 248, 0.2),
      inset 0 0 30px rgba(56, 189, 248, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-amber-tech);
  }
  .bar {
    position: absolute;
    top: 15%;
    right: 0;
    width: 80px;
    height: 20px;
    background: var(--color-amber-tech);
    border-radius: 4px;
    transform: rotate(-25deg);
    opacity: 0.8;
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
  }
  .cube {
    position: absolute;
    background: rgba(29, 78, 216, 0.5);
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 6px;
    animation: float 3s ease-in-out infinite;
  }
  @keyframes float {
    0%,
    100% {
      transform: translateY(0) rotate(30deg);
    }
    50% {
      transform: translateY(-15px) rotate(30deg);
    }
  }
  .server {
    width: 180px;
    height: 240px;
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(29, 78, 216, 0.3));
    border: 2px solid rgba(56, 189, 248, 0.3);
    border-radius: 16px;
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.5),
      0 0 30px rgba(56, 189, 248, 0.15);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1rem;
    color: var(--color-amber-tech);
  }
  .slot {
    height: 28px;
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 6px;
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
    gap: 0.3rem;
  }
  .led {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-warning);
  }
`;

/** Page introuvable (écran 16). */
@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon],
  styles: ERROR_STYLES,
  template: `
    <div class="wrap">
      <div class="page-container split">
        <div>
          <div class="kicker">Erreur</div>
          <!-- stats-ok: code d'erreur HTTP nommant la page -->
          <div class="code" aria-hidden="true">404</div>
          <h1>Page <span class="accent">introuvable</span></h1>
          <p class="text">Cette page est introuvable. Elle n’existe pas ou a été déplacée.</p>
          <div class="flex flex-wrap gap-4">
            <a appBtn size="lg" routerLink="/"><app-icon name="home" [size]="16" /> Retour à l’accueil</a>
            <button appBtn variant="secondary" size="lg" type="button" (click)="back()"><app-icon name="arrow-left" [size]="16" /> Revenir en arrière</button>
          </div>
        </div>
        <div class="split-decor flex items-center justify-center" aria-hidden="true">
          <div class="scene">
            <div class="tile"><app-icon name="alert-triangle" [size]="72" [strokeWidth]="1.5" /></div>
            <div class="bar"></div>
            <div class="cube" style="top: 10%; left: 10%; width: 30px; height: 30px"></div>
            <div class="cube" style="bottom: 15%; right: 15%; width: 20px; height: 20px; animation-duration: 4s; animation-delay: 1s"></div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundPage {
  private readonly location = inject(Location);

  constructor() {
    inject(SeoService).apply({ title: 'Page introuvable', noindex: true });
  }

  protected back(): void {
    this.location.back();
  }
}

/** Accès refusé (403), dérivé de l'écran 16. */
@Component({
  selector: 'app-forbidden-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon],
  styles: ERROR_STYLES,
  template: `
    <div class="wrap">
      <div class="page-container split">
        <div>
          <div class="kicker">Accès refusé</div>
          <h1>Accès <span class="accent">non autorisé</span></h1>
          <p class="text">Vous n’avez pas accès à cette page. Votre compte ne dispose pas des droits nécessaires pour consulter ce contenu.</p>
          <div class="flex flex-wrap gap-4">
            @if (auth.isAuthenticated()) {
              <a appBtn size="lg" routerLink="/espace"><app-icon name="grid" [size]="16" /> Retour à mon espace</a>
            } @else {
              <a appBtn size="lg" routerLink="/"><app-icon name="home" [size]="16" /> Retour à l’accueil</a>
            }
          </div>
        </div>
        <div class="split-decor flex items-center justify-center" aria-hidden="true">
          <div class="scene">
            <div class="tile"><app-icon name="lock" [size]="72" [strokeWidth]="1.5" /></div>
            <div class="bar"></div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ForbiddenPage {
  protected readonly auth = inject(AuthStore);

  constructor() {
    inject(SeoService).apply({ title: 'Accès refusé', noindex: true });
  }
}

/** Erreur générique (écran 17) : aucune durée ni statut de maintenance inventé. */
@Component({
  selector: 'app-service-error-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon],
  styles: ERROR_STYLES,
  template: `
    <div class="wrap">
      <div class="page-container split">
        <div>
          <div class="kicker warning">Service indisponible</div>
          <h1>Service <span class="accent">indisponible</span></h1>
          <p class="text" style="font-size: 1.05rem; color: var(--text-secondary); max-width: 480px">
            Un problème est survenu de notre côté. Réessayez dans quelques instants.
          </p>
          <div class="flex flex-wrap gap-4">
            <a appBtn size="lg" routerLink="/">Retour à l’accueil</a>
            <button appBtn variant="secondary" size="lg" type="button" (click)="reload()"><app-icon name="refresh-cw" [size]="16" /> Réessayer</button>
          </div>
        </div>
        <div class="split-decor flex justify-center" aria-hidden="true">
          <div class="server">
            <div class="slot"><span class="led"></span><span class="led"></span></div>
            <div class="slot"><span class="led" style="background: var(--color-danger)"></span><span class="led" style="background: var(--color-danger)"></span></div>
            <div class="slot"><span class="led" style="background: var(--color-success)"></span><span class="led" style="background: var(--color-success)"></span></div>
            <div class="flex justify-center" style="margin-top: 0.5rem"><app-icon name="tool" [size]="32" /></div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ServiceErrorPage {
  private readonly document = inject(DOCUMENT);

  constructor() {
    inject(SeoService).apply({ title: 'Service indisponible', noindex: true });
  }

  protected reload(): void {
    this.document.defaultView?.history.back();
  }
}
