import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '../../../core/theme/theme.service';
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';

/** Bascule de thème : bouton à icône seule, nom accessible décrivant l'action. */
@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
  template: `
    <button appBtn variant="secondary" [iconOnly]="true" type="button" [attr.aria-label]="label()" [attr.title]="label()" (click)="theme.toggle()">
      <app-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" />
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly label = computed(() => (this.theme.theme() === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'));
}
