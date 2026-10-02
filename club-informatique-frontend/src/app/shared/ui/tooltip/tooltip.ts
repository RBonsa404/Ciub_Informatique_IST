import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Directive, ElementRef, OnDestroy, inject, input, signal } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'app-tooltip-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tooltip', role: 'tooltip', '[id]': 'id()', style: 'display:block' },
  template: `{{ text() }}`,
})
export class TooltipPanel {
  readonly text = signal('');
  readonly id = signal('');
}

/** Infobulle affichée au survol et au focus, fermée par Échap, reliée par aria-describedby. */
@Directive({
  selector: '[appTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focus)': 'show()',
    '(blur)': 'hide()',
    '(keydown.escape)': 'hide()',
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class Tooltip implements OnDestroy {
  readonly appTooltip = input.required<string>();

  private readonly overlay = inject(Overlay);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly id = `infobulle-${nextId++}`;
  private overlayRef: OverlayRef | null = null;
  protected readonly describedBy = signal<string | null>(null);

  protected show(): void {
    if (this.overlayRef || !this.appTooltip()) return;
    const position = this.overlay
      .position()
      .flexibleConnectedTo(this.host)
      .withPositions([
        { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
      ]);
    this.overlayRef = this.overlay.create({ positionStrategy: position, scrollStrategy: this.overlay.scrollStrategies.close() });
    const panel = this.overlayRef.attach(new ComponentPortal(TooltipPanel));
    panel.instance.text.set(this.appTooltip());
    panel.instance.id.set(this.id);
    this.describedBy.set(this.id);
  }

  protected hide(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.describedBy.set(null);
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
