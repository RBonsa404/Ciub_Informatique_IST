import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icon-names';

/** Squelette de chargement aux dimensions du contenu final. Jamais de valeur numérique provisoire. */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'skeleton',
    'aria-hidden': 'true',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[style.border-radius]': 'radius()',
  },
  template: ``,
})
export class Skeleton {
  readonly width = input('100%');
  readonly height = input('1rem');
  readonly radius = input<string | null>(null);
}

/** État vide (écran 34). Une action n'est projetée que si le rôle de l'utilisateur permet de la réaliser. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'empty-state' },
  template: `
    <div class="empty-state-icon"><app-icon [name]="icon()" [size]="28" /></div>
    <p class="empty-state-desc" style="margin-bottom:0">{{ message() }}</p>
    <div class="empty:hidden" style="margin-top:1.5rem"><ng-content /></div>
  `,
})
export class EmptyState {
  readonly message = input.required<string>();
  readonly icon = input<IconName>('inbox');
}

/** État d'erreur d'une zone de données, avec l'action « Réessayer ». */
@Component({
  selector: 'app-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Button],
  host: { class: 'empty-state', role: 'alert' },
  template: `
    <div class="empty-state-icon empty-state-icon-danger"><app-icon name="alert-triangle" [size]="28" /></div>
    <p class="empty-state-desc">{{ message() }}</p>
    @if (retryable()) {
      <button appBtn variant="secondary" type="button" (click)="retry.emit()">
        <app-icon name="refresh-cw" [size]="16" />
        Réessayer
      </button>
    }
  `,
})
export class ErrorState {
  readonly message = input('Les données n’ont pas pu être chargées. Vérifiez votre connexion, puis réessayez.');
  readonly retryable = input(true);
  readonly retry = output<void>();
}
