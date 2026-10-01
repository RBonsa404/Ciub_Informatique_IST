import { ChangeDetectionStrategy, Component, DestroyRef, Directive, ElementRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { AbstractControl, NgControl, ValidationErrors } from '@angular/forms';

let nextId = 0;

/** Messages par défaut des validations courantes. Un message précis par champ peut les remplacer. */
const DEFAULT_MESSAGES: Record<string, (params: Record<string, unknown>) => string> = {
  required: () => 'Ce champ est obligatoire.',
  email: () => 'Saisissez une adresse électronique valide.',
  minlength: (p) => `Saisissez au moins ${p['requiredLength']} caractères.`,
  maxlength: (p) => `Ne dépassez pas ${p['requiredLength']} caractères.`,
  min: (p) => `La valeur minimale est ${p['min']}.`,
  max: (p) => `La valeur maximale est ${p['max']}.`,
  pattern: () => 'Le format saisi est invalide.',
};

/**
 * Champ de formulaire : libellé, contrôle projeté, aide et message d'erreur.
 * Le contrôle projeté porte la directive appControl, qui le relie au libellé et aux messages.
 */
@Component({
  selector: 'app-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'form-group' },
  template: `
    <label [class]="labelHidden() ? 'sr-only' : 'form-label'" [attr.for]="controlId">
      {{ label() }}
      @if (required()) {
        <span class="form-required" aria-hidden="true">*</span>
      }
    </label>
    <ng-content />
    @if (hint()) {
      <span class="form-hint" [id]="hintId">{{ hint() }}</span>
    }
    <span class="form-error empty:hidden" [id]="errorId" aria-live="polite">{{ errorMessage() }}</span>
  `,
})
export class Field {
  readonly label = input.required<string>();
  readonly hint = input<string>();
  /** Libellé réservé aux lecteurs d'écran (champs à texte indicatif de la maquette). */
  readonly labelHidden = input(false);
  readonly required = input(false);
  /** Messages propres au champ, par clé de validation. */
  readonly messages = input<Record<string, string>>({});
  /** Erreur renvoyée par le serveur pour ce champ. */
  readonly serverError = input<string | null>(null);

  readonly controlId = `champ-${nextId++}`;
  readonly hintId = `${this.controlId}-aide`;
  readonly errorId = `${this.controlId}-erreur`;

  private readonly errors = signal<ValidationErrors | null>(null);
  private readonly touched = signal(false);

  readonly invalid = computed(() => !!this.serverError() || (this.touched() && this.errors() !== null));

  readonly errorMessage = computed(() => {
    const server = this.serverError();
    if (server) return server;
    const errors = this.errors();
    if (!this.touched() || !errors) return '';
    const key = Object.keys(errors)[0];
    const custom = this.messages()[key];
    if (custom) return custom;
    const params = typeof errors[key] === 'object' && errors[key] !== null ? (errors[key] as Record<string, unknown>) : {};
    return DEFAULT_MESSAGES[key]?.(params) ?? 'La valeur saisie est invalide.';
  });

  readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(this.hintId);
    if (this.invalid()) ids.push(this.errorId);
    return ids.length ? ids.join(' ') : null;
  });

  sync(errors: ValidationErrors | null, touched: boolean): void {
    this.errors.set(errors);
    this.touched.set(touched);
  }
}

/** Relie un contrôle natif (input, select, textarea) au champ qui le contient : identifiant, description, validité. */
@Directive({
  selector: 'input[appControl], select[appControl], textarea[appControl]',
  host: {
    '[id]': 'field.controlId',
    '[class]': 'cssClass',
    '[attr.aria-describedby]': 'field.describedBy()',
    '[attr.aria-invalid]': 'field.invalid() ? "true" : null',
    '[attr.aria-required]': 'field.required() ? "true" : null',
    '(blur)': 'refresh()',
    '(input)': 'refresh()',
    '(change)': 'refresh()',
  },
})
export class FieldControl implements OnInit {
  protected readonly field = inject(Field);
  private readonly control = inject(NgControl, { optional: true, self: true });
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly cssClass = { select: 'form-select', textarea: 'form-textarea' }[this.element.nativeElement.tagName.toLowerCase()] ?? 'form-input';

  private readonly destroyRef = inject(DestroyRef);

  /** Le contrôle d'un formControlName n'est attaché qu'après le constructeur : l'abonnement se fait à l'initialisation. */
  ngOnInit(): void {
    const subscription = this.control?.statusChanges?.subscribe(() => this.refresh());
    this.destroyRef.onDestroy(() => subscription?.unsubscribe());
  }

  /** Force l'affichage des erreurs (soumission d'un formulaire incomplet). */
  refresh(): void {
    this.field.sync(this.control?.errors ?? null, this.control?.touched ?? false);
  }
}

/** Révèle toutes les erreurs d'un formulaire soumis incomplet (les champs se resynchronisent sur statusChanges). */
export function revealErrors(form: AbstractControl): void {
  form.markAllAsTouched();
  const walk = (control: AbstractControl): void => {
    const children = (control as { controls?: Record<string, AbstractControl> | AbstractControl[] }).controls;
    if (children) for (const child of Object.values(children)) walk(child);
    control.updateValueAndValidity({ onlySelf: true });
  };
  walk(form);
}
