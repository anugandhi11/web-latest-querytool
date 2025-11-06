import { Injectable, signal } from '@angular/core';
import { QueryHistory } from '../models/query.models';

/**
 * Query History Service
 *
 * Manages query history with localStorage persistence
 *
 * Features:
 * - Save executed queries with results
 * - Load query history
 * - Search query history
 * - Clear history
 * - Limit history size (prevent localStorage overflow)
 */
@Injectable({
  providedIn: 'root'
})
export class QueryHistoryService {
  private readonly STORAGE_KEY = 'web-query-tool-history';
  private readonly MAX_HISTORY_SIZE = 100; // Keep last 100 queries

  // Angular 19 signals for reactive state
  history = signal<QueryHistory[]>([]);

  constructor() {
    this.loadHistory();
  }

  /**
   * Add query to history
   */
  addToHistory(query: Omit<QueryHistory, 'id' | 'timestamp'>): void {
    const historyItem: QueryHistory = {
      id: this.generateId(),
      ...query,
      timestamp: new Date()
    };

    // Add to beginning of array (most recent first)
    const updated = [historyItem, ...this.history()];

    // Limit history size
    if (updated.length > this.MAX_HISTORY_SIZE) {
      updated.splice(this.MAX_HISTORY_SIZE);
    }

    this.history.set(updated);
    this.saveHistory();

    console.log('[QueryHistory] Query added to history:', historyItem.id);
  }

  /**
   * Get all history
   */
  getAllHistory(): QueryHistory[] {
    return this.history();
  }

  /**
   * Search history by SQL content
   */
  searchHistory(searchTerm: string): QueryHistory[] {
    if (!searchTerm.trim()) {
      return this.history();
    }

    const term = searchTerm.toLowerCase();
    return this.history().filter(item =>
      item.sql.toLowerCase().includes(term)
    );
  }

  /**
   * Get history by connection
   */
  getHistoryByConnection(connectionId: string): QueryHistory[] {
    return this.history().filter(item =>
      item.connectionId === connectionId
    );
  }

  /**
   * Get history by status
   */
  getHistoryByStatus(status: 'success' | 'error'): QueryHistory[] {
    return this.history().filter(item => item.status === status);
  }

  /**
   * Delete history item
   */
  deleteHistoryItem(id: string): void {
    const updated = this.history().filter(item => item.id !== id);
    this.history.set(updated);
    this.saveHistory();

    console.log('[QueryHistory] Deleted history item:', id);
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.history.set([]);
    this.saveHistory();

    console.log('[QueryHistory] History cleared');
  }

  /**
   * Export history to JSON
   */
  exportHistory(): string {
    return JSON.stringify(this.history(), null, 2);
  }

  /**
   * Import history from JSON
   */
  importHistory(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString) as QueryHistory[];

      // Validate structure
      if (!Array.isArray(imported)) {
        throw new Error('Invalid history format');
      }

      // Merge with existing history (keep unique by ID)
      const existingIds = new Set(this.history().map(h => h.id));
      const newItems = imported.filter(item => !existingIds.has(item.id));

      const merged = [...this.history(), ...newItems];

      // Limit size
      if (merged.length > this.MAX_HISTORY_SIZE) {
        merged.splice(this.MAX_HISTORY_SIZE);
      }

      this.history.set(merged);
      this.saveHistory();

      console.log('[QueryHistory] Imported history:', newItems.length + ' new items');
      return true;
    } catch (error) {
      console.error('[QueryHistory] Failed to import history:', error);
      return false;
    }
  }

  /**
   * Load history from localStorage
   */
  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as QueryHistory[];

        // Convert timestamp strings to Date objects
        const history = parsed.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));

        this.history.set(history);
        console.log('[QueryHistory] Loaded history:', history.length + ' items');
      }
    } catch (error) {
      console.error('[QueryHistory] Failed to load history:', error);
      this.history.set([]);
    }
  }

  /**
   * Save history to localStorage
   */
  private saveHistory(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history()));
    } catch (error) {
      console.error('[QueryHistory] Failed to save history:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get recent queries (last N)
   */
  getRecentQueries(count: number = 10): QueryHistory[] {
    return this.history().slice(0, count);
  }

  /**
   * Get successful queries only
   */
  getSuccessfulQueries(): QueryHistory[] {
    return this.getHistoryByStatus('success');
  }

  /**
   * Get failed queries only
   */
  getFailedQueries(): QueryHistory[] {
    return this.getHistoryByStatus('error');
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    total: number;
    successful: number;
    failed: number;
    averageExecutionTime: number;
    totalRows: number;
  } {
    const all = this.history();
    const successful = all.filter(q => q.status === 'success');

    return {
      total: all.length,
      successful: successful.length,
      failed: all.filter(q => q.status === 'error').length,
      averageExecutionTime: successful.length > 0
        ? successful.reduce((sum, q) => sum + q.executionTime, 0) / successful.length
        : 0,
      totalRows: successful.reduce((sum, q) => sum + q.rowCount, 0)
    };
  }
}
