import { Injectable, signal, computed } from '@angular/core';
import { DatabaseConnection } from '../models/query.models';

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
   * Test connection (placeholder for actual implementation)
   */
  async testConnection(connection: DatabaseConnection): Promise<boolean> {
    // TODO: Implement actual connection test via API
    console.log('[ConnectionService] Testing connection:', connection.name);

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  }
}
