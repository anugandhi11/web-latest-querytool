import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseConnection, DatabaseType } from '../../../core/models/query.models';

/**
 * Connection Manager Component
 *
 * Manages database connections for the query tool
 *
 * Features:
 * - Add/Edit/Delete connections
 * - Test connection
 * - Switch active connection
 * - Connection persistence (localStorage)
 */
@Component({
  selector: 'app-connection-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="connection-manager">
      <div class="manager-header">
        <h2>Database Connections</h2>
        <button class="btn btn-primary" (click)="showAddConnection()">
          + Add Connection
        </button>
      </div>

      <!-- Connection List -->
      <div class="connections-list">
        @if (connections().length === 0) {
          <div class="no-connections">
            <p>No database connections configured</p>
            <button class="btn btn-primary" (click)="showAddConnection()">
              Add Your First Connection
            </button>
          </div>
        } @else {
          @for (conn of connections(); track conn.id) {
            <div class="connection-card" [class.active]="conn.isActive">
              <div class="connection-header">
                <div class="connection-type" [class]="conn.type.toLowerCase()">
                  {{ conn.type }}
                </div>
                <div class="connection-name">{{ conn.name }}</div>
              </div>

              <div class="connection-details">
                <div class="detail">
                  <span class="label">Host:</span>
                  <span class="value">{{ conn.host }}:{{ conn.port }}</span>
                </div>
                <div class="detail">
                  <span class="label">Database:</span>
                  <span class="value">{{ conn.database }}</span>
                </div>
                <div class="detail">
                  <span class="label">Username:</span>
                  <span class="value">{{ conn.username }}</span>
                </div>
              </div>

              <div class="connection-actions">
                <button class="btn btn-sm btn-test" (click)="testConnection(conn)">
                  Test
                </button>
                <button class="btn btn-sm btn-activate" (click)="setActive(conn)"
                        [disabled]="conn.isActive">
                  {{ conn.isActive ? 'Active' : 'Activate' }}
                </button>
                <button class="btn btn-sm btn-edit" (click)="editConnection(conn)">
                  Edit
                </button>
                <button class="btn btn-sm btn-delete" (click)="deleteConnection(conn)">
                  Delete
                </button>
              </div>
            </div>
          }
        }
      </div>

      <!-- Add/Edit Connection Form -->
      @if (showForm()) {
        <div class="connection-form-overlay" (click)="closeForm()">
          <div class="connection-form" (click)="$event.stopPropagation()">
            <h3>{{ editingConnection() ? 'Edit Connection' : 'Add Connection' }}</h3>

            <div class="form-group">
              <label>Connection Name</label>
              <input type="text" [(ngModel)]="formData.name" placeholder="My Database">
            </div>

            <div class="form-group">
              <label>Database Type</label>
              <select [(ngModel)]="formData.type">
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="MySQL">MySQL</option>
                <option value="SQLServer">SQL Server</option>
                <option value="Redshift">AWS Redshift</option>
              </select>
            </div>

            <div class="form-group">
              <label>Host</label>
              <input type="text" [(ngModel)]="formData.host" placeholder="localhost">
            </div>

            <div class="form-group">
              <label>Port</label>
              <input type="number" [(ngModel)]="formData.port" placeholder="5432">
            </div>

            <div class="form-group">
              <label>Database</label>
              <input type="text" [(ngModel)]="formData.database" placeholder="mydb">
            </div>

            <div class="form-group">
              <label>Username</label>
              <input type="text" [(ngModel)]="formData.username" placeholder="postgres">
            </div>

            <div class="form-group">
              <label>Password</label>
              <input type="password" [(ngModel)]="formData.password" placeholder="••••••••">
            </div>

            <div class="form-actions">
              <button class="btn btn-secondary" (click)="closeForm()">Cancel</button>
              <button class="btn btn-primary" (click)="saveConnection()">
                {{ editingConnection() ? 'Update' : 'Add' }} Connection
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .connection-manager {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .manager-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .manager-header h2 {
      margin: 0;
      font-size: 24px;
      color: #333;
    }

    .connections-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .no-connections {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .connection-card {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      transition: all 0.3s;
    }

    .connection-card.active {
      border-color: #4CAF50;
      box-shadow: 0 0 10px rgba(76, 175, 80, 0.2);
    }

    .connection-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 15px;
    }

    .connection-type {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .connection-type.postgresql {
      background: #336791;
      color: white;
    }

    .connection-type.mysql {
      background: #00758F;
      color: white;
    }

    .connection-type.sqlserver {
      background: #CC2927;
      color: white;
    }

    .connection-type.redshift {
      background: #FF9900;
      color: white;
    }

    .connection-name {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .connection-details {
      margin-bottom: 15px;
    }

    .detail {
      display: flex;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .detail .label {
      font-weight: 500;
      color: #666;
      width: 80px;
    }

    .detail .value {
      color: #333;
    }

    .connection-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
    }

    .btn-primary {
      background: #2196F3;
      color: white;
    }

    .btn-secondary {
      background: #9E9E9E;
      color: white;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 13px;
    }

    .btn-test {
      background: #FFC107;
      color: white;
    }

    .btn-activate {
      background: #4CAF50;
      color: white;
    }

    .btn-activate:disabled {
      background: #C8E6C9;
      cursor: not-allowed;
    }

    .btn-edit {
      background: #2196F3;
      color: white;
    }

    .btn-delete {
      background: #F44336;
      color: white;
    }

    .connection-form-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .connection-form {
      background: white;
      padding: 30px;
      border-radius: 8px;
      width: 500px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
    }

    .connection-form h3 {
      margin-top: 0;
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }
  `]
})
export class ConnectionManagerComponent {
  connections = signal<DatabaseConnection[]>(this.loadConnections());
  showForm = signal(false);
  editingConnection = signal<DatabaseConnection | null>(null);

  formData: any = this.getEmptyFormData();

  showAddConnection(): void {
    this.formData = this.getEmptyFormData();
    this.editingConnection.set(null);
    this.showForm.set(true);
  }

  editConnection(conn: DatabaseConnection): void {
    this.formData = { ...conn };
    this.editingConnection.set(conn);
    this.showForm.set(true);
  }

  saveConnection(): void {
    if (!this.formData.name || !this.formData.host) {
      alert('Please fill in all required fields');
      return;
    }

    const connections = this.connections();

    if (this.editingConnection()) {
      // Update existing
      const index = connections.findIndex(c => c.id === this.editingConnection()!.id);
      connections[index] = { ...this.formData };
    } else {
      // Add new
      const newConnection: DatabaseConnection = {
        ...this.formData,
        id: this.generateId(),
        isActive: connections.length === 0 // First connection is active
      };
      connections.push(newConnection);
    }

    this.connections.set([...connections]);
    this.saveConnections(connections);
    this.closeForm();
  }

  deleteConnection(conn: DatabaseConnection): void {
    if (!confirm(`Delete connection "${conn.name}"?`)) return;

    const connections = this.connections().filter(c => c.id !== conn.id);
    this.connections.set(connections);
    this.saveConnections(connections);
  }

  setActive(conn: DatabaseConnection): void {
    const connections = this.connections().map(c => ({
      ...c,
      isActive: c.id === conn.id
    }));
    this.connections.set(connections);
    this.saveConnections(connections);
  }

  testConnection(conn: DatabaseConnection): void {
    alert(`Testing connection to ${conn.name}...\n\nThis would test: ${conn.host}:${conn.port}`);
    // TODO: Implement actual connection test via API
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingConnection.set(null);
  }

  private getEmptyFormData(): any {
    return {
      name: '',
      type: 'PostgreSQL' as DatabaseType,
      host: 'localhost',
      port: 5432,
      database: '',
      username: '',
      password: '',
      isActive: false
    };
  }

  private generateId(): string {
    return 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private loadConnections(): DatabaseConnection[] {
    const stored = localStorage.getItem('database_connections');
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private saveConnections(connections: DatabaseConnection[]): void {
    localStorage.setItem('database_connections', JSON.stringify(connections));
  }
}
