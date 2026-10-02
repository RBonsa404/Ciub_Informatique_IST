import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BrandName, IconName } from './icon-names';

/** Pictogramme au trait de la famille unique (grille 24, épaisseur 2), servi depuis le sprite local. Décoratif par défaut. */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:inline-flex;flex-shrink:0' },
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <use [attr.href]="href()" />
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(18);
  readonly strokeWidth = input(2);
  protected readonly href = computed(() => `icons/sprite.svg#i-${this.name()}`);
}

/** Glyphe de plateforme (symbole de marque simplifié, rempli). Ce n'est pas un logo du club. */
@Component({
  selector: 'app-brand-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:inline-flex;flex-shrink:0' },
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <use [attr.href]="href()" />
    </svg>
  `,
})
export class BrandIcon {
  readonly name = input.required<BrandName>();
  readonly size = input(18);
  protected readonly href = computed(() => `icons/sprite.svg#b-${this.name()}`);
}
