import { Component, ViewChild, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MonacoSqlEditorComponent } from './monaco-sql-editor.component';
import { QueryResultsGridComponent } from '../../data-grid/components/query-results-grid.component';
import { QueryHistoryPanelComponent } from './query-history-panel.component';
import { QueryResult } from '../../../core/models/query.models';
import { ConnectionService } from '../../../core/services/connection.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * SQL Editor Page Component
 *
 * Main interface combining:
 * - Monaco SQL Editor (VS Code-powered)
 * - AG Grid Results Display (NASA-grade)
 * - Query execution with WAF bypass
 */
@Component({
  selector: 'app-sql-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MonacoSqlEditorComponent,
    QueryResultsGridComponent,
    QueryHistoryPanelComponent
  ],
  template: `
    <div class="sql-editor-page">
      <!-- Page Header with Connection Info -->
      <div class="page-header">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="m-0 text-inverse font-semibold">SQL Editor</h2>
            <p class="text-secondary text-sm mt-sm m-0">Execute queries with Monaco Editor and real-time SignalR updates</p>
          </div>
          <div class="flex items-center gap-md">
            @if (activeConnection(); as conn) {
              <div class="connection-info">
                <span class="text-secondary text-xs">Active Connection:</span>
                <div class="flex items-center gap-xs mt-xs">
                  <span class="badge badge-success">{{ conn.name }}</span>
                  <span class="text-secondary text-xs">{{ conn.type }}</span>
                </div>
              </div>
            } @else {
              <a routerLink="/connections" class="btn btn-sm btn-primary">
                ➕ Add Connection
              </a>
            }
            <button class="btn btn-sm btn-secondary" (click)="toggleHistory()">
              {{ showHistory() ? '✕ Hide' : '📜 Show' }} History
            </button>
            <span class="badge badge-success">WAF Compatible</span>
            <span class="badge badge-primary">.NET 9 + Angular 19</span>
          </div>
        </div>
      </div>

      <!-- Main Content Area with Sidebar Layout -->
      <div class="page-content" [class.with-sidebar]="showHistory()">
        <!-- History Sidebar -->
        @if (showHistory()) {
          <aside class="history-sidebar">
            <app-query-history-panel
              (querySelected)="onQuerySelected($event)">
            </app-query-history-panel>
          </aside>
        }

        <!-- Main Editor Section -->
        <div class="editor-section">
          <!-- SQL Editor Card -->
        <section class="card editor-card">
          <div class="card-header">
            <div class="flex items-center justify-between">
              <h3 class="card-title flex items-center gap-sm">
                📝 SQL Editor
                <span class="badge badge-primary text-xs">VS Code Engine</span>
              </h3>
              @if (activeConnection(); as conn) {
                <div class="flex items-center gap-sm text-sm text-secondary">
                  <span>Database: <strong class="text-primary">{{ conn.type }}</strong></span>
                </div>
              }
            </div>
          </div>

          <div class="card-body p-0">
            @if (activeConnection(); as conn) {
              <app-monaco-sql-editor
                [connectionId]="conn.id"
                [databaseType]="conn.type"
                (queryExecuted)="onQueryExecuted($event)"
                (queryError)="onQueryError($event)">
              </app-monaco-sql-editor>
            } @else {
              <div class="no-connection">
                <div class="text-center p-lg">
                  <div style="font-size: 48px; margin-bottom: var(--spacing-md);">🔌</div>
                  <h3 class="text-inverse">No Connection Selected</h3>
                  <p class="text-secondary mb-lg">Add a database connection to start querying</p>
                  <a routerLink="/connections" class="btn btn-primary">
                    Manage Connections
                  </a>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Results Grid Card -->
        <section class="card results-card">
          <div class="card-header">
            <div class="flex items-center justify-between">
              <h3 class="card-title flex items-center gap-sm">
                📊 Query Results
                <span class="badge badge-success text-xs">AG Grid Enterprise</span>
              </h3>
              @if (lastQuerySuccess()) {
                <div class="flex items-center gap-sm">
                  <span class="badge badge-success">
                    ✓ {{ queryStatus() }}
                  </span>
                </div>
              }
            </div>
          </div>

          <div class="card-body p-0">
            <app-query-results-grid>
            </app-query-results-grid>
          </div>
        </section>
        </div>
        <!-- End Editor Section -->
      </div>

      <!-- Modern Status Bar -->
      <footer class="status-bar">
        <div class="flex items-center gap-lg text-sm">
          @if (activeConnection(); as conn) {
            <div class="flex items-center gap-xs">
              <span class="text-secondary">🔌 Connection:</span>
              <span class="badge badge-primary">{{ conn.name }}</span>
            </div>

            <div class="toolbar-separator" style="height: 16px;"></div>

            <div class="flex items-center gap-xs">
              <span class="text-secondary">💾 Database:</span>
              <span class="text-primary font-medium">{{ conn.type }}</span>
            </div>

            <div class="toolbar-separator" style="height: 16px;"></div>

            <div class="flex items-center gap-xs">
              <span class="text-secondary">🌐 Host:</span>
              <span class="text-secondary text-xs">{{ conn.host }}:{{ conn.port }}</span>
            </div>

            <div class="toolbar-separator" style="height: 16px;"></div>
          }

          <div class="flex items-center gap-xs">
            <span class="text-secondary">📡 Status:</span>
            <span class="font-medium"
                  [class.text-primary]="!lastQuerySuccess()"
                  [style.color]="lastQuerySuccess() ? 'var(--success-500)' : ''">
              {{ queryStatus() }}
            </span>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .sql-editor-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-primary);
    }

    /* Page Header */
    .page-header {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-primary);
    }

    /* Content Area */
    .page-content {
      flex: 1;
      display: flex;
      gap: var(--spacing-lg);
      padding: var(--spacing-lg);
      overflow: hidden;
    }

    .page-content.with-sidebar {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: var(--spacing-lg);
    }

    /* History Sidebar */
    .history-sidebar {
      min-width: 320px;
      max-width: 400px;
      height: 100%;
      overflow: hidden;
    }

    /* Editor Section */
    .editor-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      overflow: hidden;
    }

    .editor-card {
      flex: 0 0 auto;
      height: 450px;
    }

    .results-card {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    /* Status Bar */
    .status-bar {
      padding: var(--spacing-sm) var(--spacing-xl);
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-primary);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header {
        padding: var(--spacing-md);
      }

      .page-content {
        padding: var(--spacing-md);
        gap: var(--spacing-md);
      }

      .editor-card {
        height: 350px;
      }
    }
  `]
})
export class SqlEditorPageComponent {
  private connectionService = inject(ConnectionService);
  private toast = inject(ToastService);

  @ViewChild(QueryResultsGridComponent)
  resultsGrid!: QueryResultsGridComponent;

  @ViewChild(MonacoSqlEditorComponent)
  sqlEditor!: MonacoSqlEditorComponent;

  // Use shared connection service
  activeConnection = this.connectionService.activeConnection;

  // Component state using Angular 19 signals
  queryStatus = signal<string>('Ready');
  lastQuerySuccess = signal<boolean>(false);
  showHistory = signal<boolean>(false);

  /**
   * Handle successful query execution
   */
  onQueryExecuted(result: QueryResult): void {
    console.log('[SqlEditorPage] Query executed successfully:', result);

    this.lastQuerySuccess.set(true);
    this.queryStatus.set(
      `Success: ${result.totalRows} rows in ${result.executionTimeMs}ms`
    );

    // Display results in AG Grid
    this.resultsGrid.displayQueryResults(result);
  }

  /**
   * Handle query execution error
   */
  onQueryError(error: any): void {
    console.error('[SqlEditorPage] Query execution failed:', error);

    this.lastQuerySuccess.set(false);
    this.queryStatus.set('Query failed');

    // Note: Toast notification already shown in Monaco Editor component
  }

  /**
   * Toggle query history panel
   */
  toggleHistory(): void {
    this.showHistory.set(!this.showHistory());
  }

  /**
   * Load query from history into editor
   */
  onQuerySelected(sql: string): void {
    if (this.sqlEditor) {
      this.sqlEditor.setSQL(sql);
    }
  }
}
