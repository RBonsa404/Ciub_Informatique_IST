import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icon-names';

/** Champ précédé d'une icône, avec zone d'action facultative à droite (attribut suffix). */
@Component({
  selector: 'app-input-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'input-group', '[class.has-suffix]': 'suffix()' },
  template: `
    <span class="input-icon" aria-hidden="true"><app-icon [name]="icon()" /></span>
    <ng-content />
    @if (suffix()) {
      <span class="input-suffix"><ng-content select="[suffix]" /></span>
    }
  `,
})
export class InputGroup {
  readonly icon = input.required<IconName>();
  readonly suffix = input(false);
}

/** Bouton d'affichage ou de masquage d'un mot de passe. Le parent lie [(visible)] au type du champ. */
@Component({
  selector: 'app-password-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <button
      type="button"
      class="input-action"
      [attr.aria-label]="visible() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
      [attr.aria-pressed]="visible()"
      (click)="visible.set(!visible())"
    >
      <app-icon [name]="visible() ? 'eye-off' : 'eye'" />
    </button>
  `,
})
export class PasswordToggle {
  readonly visible = model(false);
}
