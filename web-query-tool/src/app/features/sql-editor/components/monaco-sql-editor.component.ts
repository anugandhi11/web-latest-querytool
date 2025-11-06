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
  imports: [CommonModule],
  template: `
    <div class="editor-wrapper">
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
        </div>

        <div class="toolbar-separator"></div>

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

  @Input() connectionId: string = '';
  @Input() databaseType: 'PostgreSQL' | 'MySQL' | 'SQLServer' | 'Redshift' = 'PostgreSQL';

  @Output() queryExecuted = new EventEmitter<QueryResult>();
  @Output() queryError = new EventEmitter<Error>();

  private readonly queryService = inject(QueryExecutionService);

  private editor: monaco.editor.IStandaloneCodeEditor | null = null;

  // Angular 19 signals for reactive state
  isExecuting = signal(false);
  statusMessage = signal('Ready');

  ngAfterViewInit(): void {
    this.initializeMonacoEditor();
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.dispose();
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
    return `-- Welcome to the Web Query Tool
-- Powered by Monaco Editor (VS Code's editor engine)
--
-- Features:
-- • SQL syntax highlighting
-- • IntelliSense (Ctrl+Space)
-- • Execute query: Ctrl+Enter
-- • Format SQL: Shift+Alt+F
--
-- Start writing your query below:

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

    console.log('[MonacoSqlEditor] Keyboard shortcuts registered');
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
      alert('Please enter a SQL query');
      return;
    }

    // Validate query
    const validation = this.queryService.validateQuery(sql);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Execute
    this.isExecuting.set(true);
    this.statusMessage.set('Executing query...');

    try {
      const result = await this.queryService.executeQuery(
        sql,
        this.connectionId || 'default-connection'
      ).toPromise();

      if (result) {
        this.statusMessage.set(
          `Success: ${result.totalRows} rows in ${result.executionTimeMs}ms`
        );
        this.queryExecuted.emit(result);
      }
    } catch (error) {
      console.error('[MonacoSqlEditor] Query execution failed:', error);
      this.statusMessage.set('Query failed');
      this.queryError.emit(error as Error);
    } finally {
      this.isExecuting.set(false);
    }
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
}
