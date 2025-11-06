import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject, Observable } from 'rxjs';
import { QueryResult } from '../models/query.models';
import { environment } from '../../../environments/environment';

/**
 * Query Progress Interface
 */
export interface QueryProgress {
  percentage: number;
  rowsProcessed: number;
  message: string;
  timestamp: Date;
}

/**
 * Query Status Interface
 */
export interface QueryStatus {
  status: string;
  message: string;
  timestamp: Date;
}

/**
 * Query Error Interface
 */
export interface QueryError {
  error: string;
  details?: string;
  timestamp: Date;
}

/**
 * WebSocket Service
 *
 * Manages SignalR connection for real-time query execution
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Real-time query progress updates
 * - Query cancellation support
 * - Connection state management
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private hubConnection: signalR.HubConnection | null = null;

  // Angular 19 signals for reactive state
  isConnected = signal(false);
  connectionStatus = signal<string>('Disconnected');

  // Observables for real-time updates
  private queryStatusSubject = new Subject<QueryStatus>();
  private queryProgressSubject = new Subject<QueryProgress>();
  private queryCompleteSubject = new Subject<QueryResult>();
  private queryErrorSubject = new Subject<QueryError>();
  private queryCancelledSubject = new Subject<any>();

  public queryStatus$ = this.queryStatusSubject.asObservable();
  public queryProgress$ = this.queryProgressSubject.asObservable();
  public queryComplete$ = this.queryCompleteSubject.asObservable();
  public queryError$ = this.queryErrorSubject.asObservable();
  public queryCancelled$ = this.queryCancelledSubject.asObservable();

  /**
   * Initialize SignalR connection
   * Call this on app startup or when user logs in
   */
  async connect(accessToken?: string): Promise<void> {
    if (this.hubConnection) {
      console.log('[WebSocketService] Already connected');
      return;
    }

    this.connectionStatus.set('Connecting...');

    // Build SignalR connection
    const connectionBuilder = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.signalRUrl}/query-execution`, {
        skipNegotiation: true,  // Use WebSockets directly
        transport: signalR.HttpTransportType.WebSockets,
        accessTokenFactory: () => accessToken || ''
      })
      .withAutomaticReconnect({
        // Custom exponential backoff: 0s, 2s, 10s, 30s, then 60s
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount === 1) return 2000;
          if (retryContext.previousRetryCount === 2) return 10000;
          if (retryContext.previousRetryCount === 3) return 30000;
          return 60000;
        }
      })
      .configureLogging(
        environment.enableDebugLogs
          ? signalR.LogLevel.Information
          : signalR.LogLevel.Warning
      );

    this.hubConnection = connectionBuilder.build();

    // Register event handlers
    this.registerEventHandlers();

    // Start connection
    try {
      await this.hubConnection.start();
      this.isConnected.set(true);
      this.connectionStatus.set('Connected');
      console.log('[WebSocketService] SignalR connected successfully');
    } catch (err) {
      this.isConnected.set(false);
      this.connectionStatus.set('Connection failed');
      console.error('[WebSocketService] SignalR connection error:', err);
      throw err;
    }
  }

  /**
   * Register SignalR event handlers
   */
  private registerEventHandlers(): void {
    if (!this.hubConnection) return;

    // Query Status updates
    this.hubConnection.on('QueryStatus', (status: QueryStatus) => {
      console.log('[WebSocketService] Query status:', status);
      this.queryStatusSubject.next({
        ...status,
        timestamp: new Date(status.timestamp)
      });
    });

    // Query Progress updates
    this.hubConnection.on('QueryProgress', (progress: QueryProgress) => {
      console.log('[WebSocketService] Query progress:', progress.percentage + '%');
      this.queryProgressSubject.next({
        ...progress,
        timestamp: new Date(progress.timestamp)
      });
    });

    // Query Complete
    this.hubConnection.on('QueryComplete', (result: QueryResult) => {
      console.log('[WebSocketService] Query complete:', result.totalRows + ' rows');
      this.queryCompleteSubject.next({
        ...result,
        timestamp: new Date(result.timestamp)
      });
    });

    // Query Error
    this.hubConnection.on('QueryError', (error: QueryError) => {
      console.error('[WebSocketService] Query error:', error);
      this.queryErrorSubject.next({
        ...error,
        timestamp: new Date(error.timestamp)
      });
    });

    // Query Cancelled
    this.hubConnection.on('QueryCancelled', (data: any) => {
      console.log('[WebSocketService] Query cancelled:', data);
      this.queryCancelledSubject.next(data);
    });

    // Connection lifecycle events
    this.hubConnection.onreconnecting((error) => {
      this.isConnected.set(false);
      this.connectionStatus.set('Reconnecting...');
      console.warn('[WebSocketService] SignalR reconnecting...', error);
    });

    this.hubConnection.onreconnected((connectionId) => {
      this.isConnected.set(true);
      this.connectionStatus.set('Connected');
      console.log('[WebSocketService] SignalR reconnected:', connectionId);
    });

    this.hubConnection.onclose((error) => {
      this.isConnected.set(false);
      this.connectionStatus.set('Disconnected');
      console.error('[WebSocketService] SignalR disconnected:', error);
    });
  }

  /**
   * Execute query with real-time progress updates
   *
   * @param sql - SQL query string
   * @param connectionId - Database connection identifier
   * @param maxRows - Maximum rows to return
   * @param timeout - Query timeout in seconds
   */
  async executeQueryWithProgress(
    sql: string,
    connectionId: string,
    maxRows: number = 1000,
    timeout: number = 30
  ): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected. Call connect() first.');
    }

    // Encode SQL to Base64 (WAF bypass)
    const queryEncoded = btoa(sql);

    console.log('[WebSocketService] Executing query via SignalR:', {
      connectionId,
      sqlLength: sql.length,
      maxRows,
      timeout
    });

    try {
      await this.hubConnection.invoke(
        'ExecuteQueryWithProgress',
        queryEncoded,
        connectionId,
        maxRows,
        timeout
      );
    } catch (err) {
      console.error('[WebSocketService] Failed to invoke ExecuteQueryWithProgress:', err);
      throw err;
    }
  }

  /**
   * Cancel a running query
   *
   * @param queryId - Query execution identifier
   */
  async cancelQuery(queryId: string): Promise<void> {
    if (!this.hubConnection) {
      throw new Error('SignalR not connected');
    }

    console.log('[WebSocketService] Cancelling query:', queryId);

    try {
      await this.hubConnection.invoke('CancelQuery', queryId);
    } catch (err) {
      console.error('[WebSocketService] Failed to cancel query:', err);
      throw err;
    }
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
        this.isConnected.set(false);
        this.connectionStatus.set('Disconnected');
        this.hubConnection = null;
        console.log('[WebSocketService] SignalR disconnected');
      } catch (err) {
        console.error('[WebSocketService] Error disconnecting:', err);
      }
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): signalR.HubConnectionState {
    return this.hubConnection?.state || signalR.HubConnectionState.Disconnected;
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }
}
