import { Injectable, signal } from '@angular/core';

/**
 * Query Draft Service
 *
 * Auto-saves SQL queries to localStorage to prevent data loss
 * Professional feature found in DataGrip, DBeaver, Azure Data Studio
 */
@Injectable({
  providedIn: 'root'
})
export class QueryDraftService {
  private readonly STORAGE_KEY = 'web-query-tool-draft';
  private readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds

  lastSaved = signal<Date | null>(null);
  hasDraft = signal<boolean>(false);

  constructor() {
    // Check if draft exists on init
    this.hasDraft.set(!!localStorage.getItem(this.STORAGE_KEY));
  }

  /**
   * Save query draft to localStorage
   */
  saveDraft(sql: string, connectionId: string): void {
    if (!sql || sql.trim().length === 0) {
      this.clearDraft();
      return;
    }

    const draft = {
      sql,
      connectionId,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(draft));
    this.lastSaved.set(new Date());
    this.hasDraft.set(true);
  }

  /**
   * Load draft from localStorage
   */
  loadDraft(): { sql: string; connectionId: string; savedAt: Date } | null {
    const draftJson = localStorage.getItem(this.STORAGE_KEY);

    if (!draftJson) {
      return null;
    }

    try {
      const draft = JSON.parse(draftJson);
      return {
        sql: draft.sql,
        connectionId: draft.connectionId,
        savedAt: new Date(draft.savedAt)
      };
    } catch (error) {
      console.error('[QueryDraftService] Failed to parse draft:', error);
      this.clearDraft();
      return null;
    }
  }

  /**
   * Clear saved draft
   */
  clearDraft(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.hasDraft.set(false);
    this.lastSaved.set(null);
  }

  /**
   * Start auto-save interval
   * Returns interval ID for cleanup
   */
  startAutoSave(getSql: () => string, connectionId: string): number {
    return window.setInterval(() => {
      const sql = getSql();
      if (sql && sql.trim().length > 0) {
        this.saveDraft(sql, connectionId);
      }
    }, this.AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop auto-save interval
   */
  stopAutoSave(intervalId: number): void {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }
}
