import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

/** Lien d'évitement : place le focus sur la zone de contenu (#contenu) sans modifier l'URL. */
@Component({
  selector: 'app-skip-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a class="skip-link" href="#contenu" (click)="focusMain($event)">Aller au contenu</a>`,
})
export class SkipLink {
  private readonly document = inject(DOCUMENT);

  protected focusMain(event: Event): void {
    event.preventDefault();
    this.document.getElementById('contenu')?.focus();
  }
}
