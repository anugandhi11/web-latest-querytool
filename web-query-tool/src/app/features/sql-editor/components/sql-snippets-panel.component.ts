import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SQL Snippets Panel Component
 *
 * Provides pre-built SQL query templates for common operations
 * Inspired by DBeaver, DataGrip, TablePlus
 */

interface SQLSnippet {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  icon: string;
}

@Component({
  selector: 'app-sql-snippets-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="snippets-panel">
      <div class="panel-header">
        <h3 class="panel-title">📚 SQL Snippets</h3>
        <button class="btn-close" (click)="close()">✕</button>
      </div>

      <!-- Category Tabs -->
      <div class="category-tabs">
        @for (category of categories; track category) {
          <button
            class="category-tab"
            [class.active]="selectedCategory() === category"
            (click)="selectCategory(category)">
            {{ category }}
          </button>
        }
      </div>

      <!-- Snippets List -->
      <div class="snippets-list">
        @for (snippet of filteredSnippets(); track snippet.id) {
          <div class="snippet-item" (click)="useSnippet(snippet)">
            <div class="snippet-header">
              <span class="snippet-icon">{{ snippet.icon }}</span>
              <span class="snippet-name">{{ snippet.name }}</span>
            </div>
            <div class="snippet-desc">{{ snippet.description }}</div>
            <pre class="snippet-preview">{{ snippet.template.trim().split('\\n').slice(0, 2).join('\\n') }}...</pre>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .snippets-panel {
      width: 350px;
      height: 100%;
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-tertiary);
    }

    .panel-title {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-inverse);
    }

    .btn-close {
      background: transparent;
      border: none;
      font-size: 1.2rem;
      color: var(--text-secondary);
      cursor: pointer;
      padding: var(--spacing-xs);
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
    }

    .btn-close:hover {
      background: var(--bg-hover);
      color: var(--text-inverse);
    }

    .category-tabs {
      display: flex;
      gap: var(--spacing-xs);
      padding: var(--spacing-sm);
      border-bottom: 1px solid var(--border-primary);
      overflow-x: auto;
    }

    .category-tab {
      padding: var(--spacing-xs) var(--spacing-sm);
      background: transparent;
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.75rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition-fast);
    }

    .category-tab:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    .category-tab.active {
      background: var(--primary-500);
      border-color: var(--primary-500);
      color: white;
    }

    .snippets-list {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-sm);
    }

    .snippet-item {
      padding: var(--spacing-sm);
      background: var(--bg-tertiary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .snippet-item:hover {
      border-color: var(--primary-500);
      background: var(--bg-hover);
      transform: translateX(4px);
    }

    .snippet-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-xs);
    }

    .snippet-icon {
      font-size: 1.2rem;
    }

    .snippet-name {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-inverse);
    }

    .snippet-desc {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xs);
    }

    .snippet-preview {
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 0.7rem;
      color: var(--text-primary);
      background: var(--bg-primary);
      padding: var(--spacing-xs);
      border-radius: var(--radius-sm);
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .snippets-list::-webkit-scrollbar {
      width: 8px;
    }

    .snippets-list::-webkit-scrollbar-track {
      background: var(--bg-secondary);
    }

    .snippets-list::-webkit-scrollbar-thumb {
      background: var(--border-primary);
      border-radius: 4px;
    }
  `]
})
export class SqlSnippetsPanelComponent {
  @Output() snippetSelected = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  selectedCategory = signal('Basic');

  categories = ['All', 'Basic', 'Joins', 'Aggregations', 'Analytics', 'DDL'];

  snippets: SQLSnippet[] = [
    // Basic Queries
    {
      id: 'select-all',
      name: 'SELECT All',
      description: 'Select all columns from a table',
      category: 'Basic',
      icon: '📋',
      template: 'SELECT *\nFROM table_name\nLIMIT 100;'
    },
    {
      id: 'select-where',
      name: 'SELECT with WHERE',
      description: 'Filter rows with condition',
      category: 'Basic',
      icon: '🔍',
      template: 'SELECT column1, column2\nFROM table_name\nWHERE column1 = \'value\'\nLIMIT 100;'
    },
    {
      id: 'insert',
      name: 'INSERT',
      description: 'Insert new row',
      category: 'Basic',
      icon: '➕',
      template: 'INSERT INTO table_name (column1, column2)\nVALUES (\'value1\', \'value2\');'
    },
    {
      id: 'update',
      name: 'UPDATE',
      description: 'Update existing rows',
      category: 'Basic',
      icon: '✏️',
      template: 'UPDATE table_name\nSET column1 = \'value1\'\nWHERE column2 = \'value2\';'
    },
    {
      id: 'delete',
      name: 'DELETE',
      description: 'Delete rows',
      category: 'Basic',
      icon: '🗑️',
      template: 'DELETE FROM table_name\nWHERE column = \'value\';'
    },
    // Joins
    {
      id: 'inner-join',
      name: 'INNER JOIN',
      description: 'Join two tables',
      category: 'Joins',
      icon: '🔗',
      template: 'SELECT a.*, b.*\nFROM table1 a\nINNER JOIN table2 b ON a.id = b.table1_id;'
    },
    {
      id: 'left-join',
      name: 'LEFT JOIN',
      description: 'Left outer join',
      category: 'Joins',
      icon: '◀️',
      template: 'SELECT a.*, b.*\nFROM table1 a\nLEFT JOIN table2 b ON a.id = b.table1_id;'
    },
    // Aggregations
    {
      id: 'group-by',
      name: 'GROUP BY',
      description: 'Group and aggregate data',
      category: 'Aggregations',
      icon: '📊',
      template: 'SELECT column1, COUNT(*) as count\nFROM table_name\nGROUP BY column1\nORDER BY count DESC;'
    },
    {
      id: 'count-distinct',
      name: 'COUNT DISTINCT',
      description: 'Count unique values',
      category: 'Aggregations',
      icon: '🔢',
      template: 'SELECT COUNT(DISTINCT column)\nFROM table_name;'
    },
    // Analytics
    {
      id: 'window-row-number',
      name: 'ROW_NUMBER()',
      description: 'Window function for ranking',
      category: 'Analytics',
      icon: '🪟',
      template: 'SELECT *,\n  ROW_NUMBER() OVER (PARTITION BY column1 ORDER BY column2 DESC) as row_num\nFROM table_name;'
    },
    {
      id: 'cte',
      name: 'Common Table Expression',
      description: 'WITH clause for complex queries',
      category: 'Analytics',
      icon: '🏗️',
      template: 'WITH cte_name AS (\n  SELECT column1, column2\n  FROM table_name\n  WHERE condition\n)\nSELECT *\nFROM cte_name;'
    },
    // DDL
    {
      id: 'create-table',
      name: 'CREATE TABLE',
      description: 'Create new table',
      category: 'DDL',
      icon: '🏗️',
      template: 'CREATE TABLE table_name (\n  id SERIAL PRIMARY KEY,\n  column1 VARCHAR(255),\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);'
    },
    {
      id: 'describe-table',
      name: 'DESCRIBE TABLE',
      description: 'Show table structure',
      category: 'DDL',
      icon: 'ℹ️',
      template: 'SELECT column_name, data_type, is_nullable\nFROM information_schema.columns\nWHERE table_name = \'table_name\';'
    }
  ];

  filteredSnippets = signal<SQLSnippet[]>(this.snippets);

  ngOnInit() {
    this.selectCategory('All');
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);

    if (category === 'All') {
      this.filteredSnippets.set(this.snippets);
    } else {
      this.filteredSnippets.set(
        this.snippets.filter(s => s.category === category)
      );
    }
  }

  useSnippet(snippet: SQLSnippet): void {
    this.snippetSelected.emit(snippet.template);
  }

  close(): void {
    this.closed.emit();
  }
}
