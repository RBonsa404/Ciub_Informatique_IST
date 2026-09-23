import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'ci_theme';
  private readonly _theme = signal<Theme>(this.getInitialTheme());
  readonly theme = this._theme.asReadonly();

  constructor() {
    effect(() => {
      const theme = this._theme();
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(this.STORAGE_KEY, theme);
    });
  }

  toggle(): void {
    this._theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
  }

  isDark(): boolean {
    return this._theme() === 'dark';
  }

  private getInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
