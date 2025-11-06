import { Component, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridReadyEvent,
  GridOptions,
  GridApi
} from 'ag-grid-community';
import { QueryResult } from '../../../core/models/query.models';
import { ToastService } from '../../../core/services/toast.service';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

/**
 * Query Results Grid Component
 *
 * Powered by AG Grid - Industry's #1 Data Grid
 * Used by: NASA, JP Morgan, MongoDB, Microsoft
 *
 * Features:
 * - Virtual scrolling (handles millions of rows)
 * - Excel-like filtering and sorting
 * - Column resizing and reordering
 * - CSV/Excel export
 * - Cell selection and copying
 * - High performance rendering
 */
@Component({
  selector: 'app-query-results-grid',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  template: `
    <div class="grid-wrapper">
      <div class="grid-toolbar">
        <div class="grid-info">
          <span class="row-count">
            {{ rowCount() }} rows
            @if (executionTime() > 0) {
              <span class="execution-time">
                • {{ executionTime() }}ms
              </span>
            }
          </span>
        </div>

        <div class="grid-actions">
          <button class="btn btn-secondary" (click)="copyAsJSON()" title="Copy all data as JSON">
            📋 Copy as JSON
          </button>
          <button class="btn btn-secondary" (click)="copyAsCSV()" title="Copy all data as CSV">
            📋 Copy as CSV
          </button>
          <button class="btn btn-secondary" (click)="exportToCsv()">
            💾 Export CSV
          </button>
          <button class="btn btn-secondary" (click)="autoSizeAll()">
            ↔️ Auto-size
          </button>
          <button class="btn btn-secondary" (click)="clearFilters()">
            🔍 Clear Filters
          </button>
        </div>
      </div>

      @if (rowData().length > 0) {
        <ag-grid-angular
          class="ag-theme-alpine-dark"
          [rowData]="rowData()"
          [columnDefs]="columnDefs()"
          [gridOptions]="gridOptions"
          [defaultColDef]="defaultColDef"
          (gridReady)="onGridReady($event)"
          style="width: 100%; height: 600px;">
        </ag-grid-angular>
      } @else {
        <div class="no-data">
          <div class="no-data-icon">📊</div>
          <div class="no-data-text">No data to display</div>
          <div class="no-data-hint">Execute a query to see results here</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .grid-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }

    .grid-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
    }

    .grid-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .row-count {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .execution-time {
      color: #666;
      font-weight: normal;
    }

    .grid-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 6px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 13px;
    }

    .btn:hover {
      background: #f0f0f0;
    }

    .btn-secondary {
      background: white;
      color: #333;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 600px;
      background: #fafafa;
    }

    .no-data-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-data-text {
      font-size: 18px;
      font-weight: 500;
      color: #666;
      margin-bottom: 8px;
    }

    .no-data-hint {
      font-size: 14px;
      color: #999;
    }

    /* AG Grid Theme Customization */
    :host ::ng-deep .ag-theme-alpine-dark {
      --ag-header-background-color: #2d2d2d;
      --ag-odd-row-background-color: #1e1e1e;
      --ag-background-color: #252525;
    }

    :host ::ng-deep .number-cell {
      text-align: right;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    }

    :host ::ng-deep .date-cell {
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    }
  `]
})
export class QueryResultsGridComponent {
  private toast = inject(ToastService);

  // Angular 19 signals for reactive state
  rowData = signal<any[]>([]);
  columnDefs = signal<ColDef[]>([]);
  rowCount = signal(0);
  executionTime = signal(0);

  private gridApi: GridApi | null = null;

  /**
   * AG Grid Default Column Configuration
   * These settings apply to all columns unless overridden
   */
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    editable: false,

    // Column width
    minWidth: 100,
    flex: 1
  };

  /**
   * AG Grid Configuration
   * Features: Pagination, Range Selection, Filtering
   */
  gridOptions: GridOptions = {
    // Performance
    rowBuffer: 10,
    rowModelType: 'clientSide',

    // Features
    enableRangeSelection: true,
    enableCharts: false, // Set to true for AG Grid Enterprise

    // Pagination
    pagination: true,
    paginationPageSize: 100,
    paginationPageSizeSelector: [50, 100, 500, 1000, 5000],

    // Styling
    suppressMenuHide: true,
    animateRows: true,

    // Selection
    rowSelection: {
      mode: 'multiRow',
      checkboxes: false,
      enableClickSelection: true
    },

    // Accessibility
    suppressContextMenu: false
  };

  /**
   * Grid Ready Event - Store API reference
   */
  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    console.log('[QueryResultsGrid] Grid initialized');
  }

  /**
   * Display query results in grid
   * This is the main method called from parent components
   */
  displayQueryResults(result: QueryResult): void {
    console.log('[QueryResultsGrid] Displaying results:', {
      rows: result.totalRows,
      executionTime: result.executionTimeMs
    });

    this.rowCount.set(result.totalRows);
    this.executionTime.set(result.executionTimeMs);

    // Auto-generate column definitions from data
    if (result.rows.length > 0) {
      const firstRow = result.rows[0];
      const columns: ColDef[] = Object.keys(firstRow).map(key => ({
        headerName: key,
        field: key,

        // Smart column type detection
        ...this.detectColumnType(firstRow[key]),

        // Custom cell renderer for special types
        valueFormatter: this.getValueFormatter(firstRow[key])
      }));

      this.columnDefs.set(columns);
    }

    this.rowData.set(result.rows);

    // Auto-size columns after a short delay (allows grid to render)
    setTimeout(() => {
      this.autoSizeAll();
    }, 100);
  }

  /**
   * Detect column data type for better filtering/sorting
   */
  private detectColumnType(value: any): Partial<ColDef> {
    if (value === null || value === undefined) {
      return { filter: 'agTextColumnFilter' };
    }

    // Number type
    if (typeof value === 'number') {
      return {
        filter: 'agNumberColumnFilter',
        cellClass: 'number-cell',
        type: 'numericColumn'
      };
    }

    // Date type
    if (value instanceof Date || this.isDateString(value)) {
      return {
        filter: 'agDateColumnFilter',
        cellClass: 'date-cell'
      };
    }

    // Boolean type
    if (typeof value === 'boolean') {
      return {
        filter: 'agSetColumnFilter',
        cellRenderer: (params: any) => params.value ? '✓' : '✗'
      };
    }

    // Default: Text
    return { filter: 'agTextColumnFilter' };
  }

  /**
   * Check if string is a date
   */
  private isDateString(value: any): boolean {
    if (typeof value !== 'string') return false;

    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    return dateRegex.test(value) && !isNaN(Date.parse(value));
  }

  /**
   * Get value formatter for cell display
   */
  private getValueFormatter(value: any): ((params: any) => string) | undefined {
    if (value instanceof Date || this.isDateString(value)) {
      return (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        return date.toLocaleString();
      };
    }

    if (value === null || value === undefined) {
      return (params) => params.value === null ? 'NULL' : '';
    }

    return undefined;
  }

  /**
   * Export to CSV
   * AG Grid has built-in export - use it!
   */
  exportToCsv(): void {
    if (!this.gridApi) return;

    this.gridApi.exportDataAsCsv({
      fileName: `query_results_${new Date().toISOString()}.csv`,
      allColumns: true
    });

    console.log('[QueryResultsGrid] Exported to CSV');
  }

  /**
   * Export to Excel using SheetJS (xlsx library)
   * Professional Excel export with formatting
   */
  exportToExcel(): void {
    const data = this.rowData();
    if (data.length === 0) {
      this.toast.warning('No data to export');
      return;
    }

    try {
      // Create worksheet from JSON data
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Auto-size columns
      const columns = this.columnDefs();
      const columnWidths = columns.map(col => ({
        wch: Math.max(
          col.field?.length || 10,
          ...data.slice(0, 100).map(row => String(row[col.field || '']).length)
        )
      }));
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Query Results');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `query_results_${timestamp}.xlsx`;

      // Write file
      XLSX.writeFile(workbook, filename);

      this.toast.success(`Exported ${data.length} rows to Excel: ${filename}`);
      console.log('[QueryResultsGrid] Exported to Excel:', filename);
    } catch (error) {
      console.error('[QueryResultsGrid] Excel export failed:', error);
      this.toast.error('Failed to export to Excel');
    }
  }

  /**
   * Auto-size all columns to fit content
   */
  autoSizeAll(): void {
    if (!this.gridApi) return;

    this.gridApi.autoSizeAllColumns();
    console.log('[QueryResultsGrid] Auto-sized columns');
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    if (!this.gridApi) return;

    this.gridApi.setFilterModel(null);
    console.log('[QueryResultsGrid] Cleared filters');
  }

  /**
   * Copy data as JSON to clipboard
   */
  async copyAsJSON(): Promise<void> {
    const data = this.rowData();

    if (data.length === 0) {
      this.toast.warning('No data to copy');
      return;
    }

    try {
      const jsonString = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      this.toast.success(`Copied ${data.length} rows as JSON to clipboard!`);
      console.log('[QueryResultsGrid] Copied as JSON');
    } catch (error) {
      this.toast.error('Failed to copy to clipboard');
      console.error('[QueryResultsGrid] Copy failed:', error);
    }
  }

  /**
   * Copy data as CSV to clipboard
   */
  async copyAsCSV(): Promise<void> {
    const data = this.rowData();

    if (data.length === 0) {
      this.toast.warning('No data to copy');
      return;
    }

    try {
      // Get column headers
      const columns = this.columnDefs().map(col => col.field || '');

      // Create CSV header
      const csvHeader = columns.join(',');

      // Create CSV rows
      const csvRows = data.map(row => {
        return columns.map(col => {
          const value = row[col];
          // Escape values with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',');
      });

      const csv = [csvHeader, ...csvRows].join('\n');

      await navigator.clipboard.writeText(csv);
      this.toast.success(`Copied ${data.length} rows as CSV to clipboard!`);
      console.log('[QueryResultsGrid] Copied as CSV');
    } catch (error) {
      this.toast.error('Failed to copy to clipboard');
      console.error('[QueryResultsGrid] Copy failed:', error);
    }
  }

  /**
   * Clear grid data
   */
  clearGrid(): void {
    this.rowData.set([]);
    this.columnDefs.set([]);
    this.rowCount.set(0);
    this.executionTime.set(0);
  }
}
