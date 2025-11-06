import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Query Progress Component
 *
 * Shows real-time progress updates for long-running queries
 *
 * Features:
 * - Animated progress bar
 * - Status messages
 * - Rows processed counter
 * - Elapsed time display
 * - Cancelable queries
 */
@Component({
  selector: 'app-query-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible()) {
      <div class="progress-container">
        <!-- Progress Header -->
        <div class="progress-header">
          <div class="progress-title">
            <span class="spinner"></span>
            <span>{{ statusMessage() }}</span>
          </div>
          <div class="progress-stats">
            @if (rowsProcessed() > 0) {
              <span class="stat">{{ rowsProcessed() }} rows</span>
            }
            @if (elapsedSeconds() > 0) {
              <span class="stat">{{ elapsedSeconds() }}s</span>
            }
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-bar-container">
          <div
            class="progress-bar"
            [style.width.%]="percentage()"
            [class.indeterminate]="percentage() === 0">
          </div>
        </div>

        <!-- Progress Info -->
        <div class="progress-info">
          <span class="progress-percentage">{{ percentage() }}%</span>
          <span class="progress-message">{{ message() }}</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .progress-container {
      padding: var(--spacing-md);
      background: var(--bg-tertiary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-md);
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-sm);
    }

    .progress-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid var(--border-primary);
      border-top-color: var(--primary-500);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .progress-stats {
      display: flex;
      gap: var(--spacing-md);
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .stat {
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    }

    /* Progress Bar */
    .progress-bar-container {
      height: 6px;
      background: var(--bg-primary);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: var(--spacing-sm);
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-500), var(--primary-400));
      border-radius: 3px;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-bar.indeterminate {
      width: 100% !important;
      background: linear-gradient(
        90deg,
        var(--bg-primary) 0%,
        var(--primary-500) 50%,
        var(--bg-primary) 100%
      );
      background-size: 200% 100%;
      animation: indeterminate 1.5s ease-in-out infinite;
    }

    @keyframes indeterminate {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    /* Progress Info */
    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
    }

    .progress-percentage {
      font-weight: 600;
      color: var(--primary-500);
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    }

    .progress-message {
      color: var(--text-secondary);
    }
  `]
})
export class QueryProgressComponent {
  // Input signals
  isVisible = signal(false);
  percentage = signal(0);
  statusMessage = signal('Connecting...');
  message = signal('');
  rowsProcessed = signal(0);
  elapsedSeconds = signal(0);

  /**
   * Update progress
   */
  updateProgress(data: {
    percentage?: number;
    statusMessage?: string;
    message?: string;
    rowsProcessed?: number;
    elapsedSeconds?: number;
  }): void {
    if (data.percentage !== undefined) this.percentage.set(data.percentage);
    if (data.statusMessage !== undefined) this.statusMessage.set(data.statusMessage);
    if (data.message !== undefined) this.message.set(data.message);
    if (data.rowsProcessed !== undefined) this.rowsProcessed.set(data.rowsProcessed);
    if (data.elapsedSeconds !== undefined) this.elapsedSeconds.set(data.elapsedSeconds);
  }

  /**
   * Show progress
   */
  show(): void {
    this.isVisible.set(true);
  }

  /**
   * Hide progress
   */
  hide(): void {
    this.isVisible.set(false);
    this.reset();
  }

  /**
   * Reset progress
   */
  reset(): void {
    this.percentage.set(0);
    this.statusMessage.set('Connecting...');
    this.message.set('');
    this.rowsProcessed.set(0);
    this.elapsedSeconds.set(0);
  }
}
