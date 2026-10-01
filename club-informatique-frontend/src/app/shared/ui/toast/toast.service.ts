import { Injectable, signal } from '@angular/core';

export type ToastType = 'info' | 'success' | 'danger';

export interface Toast {
  readonly id: number;
  readonly type: ToastType;
  readonly message: string;
}

/** Durée d'affichage de la maquette (3,5 s). Les erreurs restent plus longtemps pour être lues. */
const DURATION_MS: Record<ToastType, number> = { info: 3500, success: 3500, danger: 7000 };

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly items = signal<readonly Toast[]>([]);
  readonly toasts = this.items.asReadonly();

  info(message: string): void {
    this.show('info', message);
  }

  success(message: string): void {
    this.show('success', message);
  }

  danger(message: string): void {
    this.show('danger', message);
  }

  dismiss(id: number): void {
    this.items.update((items) => items.filter((toast) => toast.id !== id));
  }

  private show(type: ToastType, message: string): void {
    const id = this.nextId++;
    this.items.update((items) => [...items, { id, type, message }]);
    setTimeout(() => this.dismiss(id), DURATION_MS[type]);
  }
}
