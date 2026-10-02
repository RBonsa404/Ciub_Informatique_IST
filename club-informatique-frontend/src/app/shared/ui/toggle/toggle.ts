import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

abstract class BooleanControl implements ControlValueAccessor {
  protected readonly checked = signal(false);
  protected readonly disabled = signal(false);
  private onChange: (value: boolean) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: boolean | null): void {
    this.checked.set(value === true);
  }
  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }
  protected toggle(event: Event): void {
    const value = (event.target as HTMLInputElement).checked;
    this.checked.set(value);
    this.onChange(value);
  }
}

/** Case à cocher : le libellé est le contenu projeté. */
@Component({
  selector: 'app-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Checkbox), multi: true }],
  template: `
    <label class="form-check">
      <input
        type="checkbox"
        [checked]="checked()"
        [disabled]="disabled()"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        (change)="toggle($event)"
        (blur)="onTouched()"
      />
      <span><ng-content /></span>
    </label>
  `,
})
export class Checkbox extends BooleanControl {
  readonly invalid = input(false);
}

/** Interrupteur : même sémantique qu'une case à cocher, rôle « switch ». */
@Component({
  selector: 'app-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Switch), multi: true }],
  template: `
    <label class="switch">
      <input type="checkbox" role="switch" [checked]="checked()" [disabled]="disabled()" (change)="toggle($event)" (blur)="onTouched()" />
      <span class="switch-track" aria-hidden="true"></span>
      <span><ng-content /></span>
    </label>
  `,
})
export class Switch extends BooleanControl {}
