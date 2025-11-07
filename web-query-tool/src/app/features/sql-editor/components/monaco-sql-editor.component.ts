import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Output,
  EventEmitter,
  Input,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as monaco from 'monaco-editor';
// Import monaco-sql-languages to register SQL language support
import 'monaco-sql-languages';
import { QueryExecutionService } from '../../../core/services/query-execution.service';
import { DatabaseConnection, QueryResult } from '../../../core/models/query.models';
import { ToastService } from '../../../core/services/toast.service';
import { QueryHistoryService } from '../../../core/services/query-history.service';
import { QueryDraftService } from '../../../core/services/query-draft.service';
import { QueryProgressComponent } from './query-progress.component';

/**
 * Monaco SQL Editor Component
 *
 * World-class SQL editor powered by VS Code's Monaco Editor
 *
 * Features:
 * - Syntax highlighting for SQL
 * - IntelliSense (autocomplete) for SQL keywords, tables, columns
 * - Error detection
 * - Code formatting
 * - Keyboard shortcuts (Ctrl+Enter to execute)
 * - Dark/Light themes
 */
@Component({
  selector: 'app-monaco-sql-editor',
  standalone: true,
  imports: [CommonModule, QueryProgressComponent],
  template: `
    <div class="editor-wrapper" [class.fullscreen]="isFullscreen()">
      <!-- Modern Toolbar -->
      <div class="toolbar">
        <div class="toolbar-group">
          <button class="btn btn-success" (click)="executeQuery()" [disabled]="isExecuting()">
            @if (isExecuting()) {
              <span class="spinner"></span>
              Executing...
            } @else {
              ▶ Run Query
            }
            <span class="badge badge-gray text-xs">Ctrl+Enter</span>
          </button>
          <button class="btn btn-secondary" (click)="formatQuery()">
            ✨ Format SQL
          </button>
          <button class="btn btn-ghost" (click)="clearEditor()">
            🗑️ Clear
          </button>
          <button class="btn btn-ghost" (click)="importSQL()" title="Import SQL file">
            📂 Import
          </button>
          <button class="btn btn-ghost" (click)="exportSQL()" title="Export SQL file">
            💾 Export
          </button>
          <button class="btn btn-ghost" (click)="toggleFullscreen()" [title]="isFullscreen() ? 'Exit Full Screen' : 'Full Screen'">
            {{ isFullscreen() ? '⬅️' : '⛶' }}
          </button>
        </div>

        <div class="toolbar-separator"></div>

        <!-- Hidden file input for import -->
        <input
          #fileInput
          type="file"
          accept=".sql,.txt"
          (change)="onFileSelected($event)"
          style="display: none">

        <div class="status-indicator flex items-center gap-sm">
          @if (isExecuting()) {
            <span class="badge badge-primary">
              <span class="spinner"></span>
              {{ statusMessage() }}
            </span>
          } @else {
            <span class="badge" [class.badge-success]="statusMessage().includes('Success')"
                  [class.badge-gray]="!statusMessage().includes('Success')">
              {{ statusMessage() }}
            </span>
          }
        </div>
      </div>

      <!-- Query Progress Indicator -->
      <app-query-progress></app-query-progress>

      <!-- Monaco Editor Container -->
      <div #editorContainer class="monaco-editor-container"></div>
    </div>
  `,
  styles: [`
    .editor-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      overflow: hidden;
      transition: all var(--transition-base);
    }

    .editor-wrapper.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      background: var(--bg-primary);
      padding: 0;
      margin: 0;
      border-radius: 0;
    }

    .editor-container {
      flex: 1;
      min-height: 400px;
    }

    .status-indicator {
      margin-left: auto;
    }
  `]
})
export class MonacoSqlEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorContainer', { static: true })
  editorContainer!: ElementRef<HTMLDivElement>;

  @ViewChild(QueryProgressComponent)
  queryProgress!: QueryProgressComponent;

  @ViewChild('fileInput')
  fileInput!: ElementRef<HTMLInputElement>;

  @Input() connectionId: string = '';
  @Input() databaseType: 'PostgreSQL' | 'MySQL' | 'SQLServer' | 'Redshift' = 'PostgreSQL';

  @Output() queryExecuted = new EventEmitter<QueryResult>();
  @Output() queryError = new EventEmitter<Error>();

  private readonly queryService = inject(QueryExecutionService);
  private readonly toast = inject(ToastService);
  private readonly historyService = inject(QueryHistoryService);
  private readonly draftService = inject(QueryDraftService);

  private queryStartTime: Date | null = null;
  private autoSaveInterval: number | null = null;

  private editor: monaco.editor.IStandaloneCodeEditor | null = null;

  // Angular 19 signals for reactive state
  isExecuting = signal(false);
  statusMessage = signal('Ready');
  isFullscreen = signal(false);

  ngAfterViewInit(): void {
    this.initializeMonacoEditor();

    // Load saved draft if exists
    const draft = this.draftService.loadDraft();
    if (draft && this.editor) {
      this.editor.setValue(draft.sql);
      this.statusMessage.set('Draft loaded');
      this.toast.success(`Draft from ${this.formatDraftTime(draft.savedAt)} loaded`);
    }

    // Start auto-save
    this.autoSaveInterval = this.draftService.startAutoSave(
      () => this.getSQL(),
      this.connectionId
    );
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.dispose();
    }

    // Stop auto-save
    if (this.autoSaveInterval) {
      this.draftService.stopAutoSave(this.autoSaveInterval);
    }
  }

  /**
   * Initialize Monaco Editor with SQL support
   * DON'T reinvent this - Monaco is battle-tested by millions
   */
  private initializeMonacoEditor(): void {
    // monaco-sql-languages is already imported and registered automatically
    // Just create the editor with the correct language ID

    // Create editor instance
    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      value: this.getInitialSQL(),
      language: this.getMonacoLanguage(),
      theme: 'vs-dark',
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      automaticLayout: true,
      minimap: {
        enabled: true
      },

      // Enable key features
      suggest: {
        snippetsPreventQuickSuggestions: false
      },
      quickSuggestions: true,
      wordBasedSuggestions: 'matchingDocuments',

      // Editor behavior
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',

      // Accessibility
      ariaLabel: 'SQL Editor',
      accessibilitySupport: 'auto'
    });

    // Add keyboard shortcuts
    this.addKeyboardShortcuts();

    console.log('[MonacoSqlEditor] Editor initialized successfully');
  }

  /**
   * Get Monaco language string for SQL dialect
   */
  private getMonacoLanguage(): string {
    switch (this.databaseType) {
      case 'PostgreSQL':
        return 'pgsql';
      case 'MySQL':
        return 'mysql';
      case 'SQLServer':
        return 'sql'; // Use standard SQL for SQL Server
      case 'Redshift':
        return 'pgsql'; // Redshift is PostgreSQL-compatible
      default:
        return 'sql';
    }
  }

  /**
   * Get initial SQL template
   */
  private getInitialSQL(): string {
    return `-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚀 WELCOME TO WEB QUERY TOOL
-- Powered by Monaco Editor (VS Code's editor engine)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- 🎯 KEYBOARD SHORTCUTS:
--   • Execute Query       Ctrl+Enter (or Cmd+Enter on Mac)
--   • Format SQL          Shift+Alt+F
--   • Toggle Comment      Ctrl+/ (or Cmd+/)
--   • IntelliSense        Ctrl+Space
--   • Find                Ctrl+F
--   • Replace             Ctrl+H
--   • Multi-cursor        Alt+Click
--
-- ✨ FEATURES:
--   • SQL syntax highlighting with IntelliSense
--   • Auto-completion for SQL keywords
--   • Query history with search (click 📜 Show History)
--   • Real-time error detection
--   • Export results to CSV/Excel
--   • WAF bypass with Base64 encoding
--
-- 📝 TIPS:
--   • Select text and press Ctrl+Enter to run selected query
--   • Use Ctrl+/ to quickly comment/uncomment lines
--   • Format your SQL before executing for better readability
--
-- Start writing your query below:
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT * FROM `;
  }

  /**
   * Add keyboard shortcuts
   */
  private addKeyboardShortcuts(): void {
    if (!this.editor) return;

    // Ctrl+Enter: Execute query
    this.editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        this.executeQuery();
      }
    );

    // Ctrl+/: Toggle line comment
    this.editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash,
      () => {
        this.editor?.getAction('editor.action.commentLine')?.run();
      }
    );

    // Shift+Alt+F: Format SQL
    this.editor.addCommand(
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
      () => {
        this.formatQuery();
      }
    );

    console.log('[MonacoSqlEditor] Keyboard shortcuts registered: Ctrl+Enter, Ctrl+/, Shift+Alt+F');
  }

  /**
   * Execute query (Ctrl+Enter)
   */
  async executeQuery(): Promise<void> {
    if (!this.editor || this.isExecuting()) {
      return;
    }

    const sql = this.getSelectedOrAllText();

    if (!sql.trim()) {
      this.toast.warning('Please enter a SQL query');
      return;
    }

    // Validate query
    const validation = this.queryService.validateQuery(sql);
    if (!validation.valid) {
      this.toast.error(validation.error || 'Invalid SQL query');
      return;
    }

    // Execute
    this.isExecuting.set(true);
    this.statusMessage.set('Executing query...');
    this.queryStartTime = new Date();

    // Show progress indicator
    if (this.queryProgress) {
      this.queryProgress.show();
      this.queryProgress.updateProgress({
        percentage: 0,
        statusMessage: 'Preparing query...',
        message: 'Encoding SQL and connecting to database',
        rowsProcessed: 0,
        elapsedSeconds: 0
      });
    }

    // Start simulated progress updates
    const progressInterval = this.startProgressUpdates();

    try {
      const result = await this.queryService.executeQuery(
        sql,
        this.connectionId || 'default-connection'
      ).toPromise();

      // Clear progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      if (result) {
        // Update progress to 100%
        if (this.queryProgress && this.queryStartTime) {
          const elapsed = Math.floor((Date.now() - this.queryStartTime.getTime()) / 1000);
          this.queryProgress.updateProgress({
            percentage: 100,
            statusMessage: 'Query completed!',
            message: `${result.totalRows} rows returned in ${result.executionTimeMs}ms`,
            rowsProcessed: result.totalRows,
            elapsedSeconds: elapsed
          });

          // Show completion for a moment before hiding
          setTimeout(() => {
            this.queryProgress?.hide();
          }, 1000);
        }

        this.statusMessage.set(
          `Success: ${result.totalRows} rows in ${result.executionTimeMs}ms`
        );
        this.toast.success(`Query executed successfully! ${result.totalRows} rows returned in ${result.executionTimeMs}ms`);
        this.queryExecuted.emit(result);

        // Save to query history
        this.historyService.addToHistory({
          sql,
          executionTime: result.executionTimeMs,
          rowCount: result.totalRows,
          connectionId: this.connectionId,
          status: 'success'
        });
      }
    } catch (error) {
      console.error('[MonacoSqlEditor] Query execution failed:', error);
      this.statusMessage.set('Query failed');
      this.toast.error(`Query execution failed: ${(error as any).message || 'Unknown error'}`);
      this.queryError.emit(error as Error);

      // Clear progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      // Save failed query to history
      this.historyService.addToHistory({
        sql,
        executionTime: 0,
        rowCount: 0,
        connectionId: this.connectionId,
        status: 'error'
      });
    } finally {
      this.isExecuting.set(false);

      // Hide progress indicator
      if (this.queryProgress) {
        this.queryProgress.hide();
      }
    }
  }

  /**
   * Start simulated progress updates
   * Returns interval ID for cleanup
   */
  private startProgressUpdates(): number | null {
    if (!this.queryProgress || !this.queryStartTime) return null;

    let progress = 0;
    const interval = window.setInterval(() => {
      if (!this.queryStartTime) return;

      const elapsed = Math.floor((Date.now() - this.queryStartTime.getTime()) / 1000);

      // Simulate progress (never reaches 100% until query completes)
      progress = Math.min(progress + 15, 90);

      const messages = [
        'Connecting to database...',
        'Executing SQL query...',
        'Fetching results...',
        'Processing data...',
        'Preparing output...'
      ];

      const messageIndex = Math.min(Math.floor(progress / 20), messages.length - 1);

      this.queryProgress?.updateProgress({
        percentage: progress,
        statusMessage: 'Query executing...',
        message: messages[messageIndex],
        elapsedSeconds: elapsed
      });
    }, 500);

    return interval;
  }

  /**
   * Get selected text or all text
   */
  private getSelectedOrAllText(): string {
    if (!this.editor) return '';

    const selection = this.editor.getSelection();
    if (selection && !selection.isEmpty()) {
      return this.editor.getModel()!.getValueInRange(selection);
    }

    return this.editor.getValue();
  }

  /**
   * Format SQL query
   */
  formatQuery(): void {
    if (!this.editor) return;

    this.editor.getAction('editor.action.formatDocument')?.run();
    this.statusMessage.set('Query formatted');
  }

  /**
   * Clear editor
   */
  clearEditor(): void {
    if (!this.editor) return;

    this.editor.setValue('');
    this.statusMessage.set('Editor cleared');
  }

  /**
   * Get current SQL
   */
  getSQL(): string {
    return this.editor?.getValue() || '';
  }

  /**
   * Set SQL
   */
  setSQL(sql: string): void {
    if (!this.editor) return;
    this.editor.setValue(sql);
  }

  /**
   * Toggle full-screen editor mode
   */
  toggleFullscreen(): void {
    this.isFullscreen.set(!this.isFullscreen());

    // Layout editor after fullscreen toggle
    setTimeout(() => {
      if (this.editor) {
        this.editor.layout();
      }
    }, 100);
  }

  /**
   * Format draft timestamp for display
   */
  private formatDraftTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleString();
    }
  }

  /**
   * Import SQL file
   */
  importSQL(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (this.editor) {
          this.editor.setValue(content);
          this.toast.success(`Imported ${file.name} (${Math.round(file.size / 1024)} KB)`);
          this.statusMessage.set('File imported');
        }
      };

      reader.onerror = () => {
        this.toast.error('Failed to read file');
      };

      reader.readAsText(file);
      // Reset input so same file can be selected again
      input.value = '';
    }
  }

  /**
   * Export SQL file
   */
  exportSQL(): void {
    if (!this.editor) return;

    const sql = this.editor.getValue();
    if (!sql.trim()) {
      this.toast.warning('No SQL to export');
      return;
    }

    // Create blob and download
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `query_${timestamp}.sql`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.toast.success(`Exported ${filename}`);
    this.statusMessage.set('SQL exported');
  }
}
