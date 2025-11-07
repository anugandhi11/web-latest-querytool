import { Component, OnInit, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SchemaBrowserService } from '../../../core/services/schema-browser.service';
import {
  DatabaseInfo,
  SchemaInfo,
  TableInfo,
  ViewInfo,
  ColumnInfo,
  DatabaseType
} from '../../../core/models/query.models';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Database Schema Browser Component
 *
 * Professional left-side navigation tree like DBeaver/CloudBeaver
 * Displays: Databases → Schemas → Tables/Views → Columns
 * Supports: AWS Redshift, PostgreSQL
 */
@Component({
  selector: 'app-schema-browser',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="schema-browser">
      <!-- Header -->
      <div class="browser-header">
        <h3 class="browser-title">Database</h3>
        <button
          class="btn btn-sm btn-ghost"
          (click)="refreshSchema()"
          [disabled]="isLoading()"
          title="Refresh Schema">
          {{ isLoading() ? '⟳' : '🔄' }}
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-box">
        <input
          type="text"
          class="form-input"
          placeholder="Search tables..."
          [(ngModel)]="searchQuery"
          (input)="filterTrees()">
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading schema...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-state">
          <p class="text-error">⚠️ {{ error() }}</p>
          <button class="btn btn-sm btn-secondary" (click)="refreshSchema()">
            Retry
          </button>
        </div>
      }

      <!-- Schema Tree -->
      @if (!isLoading() && !error() && filteredDatabases().length > 0) {
        <div class="tree-container">
          @for (database of filteredDatabases(); track database.name) {
            <div class="tree-node">
              <!-- Database Node -->
              <div class="node-header" (click)="toggleDatabase(database.name)">
                <span class="node-icon">{{ isDatabaseExpanded(database.name) ? '📂' : '📁' }}</span>
                <span class="node-label">{{ database.name }}</span>
                <span class="node-badge">{{ getSchemaCount(database) }}</span>
              </div>

              <!-- Schemas -->
              @if (isDatabaseExpanded(database.name)) {
                <div class="node-children">
                  @for (schema of database.schemas; track schema.name) {
                    <div class="tree-node">
                      <!-- Schema Node -->
                      <div class="node-header" (click)="toggleSchema(database.name + '.' + schema.name)">
                        <span class="node-icon">{{ isSchemaExpanded(database.name + '.' + schema.name) ? '📂' : '📁' }}</span>
                        <span class="node-label">{{ schema.name }}</span>
                        <span class="node-badge">{{ schema.tables.length + schema.views.length }}</span>
                      </div>

                      <!-- Tables & Views -->
                      @if (isSchemaExpanded(database.name + '.' + schema.name)) {
                        <div class="node-children">
                          <!-- Tables -->
                          @for (table of schema.tables; track table.name) {
                            <div class="tree-node">
                              <div
                                class="node-header table-node"
                                (click)="toggleTable(table.schema + '.' + table.name)"
                                (dblclick)="selectTable(table)"
                                [class.selected]="selectedTable()?.name === table.name">
                                <span class="node-icon">{{ isTableExpanded(table.schema + '.' + table.name) ? '🗃️' : '📊' }}</span>
                                <span class="node-label">{{ table.name }}</span>
                                @if (table.rowCount !== undefined) {
                                  <span class="node-count">{{ formatRowCount(table.rowCount) }}</span>
                                }
                              </div>

                              <!-- Columns -->
                              @if (isTableExpanded(table.schema + '.' + table.name)) {
                                <div class="node-children columns">
                                  @for (column of table.columns; track column.name) {
                                    <div class="column-item" [title]="getColumnTooltip(column)">
                                      <span class="column-icon">{{ getColumnIcon(column) }}</span>
                                      <span class="column-name">{{ column.name }}</span>
                                      <span class="column-type">{{ column.dataType }}</span>
                                    </div>
                                  }
                                </div>
                              }
                            </div>
                          }

                          <!-- Views -->
                          @for (view of schema.views; track view.name) {
                            <div class="tree-node">
                              <div
                                class="node-header view-node"
                                (dblclick)="selectView(view)">
                                <span class="node-icon">👁️</span>
                                <span class="node-label">{{ view.name }}</span>
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading() && !error() && filteredDatabases().length === 0) {
        <div class="empty-state">
          <p>No tables found</p>
          <small>Try different search terms</small>
        </div>
      }
    </div>
  `,
  styles: [`
    .schema-browser {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-elevated);
      border-right: 1px solid var(--border-primary);
      overflow: hidden;
    }

    .browser-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-secondary);
    }

    .browser-title {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-inverse);
    }

    .search-box {
      padding: var(--spacing-sm);
      border-bottom: 1px solid var(--border-primary);
    }

    .search-box input {
      width: 100%;
      font-size: 0.8125rem;
    }

    .tree-container {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-xs);
    }

    .tree-node {
      margin-bottom: var(--spacing-xs);
    }

    .node-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: 0.375rem 0.5rem;
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: background var(--transition-fast);
      user-select: none;
    }

    .node-header:hover {
      background: var(--bg-hover);
    }

    .node-header.selected {
      background: var(--primary-600);
      color: white;
    }

    .node-icon {
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .node-label {
      flex: 1;
      font-size: 0.8125rem;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .node-header.selected .node-label {
      color: white;
    }

    .node-badge {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      padding: 0.125rem 0.375rem;
      background: var(--bg-tertiary);
      border-radius: var(--radius-sm);
    }

    .node-count {
      font-size: 0.7rem;
      color: var(--text-tertiary);
    }

    .node-children {
      margin-left: 1rem;
      border-left: 1px solid var(--border-secondary);
      padding-left: 0.5rem;
      margin-top: var(--spacing-xs);
    }

    .node-children.columns {
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      padding: var(--spacing-xs);
      margin-top: 0;
    }

    .column-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: 0.25rem 0.375rem;
      font-size: 0.75rem;
      border-radius: var(--radius-sm);
      cursor: default;
    }

    .column-item:hover {
      background: var(--bg-hover);
    }

    .column-icon {
      font-size: 0.75rem;
    }

    .column-name {
      flex: 1;
      color: var(--text-primary);
      font-family: 'JetBrains Mono', monospace;
    }

    .column-type {
      font-size: 0.7rem;
      color: var(--text-tertiary);
    }

    .table-node {
      font-weight: 500;
    }

    .view-node {
      font-style: italic;
    }

    .loading-state,
    .error-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl);
      text-align: center;
      color: var(--text-secondary);
    }

    .loading-state .spinner {
      margin-bottom: var(--spacing-md);
    }

    .empty-state small {
      color: var(--text-tertiary);
      margin-top: var(--spacing-xs);
    }
  `]
})
export class SchemaBrowserComponent implements OnInit {
  @Input() connectionId: string = '';
  @Input() databaseType: DatabaseType = DatabaseType.PostgreSQL;

  @Output() tableSelected = new EventEmitter<TableInfo>();
  @Output() viewSelected = new EventEmitter<ViewInfo>();

  private schemaBrowser = inject(SchemaBrowserService);
  private toast = inject(ToastService);

  isLoading = this.schemaBrowser.isLoading;
  error = this.schemaBrowser.error;
  schemaMetadata = this.schemaBrowser.currentSchema;

  searchQuery = '';
  expandedNodes = new Set<string>();
  selectedTable = signal<TableInfo | null>(null);

  // Computed filtered databases
  filteredDatabases = computed(() => {
    const metadata = this.schemaMetadata();
    if (!metadata) return [];

    if (!this.searchQuery.trim()) {
      return metadata.databases;
    }

    const query = this.searchQuery.toLowerCase();
    return metadata.databases
      .map(db => ({
        ...db,
        schemas: db.schemas
          .map(schema => ({
            ...schema,
            tables: schema.tables.filter(t =>
              t.name.toLowerCase().includes(query) ||
              schema.name.toLowerCase().includes(query)
            ),
            views: schema.views.filter(v =>
              v.name.toLowerCase().includes(query)
            )
          }))
          .filter(schema => schema.tables.length > 0 || schema.views.length > 0)
      }))
      .filter(db => db.schemas.length > 0);
  });

  ngOnInit(): void {
    if (this.connectionId) {
      this.loadSchema();
    }
  }

  loadSchema(): void {
    this.schemaBrowser.fetchSchemaMetadata(this.connectionId, this.databaseType).subscribe({
      next: (metadata) => {
        console.log('[SchemaBrowser] Loaded schema:', metadata);
        // Auto-expand first database and schema
        if (metadata.databases.length > 0) {
          const firstDb = metadata.databases[0];
          this.expandedNodes.add(firstDb.name);
          if (firstDb.schemas.length > 0) {
            this.expandedNodes.add(`${firstDb.name}.${firstDb.schemas[0].name}`);
          }
        }
      },
      error: (err) => {
        console.error('[SchemaBrowser] Error loading schema:', err);
      }
    });
  }

  refreshSchema(): void {
    this.schemaBrowser.refreshSchema(this.connectionId, this.databaseType).subscribe({
      next: () => {
        this.toast.success('Schema refreshed');
      }
    });
  }

  filterTrees(): void {
    // Trigger recomputation by accessing signal
    this.filteredDatabases();
  }

  toggleDatabase(name: string): void {
    if (this.expandedNodes.has(name)) {
      this.expandedNodes.delete(name);
    } else {
      this.expandedNodes.add(name);
    }
  }

  toggleSchema(path: string): void {
    if (this.expandedNodes.has(path)) {
      this.expandedNodes.delete(path);
    } else {
      this.expandedNodes.add(path);
    }
  }

  toggleTable(path: string): void {
    if (this.expandedNodes.has(path)) {
      this.expandedNodes.delete(path);
    } else {
      this.expandedNodes.add(path);
    }
  }

  isDatabaseExpanded(name: string): boolean {
    return this.expandedNodes.has(name);
  }

  isSchemaExpanded(path: string): boolean {
    return this.expandedNodes.has(path);
  }

  isTableExpanded(path: string): boolean {
    return this.expandedNodes.has(path);
  }

  selectTable(table: TableInfo): void {
    this.selectedTable.set(table);
    this.tableSelected.emit(table);
    this.toast.success(`Selected table: ${table.schema}.${table.name}`);
  }

  selectView(view: ViewInfo): void {
    this.viewSelected.emit(view);
    this.toast.success(`Selected view: ${view.schema}.${view.name}`);
  }

  getSchemaCount(database: DatabaseInfo): string {
    return `${database.schemas.length} schemas`;
  }

  formatRowCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  getColumnIcon(column: ColumnInfo): string {
    if (column.isPrimaryKey) return '🔑';
    if (column.isForeignKey) return '🔗';
    return '📝';
  }

  getColumnTooltip(column: ColumnInfo): string {
    const parts = [
      column.name,
      column.dataType,
      column.nullable ? 'NULL' : 'NOT NULL'
    ];
    if (column.isPrimaryKey) parts.push('PRIMARY KEY');
    if (column.isForeignKey) parts.push('FOREIGN KEY');
    if (column.defaultValue) parts.push(`DEFAULT: ${column.defaultValue}`);
    return parts.join(' | ');
  }
}
