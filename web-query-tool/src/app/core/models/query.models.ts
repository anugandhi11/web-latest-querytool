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
