import { Signal, computed, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ApiError, toApiError } from '../http/problem';

export type LoadStatus = 'loading' | 'ready' | 'empty' | 'error';

/**
 * État d'une zone de données : chargement, contenu, vide, erreur.
 * Une valeur numérique nulle n'est jamais affichée pendant le chargement : le gabarit montre un squelette.
 */
export class ResourceState<T> {
  private readonly value = signal<T | null>(null);
  private readonly failure = signal<ApiError | null>(null);
  private readonly pending = signal(true);
  private subscription: Subscription | null = null;

  readonly data: Signal<T | null> = this.value.asReadonly();
  readonly error: Signal<ApiError | null> = this.failure.asReadonly();
  readonly status: Signal<LoadStatus> = computed(() => {
    if (this.pending()) return 'loading';
    if (this.failure()) return 'error';
    const value = this.value();
    return value === null || this.isEmpty(value) ? 'empty' : 'ready';
  });

  constructor(
    private readonly source: () => Observable<T>,
    private readonly isEmpty: (value: T) => boolean = defaultIsEmpty,
  ) {}

  /** Recharge sans repasser par l’état de chargement : le contenu affiché est remplacé à l’arrivée de la réponse. */
  refresh(): void {
    this.subscription?.unsubscribe();
    this.subscription = this.source().subscribe({
      next: (value) => this.value.set(value),
      error: () => {},
    });
  }

  load(): void {
    this.subscription?.unsubscribe();
    this.pending.set(true);
    this.failure.set(null);
    this.subscription = this.source().subscribe({
      next: (value) => {
        this.value.set(value);
        this.pending.set(false);
      },
      error: (error: unknown) => {
        this.failure.set(toApiError(error));
        this.pending.set(false);
      },
    });
  }

  destroy(): void {
    this.subscription?.unsubscribe();
  }
}

function defaultIsEmpty(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object' && value !== null && 'content' in value) {
    const content = (value as { content: unknown }).content;
    return Array.isArray(content) && content.length === 0;
  }
  return false;
}
