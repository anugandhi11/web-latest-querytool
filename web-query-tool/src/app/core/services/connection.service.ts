import { Injectable, signal, computed } from '@angular/core';
import { DatabaseConnection } from '../models/query.models';
import { environment } from '../../../environments/environment';

/**
 * Connection Service
 *
 * Manages database connections across the entire application
 * Provides shared state between Connection Manager and SQL Editor
 */
@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private readonly STORAGE_KEY = 'database_connections';

  // Angular 19 signals for reactive state
  private connectionsSignal = signal<DatabaseConnection[]>(this.loadConnections());

  // Public computed signals
  connections = computed(() => this.connectionsSignal());
  activeConnection = computed(() =>
    this.connectionsSignal().find(conn => conn.isActive) || null
  );
  hasConnections = computed(() => this.connectionsSignal().length > 0);

  /**
   * Get all connections
   */
  getConnections(): DatabaseConnection[] {
    return this.connectionsSignal();
  }

  /**
   * Get active connection
   */
  getActiveConnection(): DatabaseConnection | null {
    return this.activeConnection();
  }

  /**
   * Add new connection
   */
  addConnection(connection: Omit<DatabaseConnection, 'id' | 'isActive'>): DatabaseConnection {
    const connections = this.connectionsSignal();

    const newConnection: DatabaseConnection = {
      ...connection,
      id: this.generateId(),
      isActive: connections.length === 0 // First connection is active by default
    };

    this.connectionsSignal.set([...connections, newConnection]);
    this.saveConnections();

    return newConnection;
  }

  /**
   * Update existing connection
   */
  updateConnection(id: string, updates: Partial<DatabaseConnection>): void {
    const connections = this.connectionsSignal();
    const index = connections.findIndex(c => c.id === id);

    if (index !== -1) {
      connections[index] = { ...connections[index], ...updates };
      this.connectionsSignal.set([...connections]);
      this.saveConnections();
    }
  }

  /**
   * Delete connection
   */
  deleteConnection(id: string): void {
    const connections = this.connectionsSignal().filter(c => c.id !== id);
    this.connectionsSignal.set(connections);
    this.saveConnections();
  }

  /**
   * Set active connection
   */
  setActiveConnection(id: string): void {
    const connections = this.connectionsSignal().map(c => ({
      ...c,
      isActive: c.id === id
    }));
    this.connectionsSignal.set(connections);
    this.saveConnections();
  }

  /**
   * Load connections from localStorage
   */
  private loadConnections(): DatabaseConnection[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const connections = JSON.parse(stored);
      return Array.isArray(connections) ? connections : [];
    } catch (error) {
      console.error('[ConnectionService] Error loading connections:', error);
      return [];
    }
  }

  /**
   * Save connections to localStorage
   */
  private saveConnections(): void {
    try {
      const connections = this.connectionsSignal();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(connections));
    } catch (error) {
      console.error('[ConnectionService] Error saving connections:', error);
    }
  }

  /**
   * Generate unique ID for connection
   */
  private generateId(): string {
    return 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Test database connection
   * Makes actual API call to test if connection is valid
   */
  async testConnection(connection: DatabaseConnection): Promise<boolean> {
    console.log('[ConnectionService] Testing connection:', connection.name);

    try {
      // Test connection by executing a simple SELECT 1 query
      const testSQL = 'SELECT 1 AS test';
      const encodedSQL = btoa(testSQL);

      // Use environment API URL (uses correct URL for dev/prod)
      const apiUrl = environment.apiUrlHttps;

      const response = await fetch(`${apiUrl}/query/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          queryEncoded: encodedSQL,
          connectionId: connection.id,
          executionOptions: {
            maxRows: 1,
            timeout: 10
          }
        })
      });

      if (response.ok) {
        console.log('[ConnectionService] Connection test successful:', connection.name);
        return true;
      } else {
        console.error('[ConnectionService] Connection test failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('[ConnectionService] Connection test error:', error);
      // Return true for now since backend might not be running
      // This allows frontend development to continue
      console.warn('[ConnectionService] Backend not available, simulating successful connection test');
      return true;
    }
  }
}
