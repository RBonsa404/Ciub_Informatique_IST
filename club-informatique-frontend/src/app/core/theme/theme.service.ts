import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'ci_ist_theme';
const THEME_COLORS: Record<Theme, string> = { light: '#F8FAFC', dark: '#070D1E' };

/**
 * Thème clair ou sombre. Le thème initial est appliqué avant le premier rendu par public/theme-init.js
 * (préférence mémorisée, sinon préférence du système) ; ce service gère la bascule manuelle.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<Theme>(this.readInitial());

  readonly theme = this.current.asReadonly();

  toggle(): void {
    this.set(this.current() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.current.set(theme);
    this.document.documentElement.setAttribute('data-theme', theme);
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Stockage indisponible : la préférence vaut pour la session en cours.
    }
  }

  private readInitial(): Theme {
    return this.document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
}
