import { Injectable, signal } from '@angular/core';

export interface ErrorBannerState {
  message: string;
  status?: number;
}

/**
 * Point central utilisé par error.interceptor.ts et par le composant
 * d'erreur global (layout) pour afficher les erreurs API de façon homogène,
 * cohérent avec le format ErrorResponse renvoyé par le backend
 * (GlobalExceptionHandler côté Spring Boot).
 */
@Injectable({ providedIn: 'root' })
export class ErrorNotificationService {
  readonly current = signal<ErrorBannerState | null>(null);

  show(message: string, status?: number): void {
    this.current.set({ message, status });
  }

  clear(): void {
    this.current.set(null);
  }
}
