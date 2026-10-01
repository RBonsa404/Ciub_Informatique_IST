import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icon-names';
import { ToastService, ToastType } from './toast.service';

const ICONS: Record<ToastType, IconName> = { info: 'info', success: 'check-circle', danger: 'x-circle' };

/** Zone des notifications éphémères, annoncée aux lecteurs d'écran. Placée une seule fois à la racine. */
@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="toast-container" role="region" aria-label="Notifications">
      <div aria-live="polite" aria-atomic="false" class="contents">
        @for (toast of service.toasts(); track toast.id) {
          <div class="toast" [class]="'toast-' + toast.type" [attr.role]="toast.type === 'danger' ? 'alert' : 'status'">
            <span class="toast-icon"><app-icon [name]="icons[toast.type]" [size]="20" /></span>
            <span class="toast-msg">{{ toast.message }}</span>
            <button type="button" class="toast-close" aria-label="Fermer la notification" (click)="service.dismiss(toast.id)">
              <app-icon name="x" [size]="16" />
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class ToastContainer {
  protected readonly service = inject(ToastService);
  protected readonly icons = ICONS;
}
