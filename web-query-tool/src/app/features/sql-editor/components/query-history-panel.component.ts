import { Component, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueryHistoryService } from '../../../core/services/query-history.service';
import { QueryHistory } from '../../../core/models/query.models';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Query History Panel Component
 *
 * Displays query execution history with search and management features
 *
 * Features:
 * - View recent queries
 * - Search queries
 * - Load query into editor
 * - Delete individual queries
 * - Clear all history
 * - View execution statistics
 */
@Component({
  selector: 'app-query-history-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="history-panel">
      <!-- Header with Statistics -->
      <div class="panel-header">
        <h3 class="panel-title">📜 Query History</h3>
        <button class="btn btn-sm btn-ghost" (click)="toggleStats()">
          {{ showStats() ? 'Hide Stats' : 'Show Stats' }}
        </button>
      </div>

      <!-- Statistics Card -->
      @if (showStats()) {
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">Total Queries</span>
            <span class="stat-value">{{ stats().total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Successful</span>
            <span class="stat-value text-success">{{ stats().successful }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Failed</span>
            <span class="stat-value text-error">{{ stats().failed }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Avg. Time</span>
            <span class="stat-value">{{ stats().averageExecutionTime.toFixed(0) }}ms</span>
          </div>
        </div>
      }

      <!-- Search Bar -->
      <div class="search-bar">
        <input
          type="text"
          class="search-input"
          placeholder="Search queries..."
          [(ngModel)]="searchTerm"
          (input)="onSearch()"
        />
        <button class="btn btn-sm btn-danger" (click)="clearHistory()">
          🗑️ Clear All
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button
          class="filter-tab"
          [class.active]="filter() === 'all'"
          (click)="setFilter('all')">
          All ({{ historyService.history().length }})
        </button>
        <button
          class="filter-tab"
          [class.active]="filter() === 'success'"
          (click)="setFilter('success')">
          Success ({{ historyService.getSuccessfulQueries().length }})
        </button>
        <button
          class="filter-tab"
          [class.active]="filter() === 'error'"
          (click)="setFilter('error')">
          Failed ({{ historyService.getFailedQueries().length }})
        </button>
      </div>

      <!-- History List -->
      <div class="history-list">
        @if (filteredHistory().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-text">No query history</div>
            <div class="empty-hint">Execute queries to build your history</div>
          </div>
        } @else {
          @for (item of filteredHistory(); track item.id) {
            <div class="history-item" [class.history-error]="item.status === 'error'">
              <div class="history-header">
                <div class="history-meta">
                  <span class="history-status" [class.status-success]="item.status === 'success'"
                        [class.status-error]="item.status === 'error'">
                    {{ item.status === 'success' ? '✓' : '✕' }}
                  </span>
                  <span class="history-time">{{ formatTime(item.timestamp) }}</span>
                  @if (item.status === 'success') {
                    <span class="history-stats">
                      {{ item.rowCount }} rows • {{ item.executionTime }}ms
                    </span>
                  }
                </div>
                <div class="history-actions">
                  <button
                    class="btn-icon"
                    (click)="loadQuery(item)"
                    title="Load query into editor">
                    ↩️
                  </button>
                  <button
                    class="btn-icon"
                    (click)="deleteQuery(item.id)"
                    title="Delete from history">
                    🗑️
                  </button>
                </div>
              </div>
              <div class="history-sql">
                <code>{{ truncateSQL(item.sql) }}</code>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .history-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md);
      background: var(--bg-tertiary);
      border-bottom: 1px solid var(--border-primary);
    }

    .panel-title {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-inverse);
    }

    /* Statistics Card */
    .stats-card {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background: var(--bg-tertiary);
      border-bottom: 1px solid var(--border-primary);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.7rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--text-inverse);
    }

    .text-success {
      color: var(--success-500);
    }

    .text-error {
      color: var(--error-500);
    }

    /* Search Bar */
    .search-bar {
      display: flex;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-primary);
    }

    .search-input {
      flex: 1;
      padding: var(--spacing-sm);
      background: var(--bg-tertiary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary-500);
    }

    /* Filter Tabs */
    .filter-tabs {
      display: flex;
      gap: var(--spacing-xs);
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-primary);
    }

    .filter-tab {
      padding: var(--spacing-xs) var(--spacing-sm);
      background: transparent;
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .filter-tab:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }

    .filter-tab.active {
      background: var(--primary-500);
      border-color: var(--primary-500);
      color: white;
    }

    /* History List */
    .history-list {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-sm);
    }

    .history-item {
      padding: var(--spacing-sm);
      background: var(--bg-tertiary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-sm);
      transition: all var(--transition-fast);
    }

    .history-item:hover {
      border-color: var(--primary-500);
      background: var(--bg-hover);
    }

    .history-item.history-error {
      border-left: 3px solid var(--error-500);
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xs);
    }

    .history-meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 0.75rem;
    }

    .history-status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      font-size: 0.7rem;
    }

    .status-success {
      background: rgba(16, 185, 129, 0.2);
      color: var(--success-500);
    }

    .status-error {
      background: rgba(239, 68, 68, 0.2);
      color: var(--error-500);
    }

    .history-time {
      color: var(--text-secondary);
    }

    .history-stats {
      color: var(--text-secondary);
    }

    .history-actions {
      display: flex;
      gap: var(--spacing-xs);
    }

    .btn-icon {
      width: 24px;
      height: 24px;
      padding: 0;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;
      opacity: 0.6;
      transition: opacity var(--transition-fast);
    }

    .btn-icon:hover {
      opacity: 1;
    }

    .history-sql {
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 0.75rem;
      color: var(--text-primary);
      background: var(--bg-primary);
      padding: var(--spacing-xs);
      border-radius: var(--radius-sm);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .history-sql code {
      color: var(--text-primary);
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2xl);
      text-align: center;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: var(--spacing-md);
      opacity: 0.5;
    }

    .empty-text {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xs);
    }

    .empty-hint {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    /* Scrollbar Styling */
    .history-list::-webkit-scrollbar {
      width: 8px;
    }

    .history-list::-webkit-scrollbar-track {
      background: var(--bg-secondary);
    }

    .history-list::-webkit-scrollbar-thumb {
      background: var(--border-primary);
      border-radius: 4px;
    }

    .history-list::-webkit-scrollbar-thumb:hover {
      background: var(--text-tertiary);
    }
  `]
})
export class QueryHistoryPanelComponent {
  historyService = inject(QueryHistoryService);
  private toast = inject(ToastService);

  @Output() querySelected = new EventEmitter<string>();

  searchTerm = '';
  filter = signal<'all' | 'success' | 'error'>('all');
  showStats = signal(false);

  // Computed signals
  stats = computed(() => this.historyService.getStatistics());

  filteredHistory = computed(() => {
    let items = this.historyService.history();

    // Apply filter
    const filterValue = this.filter();
    if (filterValue === 'success') {
      items = items.filter(i => i.status === 'success');
    } else if (filterValue === 'error') {
      items = items.filter(i => i.status === 'error');
    }

    // Apply search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      items = items.filter(i => i.sql.toLowerCase().includes(term));
    }

    return items;
  });

  /**
   * Set filter
   */
  setFilter(filter: 'all' | 'success' | 'error'): void {
    this.filter.set(filter);
  }

  /**
   * Toggle statistics display
   */
  toggleStats(): void {
    this.showStats.set(!this.showStats());
  }

  /**
   * Search queries
   */
  onSearch(): void {
    // Filtering happens automatically via computed signal
  }

  /**
   * Load query into editor
   */
  loadQuery(item: QueryHistory): void {
    this.querySelected.emit(item.sql);
    this.toast.success('Query loaded into editor');
  }

  /**
   * Delete query from history
   */
  deleteQuery(id: string): void {
    this.historyService.deleteHistoryItem(id);
    this.toast.success('Query removed from history');
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    if (confirm('Are you sure you want to clear all query history? This cannot be undone.')) {
      this.historyService.clearHistory();
      this.toast.success('Query history cleared');
    }
  }

  /**
   * Format timestamp for display
   */
  formatTime(timestamp: Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Truncate SQL for display
   */
  truncateSQL(sql: string, maxLength: number = 100): string {
    const trimmed = sql.trim().replace(/\s+/g, ' ');
    return trimmed.length > maxLength
      ? trimmed.substring(0, maxLength) + '...'
      : trimmed;
  }
}
