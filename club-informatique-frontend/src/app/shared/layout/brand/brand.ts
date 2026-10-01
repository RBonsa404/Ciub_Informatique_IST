import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE } from '../../../core/config/site';

/** Marque du club : logo officiel unique dans son conteneur blanc, nom et rattachement. */
@Component({
  selector: 'app-brand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <a routerLink="/" class="brand-logo-link" [attr.aria-label]="site.name + ' : accueil'">
      <img src="img/logo-88.png" srcset="img/logo-88.png 1x, img/logo-176.png 2x" alt="" width="44" height="44" class="brand-logo-img" />
      <span class="brand-title">
        <span class="brand-title-main">{{ site.shortName }}</span>
        <span class="brand-title-sub">{{ subtitle() }}</span>
      </span>
    </a>
  `,
})
export class Brand {
  readonly subtitle = input<string>(SITE.institution);
  protected readonly site = SITE;
}
