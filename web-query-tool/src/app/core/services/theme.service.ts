import { Injectable, signal, effect } from '@angular/core';

/**
 * Theme Service
 *
 * Manages application theme (dark/light mode)
 * Persists user preference in localStorage
 * Provides reactive theme state
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'web-query-tool-theme';
  private readonly THEME_ATTRIBUTE = 'data-theme';

  // Reactive theme state
  currentTheme = signal<'light' | 'dark'>('dark');

  constructor() {
    // Load saved theme or detect system preference
    this.loadTheme();

    // Apply theme changes to document
    effect(() => {
      this.applyTheme(this.currentTheme());
    });
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Set specific theme
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.currentTheme.set(theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  /**
   * Load theme from localStorage or detect system preference
   */
  private loadTheme(): void {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as 'light' | 'dark' | null;

    if (savedTheme) {
      this.currentTheme.set(savedTheme);
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme.set(prefersDark ? 'dark' : 'light');
    }
  }

  /**
   * Apply theme to document root
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute(this.THEME_ATTRIBUTE, theme);
  }

  /**
   * Check if current theme is dark
   */
  isDark(): boolean {
    return this.currentTheme() === 'dark';
  }

  /**
   * Check if current theme is light
   */
  isLight(): boolean {
    return this.currentTheme() === 'light';
  }
}
