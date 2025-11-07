/**
 * Core Query Models
 * These models define the data structures for query execution
 */

export interface QueryRequest {
  /** Base64-encoded SQL query (CRITICAL: for Imperva WAF bypass) */
  queryEncoded: string;
  /** Database connection identifier */
  connectionId: string;
  /** Query execution options */
  executionOptions: QueryExecutionOptions;
}

export interface QueryExecutionOptions {
  /** Maximum number of rows to return */
  maxRows: number;
  /** Query timeout in seconds */
  timeout: number;
}

export interface QueryResult {
  /** Query result rows (dynamic objects) */
  rows: any[];
  /** Total number of rows returned */
  totalRows: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Query execution timestamp */
  timestamp: Date;
  /** Optional: column metadata */
  columns?: ColumnMetadata[];
}

export interface ColumnMetadata {
  name: string;
  dataType: string;
  nullable: boolean;
}

export interface QueryError {
  error: string;
  details?: string;
  timestamp: Date;
}

export interface DatabaseConnection {
  id: string;
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  isActive: boolean;
}

export enum DatabaseType {
  PostgreSQL = 'PostgreSQL',
  MySQL = 'MySQL',
  SQLServer = 'SQLServer',
  Redshift = 'Redshift'
}

export interface QueryHistory {
  id: string;
  sql: string;
  executionTime: number;
  rowCount: number;
  timestamp: Date;
  connectionId: string;
  status: 'success' | 'error';
}

/**
 * Database Schema Browser Models
 * For left-side navigation tree (like DBeaver/CloudBeaver)
 */

export interface DatabaseObject {
  name: string;
  type: 'database' | 'schema' | 'table' | 'view' | 'column';
  expanded?: boolean;
  children?: DatabaseObject[];
}

export interface SchemaMetadata {
  connectionId: string;
  databases: DatabaseInfo[];
}

export interface DatabaseInfo {
  name: string;
  schemas: SchemaInfo[];
}

export interface SchemaInfo {
  name: string;
  tables: TableInfo[];
  views: ViewInfo[];
}

export interface TableInfo {
  name: string;
  schema: string;
  rowCount?: number;
  columns: ColumnInfo[];
}

export interface ViewInfo {
  name: string;
  schema: string;
  definition?: string;
}

export interface ColumnInfo {
  name: string;
  dataType: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  defaultValue?: string;
  maxLength?: number;
}
