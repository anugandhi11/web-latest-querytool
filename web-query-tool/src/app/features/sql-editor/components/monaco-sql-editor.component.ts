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
import { setupLanguageFeatures, LanguageIdEnum } from 'monaco-sql-languages';
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
      <div class="editor-toolbar">
        <button class="btn btn-primary" (click)="executeQuery()" [disabled]="isExecuting()">
          {{ isExecuting() ? 'Executing...' : 'Run Query' }}
          <span class="shortcut">Ctrl+Enter</span>
        </button>
        <button class="btn btn-secondary" (click)="formatQuery()">
          Format SQL
        </button>
        <button class="btn btn-secondary" (click)="clearEditor()">
          Clear
        </button>
        <div class="status-indicator" [class.executing]="isExecuting()">
          {{ statusMessage() }}
        </div>
      </div>
      <div #editorContainer class="editor-container"></div>
    </div>
  `,
  styles: [`
    .editor-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }

    .editor-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
    }

    .btn {
      padding: 6px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn:hover:not(:disabled) {
      background: #f0f0f0;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #0066cc;
      color: white;
      border-color: #0055aa;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0055aa;
    }

    .shortcut {
      font-size: 11px;
      opacity: 0.8;
      padding: 2px 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }

    .status-indicator {
      margin-left: auto;
      font-size: 13px;
      color: #666;
    }

    .status-indicator.executing {
      color: #0066cc;
      font-weight: 500;
    }

    .editor-container {
      flex: 1;
      height: 600px;
      min-height: 400px;
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
    // Configure SQL language support based on database type
    const languageId = this.getLanguageId();

    // Setup SQL IntelliSense with monaco-sql-languages
    setupLanguageFeatures(languageId, {
      completionItems: {
        enable: true
      },
      languageFormatOptions: {
        indentWidth: 2,
        tabSize: 2
      }
    });

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
   * Get Language ID for monaco-sql-languages
   */
  private getLanguageId(): LanguageIdEnum {
    switch (this.databaseType) {
      case 'PostgreSQL':
        return LanguageIdEnum.PG;
      case 'MySQL':
        return LanguageIdEnum.MYSQL;
      case 'SQLServer':
        return LanguageIdEnum.MSSQL;
      default:
        return LanguageIdEnum.PG;
    }
  }

  /**
   * Get Monaco language string
   */
  private getMonacoLanguage(): string {
    switch (this.databaseType) {
      case 'PostgreSQL':
        return 'pgsql';
      case 'MySQL':
        return 'mysql';
      case 'SQLServer':
        return 'mssql';
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
