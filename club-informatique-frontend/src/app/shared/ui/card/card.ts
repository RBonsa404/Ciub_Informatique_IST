import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type CardAccent = 'none' | 'blue' | 'amber';
export type BadgeVariant = 'primary' | 'amber' | 'success' | 'danger' | 'neutral';

/** Carte vitrée de la maquette, avec liseré supérieur facultatif. */
@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()', style: 'display:block' },
  template: `<ng-content />`,
})
export class Card {
  readonly accent = input<CardAccent>('none');
  /** Désactive l'effet de survol (carte purement informative dans une zone dense). */
  readonly static = input(false);

  protected readonly classes = computed(() => {
    const classes = ['glass-card'];
    if (this.accent() !== 'none') classes.push(`accent-${this.accent()}`);
    if (this.static()) classes.push('glass-card-static');
    return classes.join(' ');
  });
}

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"badge badge-" + variant()' },
  template: `<ng-content />`,
})
export class Badge {
  readonly variant = input<BadgeVariant>('primary');
}
