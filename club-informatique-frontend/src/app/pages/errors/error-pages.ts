import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { SeoService } from '../../core/seo/seo.service';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';

/** Page introuvable (écran 16). Mise en page provisoire du socle ; la recette visuelle complète suit avec les pages publiques. */
@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon],
  template: `
    <section class="page-container container-narrow" style="padding-top:5rem;padding-bottom:3rem;text-align:center">
      <div class="empty-state-icon" style="margin:0 auto 1.25rem"><app-icon name="alert-circle" [size]="28" /></div>
      <h1>Cette page est introuvable.</h1>
      <p style="margin:1rem auto 2rem;max-width:480px">L’adresse saisie ne correspond à aucune page du site.</p>
      <a appBtn variant="primary" routerLink="/"><app-icon name="home" [size]="16" /> Retour à l’accueil</a>
    </section>
  `,
})
export class NotFoundPage {
  constructor() {
    inject(SeoService).apply({ title: 'Page introuvable', noindex: true });
  }
}

/** Accès refusé (403), dérivé du gabarit d'erreur. */
@Component({
  selector: 'app-forbidden-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon],
  template: `
    <section class="page-container container-narrow" style="padding-top:5rem;padding-bottom:3rem;text-align:center">
      <div class="empty-state-icon empty-state-icon-danger" style="margin:0 auto 1.25rem"><app-icon name="lock" [size]="28" /></div>
      <h1>Vous n’avez pas accès à cette page.</h1>
      <p style="margin:1rem auto 2rem;max-width:480px">Votre compte ne dispose pas des droits nécessaires pour consulter ce contenu.</p>
      @if (auth.isAuthenticated()) {
        <a appBtn variant="primary" routerLink="/espace"><app-icon name="grid" [size]="16" /> Retour à mon espace</a>
      } @else {
        <a appBtn variant="primary" routerLink="/"><app-icon name="home" [size]="16" /> Retour à l’accueil</a>
      }
    </section>
  `,
})
export class ForbiddenPage {
  protected readonly auth = inject(AuthStore);

  constructor() {
    inject(SeoService).apply({ title: 'Accès refusé', noindex: true });
  }
}
