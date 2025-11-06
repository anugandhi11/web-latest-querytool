import { Component, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonacoSqlEditorComponent } from './monaco-sql-editor.component';
import { QueryResultsGridComponent } from '../../data-grid/components/query-results-grid.component';
import { QueryResult } from '../../../core/models/query.models';

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
    MonacoSqlEditorComponent,
    QueryResultsGridComponent
  ],
  template: `
    <div class="sql-editor-page">
      <!-- Modern Header with Gradient -->
      <header class="page-header">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold m-0 text-inverse">
              ⚡ Web Query Tool
            </h1>
            <div class="text-sm mt-sm" style="opacity: 0.95;">
              Enterprise SQL Editor • Monaco Editor × AG Grid × SignalR
            </div>
          </div>
          <div class="flex items-center gap-md">
            <span class="badge badge-success">WAF Compatible</span>
            <span class="badge badge-primary">.NET 9 + Angular 19</span>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <div class="page-content">
        <!-- SQL Editor Card -->
        <section class="card editor-card">
          <div class="card-header">
            <div class="flex items-center justify-between">
              <h3 class="card-title flex items-center gap-sm">
                📝 SQL Editor
                <span class="badge badge-primary text-xs">VS Code Engine</span>
              </h3>
              <div class="flex items-center gap-sm text-sm text-secondary">
                <span>Database: <strong class="text-primary">{{ selectedDatabaseType() }}</strong></span>
              </div>
            </div>
          </div>

          <div class="card-body p-0">
            <app-monaco-sql-editor
              [connectionId]="selectedConnectionId()"
              [databaseType]="selectedDatabaseType()"
              (queryExecuted)="onQueryExecuted($event)"
              (queryError)="onQueryError($event)">
            </app-monaco-sql-editor>
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

      <!-- Modern Status Bar -->
      <footer class="status-bar">
        <div class="flex items-center gap-lg text-sm">
          <div class="flex items-center gap-xs">
            <span class="text-secondary">🔌 Connection:</span>
            <span class="badge badge-primary">{{ selectedConnectionId() || 'Not Connected' }}</span>
          </div>

          <div class="toolbar-separator" style="height: 16px;"></div>

          <div class="flex items-center gap-xs">
            <span class="text-secondary">💾 Database:</span>
            <span class="text-primary font-medium">{{ selectedDatabaseType() }}</span>
          </div>

          <div class="toolbar-separator" style="height: 16px;"></div>

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
      height: 100vh;
      background: var(--bg-primary);
    }

    /* Modern Header */
    .page-header {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
      color: white;
      box-shadow: var(--shadow-md);
    }

    /* Content Area */
    .page-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      padding: var(--spacing-lg);
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
  @ViewChild(QueryResultsGridComponent)
  resultsGrid!: QueryResultsGridComponent;

  // Component state using Angular 19 signals
  selectedConnectionId = signal<string>('postgres-prod-001');
  selectedDatabaseType = signal<'PostgreSQL' | 'MySQL' | 'SQLServer' | 'Redshift'>('PostgreSQL');
  queryStatus = signal<string>('Ready');
  lastQuerySuccess = signal<boolean>(false);

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

    // Show error notification
    alert(`Query execution failed: ${error.error || error.message}`);
  }

  /**
   * Change database connection
   */
  changeConnection(connectionId: string, dbType: 'PostgreSQL' | 'MySQL' | 'SQLServer' | 'Redshift'): void {
    this.selectedConnectionId.set(connectionId);
    this.selectedDatabaseType.set(dbType);
    this.queryStatus.set('Connection changed');
  }
}
