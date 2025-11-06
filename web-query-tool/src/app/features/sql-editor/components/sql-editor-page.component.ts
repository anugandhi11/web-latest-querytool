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
      <!-- Header -->
      <header class="page-header">
        <h1 class="page-title">
          🚀 Web Query Tool
        </h1>
        <div class="page-subtitle">
          Powered by Monaco Editor & AG Grid | WAF-Compatible
        </div>
      </header>

      <!-- Main Content -->
      <div class="page-content">
        <!-- SQL Editor Section -->
        <section class="editor-section">
          <div class="section-header">
            <h2 class="section-title">SQL Editor</h2>
            <span class="section-badge">VS Code Powered</span>
          </div>

          <app-monaco-sql-editor
            [connectionId]="selectedConnectionId()"
            [databaseType]="selectedDatabaseType()"
            (queryExecuted)="onQueryExecuted($event)"
            (queryError)="onQueryError($event)">
          </app-monaco-sql-editor>
        </section>

        <!-- Results Section -->
        <section class="results-section">
          <div class="section-header">
            <h2 class="section-title">Query Results</h2>
            <span class="section-badge">AG Grid Enterprise</span>
          </div>

          <app-query-results-grid>
          </app-query-results-grid>
        </section>
      </div>

      <!-- Status Bar -->
      <footer class="page-footer">
        <div class="footer-item">
          <span class="footer-label">Connection:</span>
          <span class="footer-value">{{ selectedConnectionId() || 'Not Connected' }}</span>
        </div>
        <div class="footer-item">
          <span class="footer-label">Database:</span>
          <span class="footer-value">{{ selectedDatabaseType() }}</span>
        </div>
        <div class="footer-item">
          <span class="footer-label">Status:</span>
          <span class="footer-value" [class.success]="lastQuerySuccess()">
            {{ queryStatus() }}
          </span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .sql-editor-page {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #f8f9fa;
    }

    /* Header */
    .page-header {
      padding: 16px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .page-title {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .page-subtitle {
      margin-top: 4px;
      font-size: 14px;
      opacity: 0.9;
    }

    /* Content */
    .page-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 24px;
      overflow: hidden;
    }

    .editor-section,
    .results-section {
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .editor-section {
      flex: 0 0 auto;
    }

    .results-section {
      flex: 1;
      min-height: 400px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }

    .section-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .section-badge {
      font-size: 11px;
      padding: 4px 8px;
      background: #667eea;
      color: white;
      border-radius: 12px;
      font-weight: 500;
    }

    /* Footer */
    .page-footer {
      display: flex;
      gap: 24px;
      padding: 8px 24px;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
      font-size: 13px;
    }

    .footer-item {
      display: flex;
      gap: 8px;
    }

    .footer-label {
      font-weight: 500;
      color: #666;
    }

    .footer-value {
      color: #333;
    }

    .footer-value.success {
      color: #28a745;
      font-weight: 500;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .page-content {
        padding: 12px;
        gap: 12px;
      }

      .page-header {
        padding: 12px 16px;
      }

      .page-title {
        font-size: 20px;
      }

      .page-subtitle {
        font-size: 12px;
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
