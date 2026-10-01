import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

export interface ConfirmOptions {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  /** Action destructrice : bouton de confirmation en rouge. */
  readonly danger?: boolean;
}

let nextId = 0;

/** Modale de confirmation (écran 64) : piège de focus, fermeture par Échap, restitution du focus. */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
  host: { class: 'modal-card', style: 'display:block' },
  template: `
    <div class="modal-header">
      <h2 [id]="titleId" style="font-size:1.25rem">{{ data.title }}</h2>
      <button appBtn variant="ghost" [iconOnly]="true" type="button" aria-label="Fermer" (click)="ref.close(false)">
        <app-icon name="x" />
      </button>
    </div>
    <div class="modal-body">
      <p [id]="descId">{{ data.message }}</p>
    </div>
    <div class="modal-footer">
      <button appBtn variant="secondary" type="button" (click)="ref.close(false)">{{ data.cancelLabel ?? 'Annuler' }}</button>
      <button appBtn [variant]="data.danger ? 'danger' : 'primary'" type="button" (click)="ref.close(true)">
        {{ data.confirmLabel ?? 'Confirmer' }}
      </button>
    </div>
  `,
})
export class ConfirmDialog {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly data = inject<ConfirmOptions & { titleId: string; descId: string }>(DIALOG_DATA);
  protected readonly titleId = this.data.titleId;
  protected readonly descId = this.data.descId;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);

  /** Ouvre une modale de confirmation ; émet vrai si l'utilisateur confirme. */
  confirm(options: ConfirmOptions): Observable<boolean> {
    const id = nextId++;
    const titleId = `modale-titre-${id}`;
    const descId = `modale-texte-${id}`;
    const ref = this.dialog.open<boolean>(ConfirmDialog, {
      data: { ...options, titleId, descId },
      ariaLabelledBy: titleId,
      ariaDescribedBy: descId,
      ariaModal: true,
      backdropClass: 'modal-backdrop',
      panelClass: 'modal-panel',
      width: 'min(580px, calc(100vw - 2rem))',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    return ref.closed.pipe(map((result) => result === true));
  }
}
