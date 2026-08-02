import { Injectable } from '@angular/core';
import { APP_SETTINGS } from './app.settings';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly key = 'app-theme';
  private currentTheme: Theme = APP_SETTINGS.defaultTheme;

  constructor() {
    this.loadTheme();
  }

  toggleTheme(): void {
    const newTheme: Theme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  setTheme(theme: Theme): void {
    this.currentTheme = theme;

    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);

    localStorage.setItem(this.key, theme);
  }

  getTheme(): Theme {
    return this.currentTheme;
  }

  private loadTheme(): void {
    const saved = localStorage.getItem(this.key) as Theme | null;

    if (saved === 'light' || saved === 'dark') {
      this.setTheme(saved);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : this.currentTheme);
    }
  }
}
