import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'amber' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Bouton ou lien d'action : <button appBtn> ou <a appBtn>. Un bouton à icône seule doit recevoir un aria-label. */
@Component({
  selector: 'button[appBtn], a[appBtn]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.aria-disabled]': 'loading() ? "true" : null',
  },
  template: `
    @if (loading()) {
      <span class="btn-spinner" aria-hidden="true"></span>
    }
    <ng-content />
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly iconOnly = input(false);
  readonly block = input(false);
  readonly loading = input(false);

  protected readonly classes = computed(() => {
    const classes = ['btn', `btn-${this.variant()}`];
    if (this.size() !== 'md') classes.push(`btn-${this.size()}`);
    if (this.iconOnly()) classes.push('btn-icon');
    if (this.block()) classes.push('btn-block');
    return classes.join(' ');
  });
}
