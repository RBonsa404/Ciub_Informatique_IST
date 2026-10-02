import { ChangeDetectionStrategy, Component, ElementRef, input, model, viewChildren } from '@angular/core';

export interface TabItem {
  readonly id: string;
  readonly label: string;
}

/**
 * Onglets accessibles (rôle tablist, flèches gauche et droite, Début, Fin).
 * Le panneau associé porte role="tabpanel", l'identifiant panelId(id) et aria-labelledby tabId(id).
 */
@Component({
  selector: 'app-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tab-nav" role="tablist" [attr.aria-label]="label()">
      @for (tab of tabs(); track tab.id; let i = $index) {
        <button
          #tabButton
          type="button"
          role="tab"
          class="tab-btn"
          [class.active]="tab.id === selected()"
          [id]="tabId(tab.id)"
          [attr.aria-selected]="tab.id === selected()"
          [attr.aria-controls]="panelId(tab.id)"
          [attr.tabindex]="tab.id === selected() ? 0 : -1"
          (click)="selected.set(tab.id)"
          (keydown)="onKeydown($event, i)"
        >
          {{ tab.label }}
        </button>
      }
    </div>
  `,
})
export class Tabs {
  readonly tabs = input.required<readonly TabItem[]>();
  readonly label = input.required<string>();
  readonly selected = model.required<string>();
  /** Préfixe distinguant plusieurs groupes d'onglets dans une même page. */
  readonly prefix = input('onglets');

  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  tabId(id: string): string {
    return `${this.prefix()}-onglet-${id}`;
  }

  panelId(id: string): string {
    return `${this.prefix()}-panneau-${id}`;
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const count = this.tabs().length;
    const target = { ArrowRight: (index + 1) % count, ArrowLeft: (index - 1 + count) % count, Home: 0, End: count - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    this.selected.set(this.tabs()[target].id);
    this.buttons()[target]?.nativeElement.focus();
  }
}
