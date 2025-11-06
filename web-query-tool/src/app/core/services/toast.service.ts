import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
  timestamp: Date;
}

/**
 * Toast Notification Service
 *
 * Professional toast notification system for user feedback
 * Replaces ugly alert() dialogs with beautiful, non-blocking toasts
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<Toast[]>([]);

  // Public read-only signal
  readonly toasts$ = this.toasts.asReadonly();

  /**
   * Show success toast
   */
  success(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Show error toast
   */
  error(message: string, duration: number = 5000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Show warning toast
   */
  warning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Show info toast
   */
  info(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Show toast notification
   */
  private show(message: string, type: Toast['type'], duration: number): void {
    const toast: Toast = {
      id: this.generateId(),
      message,
      type,
      duration,
      timestamp: new Date()
    };

    // Add to toasts array
    this.toasts.update(toasts => [...toasts, toast]);

    // Auto-remove after duration
    setTimeout(() => {
      this.remove(toast.id);
    }, duration);
  }

  /**
   * Remove toast by ID
   */
  remove(id: string): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  /**
   * Clear all toasts
   */
  clearAll(): void {
    this.toasts.set([]);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
