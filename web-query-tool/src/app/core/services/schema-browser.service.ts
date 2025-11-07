import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  SchemaMetadata,
  DatabaseInfo,
  SchemaInfo,
  TableInfo,
  ColumnInfo,
  DatabaseType
} from '../models/query.models';

/**
 * Schema Browser Service
 *
 * Fetches database metadata for schema tree navigation
 * Supports AWS Redshift and PostgreSQL
 * Professional feature matching DBeaver, CloudBeaver, DataGrip
 */
@Injectable({
  providedIn: 'root'
})
export class SchemaBrowserService {
  private readonly apiUrl = `${environment.apiUrlHttps}/api/v1/schema`;

  // Cache schema metadata per connection
  private schemaCache = new Map<string, SchemaMetadata>();

  // Signal for current schema metadata
  currentSchema = signal<SchemaMetadata | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Fetch schema metadata for a connection
   * For AWS Redshift and PostgreSQL
   */
  fetchSchemaMetadata(connectionId: string, databaseType: DatabaseType): Observable<SchemaMetadata> {
    // Check cache first
    const cached = this.schemaCache.get(connectionId);
    if (cached) {
      return of(cached);
    }

    this.isLoading.set(true);
    this.error.set(null);

    return this.http
      .get<SchemaMetadata>(`${this.apiUrl}/${connectionId}`)
      .pipe(
        map((metadata) => {
          // Cache the result
          this.schemaCache.set(connectionId, metadata);
          this.currentSchema.set(metadata);
          this.isLoading.set(false);
          return metadata;
        }),
        catchError((error) => {
          console.error('[SchemaBrowserService] Failed to fetch schema:', error);
          this.error.set(error.message || 'Failed to fetch schema metadata');
          this.isLoading.set(false);

          // Return mock data for development/demo
          const mockMetadata = this.getMockSchemaMetadata(connectionId, databaseType);
          this.schemaCache.set(connectionId, mockMetadata);
          this.currentSchema.set(mockMetadata);
          return of(mockMetadata);
        })
      );
  }

  /**
   * Refresh schema metadata (clear cache and refetch)
   */
  refreshSchema(connectionId: string, databaseType: DatabaseType): Observable<SchemaMetadata> {
    this.schemaCache.delete(connectionId);
    return this.fetchSchemaMetadata(connectionId, databaseType);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.schemaCache.clear();
    this.currentSchema.set(null);
  }

  /**
   * Generate mock schema metadata for AWS Redshift/PostgreSQL
   * This simulates what the backend API will return
   */
  private getMockSchemaMetadata(connectionId: string, databaseType: DatabaseType): SchemaMetadata {
    if (databaseType === DatabaseType.Redshift) {
      return this.getRedshiftMockSchema(connectionId);
    } else if (databaseType === DatabaseType.PostgreSQL) {
      return this.getPostgreSQLMockSchema(connectionId);
    }

    // Default mock
    return {
      connectionId,
      databases: []
    };
  }

  /**
   * Mock AWS Redshift schema
   */
  private getRedshiftMockSchema(connectionId: string): SchemaMetadata {
    return {
      connectionId,
      databases: [
        {
          name: 'analytics_db',
          schemas: [
            {
              name: 'public',
              tables: [
                {
                  name: 'customers',
                  schema: 'public',
                  rowCount: 125000,
                  columns: [
                    { name: 'customer_id', dataType: 'bigint', nullable: false, isPrimaryKey: true },
                    { name: 'first_name', dataType: 'varchar(100)', nullable: false, maxLength: 100 },
                    { name: 'last_name', dataType: 'varchar(100)', nullable: false, maxLength: 100 },
                    { name: 'email', dataType: 'varchar(255)', nullable: true, maxLength: 255 },
                    { name: 'created_at', dataType: 'timestamp', nullable: false },
                    { name: 'updated_at', dataType: 'timestamp', nullable: true }
                  ]
                },
                {
                  name: 'orders',
                  schema: 'public',
                  rowCount: 450000,
                  columns: [
                    { name: 'order_id', dataType: 'bigint', nullable: false, isPrimaryKey: true },
                    { name: 'customer_id', dataType: 'bigint', nullable: false, isForeignKey: true },
                    { name: 'order_date', dataType: 'date', nullable: false },
                    { name: 'total_amount', dataType: 'decimal(10,2)', nullable: false },
                    { name: 'status', dataType: 'varchar(50)', nullable: false, maxLength: 50 },
                    { name: 'created_at', dataType: 'timestamp', nullable: false }
                  ]
                },
                {
                  name: 'products',
                  schema: 'public',
                  rowCount: 5000,
                  columns: [
                    { name: 'product_id', dataType: 'bigint', nullable: false, isPrimaryKey: true },
                    { name: 'product_name', dataType: 'varchar(200)', nullable: false, maxLength: 200 },
                    { name: 'category', dataType: 'varchar(100)', nullable: true, maxLength: 100 },
                    { name: 'price', dataType: 'decimal(10,2)', nullable: false },
                    { name: 'stock_quantity', dataType: 'integer', nullable: false }
                  ]
                }
              ],
              views: [
                {
                  name: 'customer_orders_view',
                  schema: 'public',
                  definition: 'SELECT c.customer_id, c.first_name, c.last_name, COUNT(o.order_id) as order_count FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.first_name, c.last_name'
                }
              ]
            },
            {
              name: 'reporting',
              tables: [
                {
                  name: 'daily_sales',
                  schema: 'reporting',
                  rowCount: 1825,
                  columns: [
                    { name: 'sale_date', dataType: 'date', nullable: false, isPrimaryKey: true },
                    { name: 'total_sales', dataType: 'decimal(12,2)', nullable: false },
                    { name: 'order_count', dataType: 'integer', nullable: false },
                    { name: 'avg_order_value', dataType: 'decimal(10,2)', nullable: true }
                  ]
                }
              ],
              views: []
            }
          ]
        }
      ]
    };
  }

  /**
   * Mock PostgreSQL schema
   */
  private getPostgreSQLMockSchema(connectionId: string): SchemaMetadata {
    return {
      connectionId,
      databases: [
        {
          name: 'production_db',
          schemas: [
            {
              name: 'public',
              tables: [
                {
                  name: 'users',
                  schema: 'public',
                  rowCount: 50000,
                  columns: [
                    { name: 'user_id', dataType: 'uuid', nullable: false, isPrimaryKey: true },
                    { name: 'username', dataType: 'varchar(50)', nullable: false, maxLength: 50 },
                    { name: 'email', dataType: 'varchar(255)', nullable: false, maxLength: 255 },
                    { name: 'password_hash', dataType: 'varchar(255)', nullable: false, maxLength: 255 },
                    { name: 'is_active', dataType: 'boolean', nullable: false, defaultValue: 'true' },
                    { name: 'created_at', dataType: 'timestamp with time zone', nullable: false }
                  ]
                },
                {
                  name: 'posts',
                  schema: 'public',
                  rowCount: 200000,
                  columns: [
                    { name: 'post_id', dataType: 'uuid', nullable: false, isPrimaryKey: true },
                    { name: 'user_id', dataType: 'uuid', nullable: false, isForeignKey: true },
                    { name: 'title', dataType: 'varchar(200)', nullable: false, maxLength: 200 },
                    { name: 'content', dataType: 'text', nullable: true },
                    { name: 'published_at', dataType: 'timestamp with time zone', nullable: true },
                    { name: 'created_at', dataType: 'timestamp with time zone', nullable: false }
                  ]
                },
                {
                  name: 'comments',
                  schema: 'public',
                  rowCount: 850000,
                  columns: [
                    { name: 'comment_id', dataType: 'uuid', nullable: false, isPrimaryKey: true },
                    { name: 'post_id', dataType: 'uuid', nullable: false, isForeignKey: true },
                    { name: 'user_id', dataType: 'uuid', nullable: false, isForeignKey: true },
                    { name: 'comment_text', dataType: 'text', nullable: false },
                    { name: 'created_at', dataType: 'timestamp with time zone', nullable: false }
                  ]
                }
              ],
              views: [
                {
                  name: 'active_users_view',
                  schema: 'public',
                  definition: 'SELECT * FROM users WHERE is_active = true'
                }
              ]
            },
            {
              name: 'analytics',
              tables: [
                {
                  name: 'user_activity',
                  schema: 'analytics',
                  rowCount: 2500000,
                  columns: [
                    { name: 'activity_id', dataType: 'bigserial', nullable: false, isPrimaryKey: true },
                    { name: 'user_id', dataType: 'uuid', nullable: false, isForeignKey: true },
                    { name: 'activity_type', dataType: 'varchar(50)', nullable: false, maxLength: 50 },
                    { name: 'activity_timestamp', dataType: 'timestamp with time zone', nullable: false },
                    { name: 'metadata', dataType: 'jsonb', nullable: true }
                  ]
                }
              ],
              views: []
            }
          ]
        }
      ]
    };
  }
}
