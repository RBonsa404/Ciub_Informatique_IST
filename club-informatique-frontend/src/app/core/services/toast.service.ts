import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(toast: Omit<ToastMessage, 'id'>): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = {
      ...toast,
      id,
      duration: toast.duration ?? 4000
    };

    this._toasts.update(list => [...list, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, newToast.duration);
    }
  }

  success(message: string, title: string = 'Succès'): void {
    this.show({ type: 'success', title, message });
  }

  error(message: string, title: string = 'Erreur'): void {
    this.show({ type: 'error', title, message });
  }

  warning(message: string, title: string = 'Attention'): void {
    this.show({ type: 'warning', title, message });
  }

  info(message: string, title: string = 'Information'): void {
    this.show({ type: 'info', title, message });
  }

  remove(id: string): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}
