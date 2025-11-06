import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

/**
 * Connection Status Indicator Component
 *
 * Shows real-time backend API connectivity status
 * Performs health checks every 30 seconds
 */
@Component({
  selector: 'app-connection-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-indicator" [class]="statusClass()">
      <div class="status-dot"></div>
      <span class="status-text">{{ statusText() }}</span>
    </div>
  `,
  styles: [`
    .status-indicator {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-md);
      font-size: 0.75rem;
      font-weight: 500;
      transition: all var(--transition-fast);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    /* Online Status */
    .status-online {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .status-online .status-dot {
      background: var(--success-500);
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }

    .status-online .status-text {
      color: var(--success-500);
    }

    /* Offline Status */
    .status-offline {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .status-offline .status-dot {
      background: var(--error-500);
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
      animation: none;
    }

    .status-offline .status-text {
      color: var(--error-500);
    }

    /* Checking Status */
    .status-checking {
      background: rgba(251, 191, 36, 0.1);
      border: 1px solid rgba(251, 191, 36, 0.3);
    }

    .status-checking .status-dot {
      background: var(--warning-500);
      box-shadow: 0 0 8px rgba(251, 191, 36, 0.6);
    }

    .status-checking .status-text {
      color: var(--warning-500);
    }
  `]
})
export class ConnectionStatusIndicatorComponent implements OnInit, OnDestroy {
  statusClass = signal('status-checking');
  statusText = signal('Checking...');

  private healthCheckInterval: number | null = null;
  private readonly CHECK_INTERVAL = 30000; // 30 seconds

  ngOnInit(): void {
    // Initial check
    this.checkBackendHealth();

    // Set up periodic health checks
    this.healthCheckInterval = window.setInterval(() => {
      this.checkBackendHealth();
    }, this.CHECK_INTERVAL);
  }

  ngOnDestroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  /**
   * Check backend API health
   */
  private async checkBackendHealth(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${environment.apiUrlHttps}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.setOnline();
      } else {
        this.setOffline();
      }
    } catch (error) {
      // Backend not available or timeout
      this.setOffline();
    }
  }

  /**
   * Set status to online
   */
  private setOnline(): void {
    this.statusClass.set('status-online');
    this.statusText.set('API Online');
  }

  /**
   * Set status to offline
   */
  private setOffline(): void {
    this.statusClass.set('status-offline');
    this.statusText.set('API Offline');
  }
}
