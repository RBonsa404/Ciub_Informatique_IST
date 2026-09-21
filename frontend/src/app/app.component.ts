import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ErrorBannerComponent } from './layout/error-banner.component';

/**
 * Shell/layout commun (section 2.6.3). L'en-tête, le pied de page et la
 * navigation définitifs viennent avec le design/UI Kit (livrable L05) --
 * ce composant fournit juste l'ossature (router-outlet + bandeau d'erreur
 * global) pour que chaque module puisse déjà brancher ses écrans.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ErrorBannerComponent],
  template: `
    <app-error-banner />
    <router-outlet />
  `,
})
export class AppComponent {}
