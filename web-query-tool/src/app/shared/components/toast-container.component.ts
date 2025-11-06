import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Toast Container Component
 *
 * Displays toast notifications in the top-right corner
 * Animations: Slide in from right, fade out
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts$(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" @slideIn>
          <div class="toast-content">
            <div class="toast-icon">
              @switch (toast.type) {
                @case ('success') { ✓ }
                @case ('error') { ✕ }
                @case ('warning') { ⚠ }
                @case ('info') { ℹ }
              }
            </div>
            <div class="toast-message">{{ toast.message }}</div>
            <button class="toast-close" (click)="toastService.remove(toast.id)">
              ×
            </button>
          </div>
          <div class="toast-progress" [style.animation-duration.ms]="toast.duration"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 80px;
      right: var(--spacing-lg);
      z-index: var(--z-tooltip);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      max-width: 400px;
      pointer-events: none;
    }

    .toast {
      pointer-events: all;
      background: var(--bg-elevated);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      min-width: 300px;
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
    }

    .toast-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      border-radius: 50%;
    }

    .toast-success .toast-icon {
      background: rgba(16, 185, 129, 0.2);
      color: var(--success-500);
    }

    .toast-error .toast-icon {
      background: rgba(239, 68, 68, 0.2);
      color: var(--error-500);
    }

    .toast-warning .toast-icon {
      background: rgba(245, 158, 11, 0.2);
      color: var(--warning-500);
    }

    .toast-info .toast-icon {
      background: rgba(33, 150, 243, 0.2);
      color: var(--primary-500);
    }

    .toast-message {
      flex: 1;
      font-size: 0.875rem;
      color: var(--text-primary);
      line-height: 1.4;
    }

    .toast-close {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      transition: color var(--transition-fast);
      padding: 0;

      &:hover {
        color: var(--text-primary);
      }
    }

    .toast-progress {
      height: 3px;
      background: linear-gradient(90deg,
        var(--primary-500) 0%,
        var(--primary-600) 100%
      );
      animation: progress linear forwards;
    }

    .toast-success .toast-progress {
      background: linear-gradient(90deg,
        var(--success-500) 0%,
        var(--success-600) 100%
      );
    }

    .toast-error .toast-progress {
      background: linear-gradient(90deg,
        var(--error-500) 0%,
        var(--error-600) 100%
      );
    }

    .toast-warning .toast-progress {
      background: linear-gradient(90deg,
        var(--warning-500) 0%,
        var(--warning-600) 100%
      );
    }

    @keyframes progress {
      from { width: 100%; }
      to { width: 0%; }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .toast-container {
        top: 70px;
        right: var(--spacing-sm);
        left: var(--spacing-sm);
        max-width: none;
      }

      .toast {
        min-width: 0;
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(400px)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 1, 1)',
          style({ transform: 'translateX(400px)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
