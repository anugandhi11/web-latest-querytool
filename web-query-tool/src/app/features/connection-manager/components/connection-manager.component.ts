import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseConnection, DatabaseType } from '../../../core/models/query.models';
import { ConnectionService } from '../../../core/services/connection.service';

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
      <!-- Modern Header -->
      <div class="flex items-center justify-between mb-lg">
        <div>
          <h2 class="m-0 text-inverse font-semibold">🔌 Database Connections</h2>
          <p class="text-secondary text-sm mt-sm m-0">Manage your database connections securely</p>
        </div>
        <button class="btn btn-primary" (click)="showAddConnection()">
          ➕ Add Connection
        </button>
      </div>

      <!-- Connection List Grid -->
      <div class="connections-grid">
        @if (connections().length === 0) {
          <div class="card card-hover" style="grid-column: 1 / -1;">
            <div class="card-body" style="text-align: center; padding: var(--spacing-2xl);">
              <div style="font-size: 48px; margin-bottom: var(--spacing-md); opacity: 0.5;">💾</div>
              <h3 class="text-inverse">No Connections Yet</h3>
              <p class="text-secondary mb-lg">Add your first database connection to get started</p>
              <button class="btn btn-primary btn-lg" (click)="showAddConnection()">
                ➕ Add Your First Connection
              </button>
            </div>
          </div>
        } @else {
          @for (conn of connections(); track conn.id) {
            <div class="card card-hover connection-card"
                 [class.connection-active]="conn.isActive">
              <!-- Card Header with Database Icon -->
              <div class="card-header">
                <div class="flex items-center gap-sm">
                  <div class="db-icon" [class]="'db-' + conn.type.toLowerCase()">
                    @switch (conn.type) {
                      @case ('PostgreSQL') { 🐘 }
                      @case ('MySQL') { 🐬 }
                      @case ('SQLServer') { 🗄️ }
                      @case ('Redshift') { ☁️ }
                    }
                  </div>
                  <div class="flex-1">
                    <h3 class="card-title m-0 text-sm">{{ conn.name }}</h3>
                    <span class="badge badge-sm"
                          [class]="'badge-' + conn.type.toLowerCase()">
                      {{ conn.type }}
                    </span>
                  </div>
                  @if (conn.isActive) {
                    <span class="badge badge-success">✓ Active</span>
                  }
                </div>
              </div>

              <!-- Connection Details -->
              <div class="card-body">
                <div class="connection-details">
                  <div class="detail-row">
                    <span class="text-secondary text-xs">🌐 Host</span>
                    <span class="text-primary text-sm font-medium truncate">{{ conn.host }}:{{ conn.port }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="text-secondary text-xs">💾 Database</span>
                    <span class="text-primary text-sm font-medium truncate">{{ conn.database }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="text-secondary text-xs">👤 Username</span>
                    <span class="text-primary text-sm font-medium truncate">{{ conn.username }}</span>
                  </div>
                </div>
              </div>

              <!-- Card Actions -->
              <div class="card-footer">
                <div class="flex gap-xs">
                  <button class="btn btn-sm btn-ghost" (click)="testConnection(conn)" title="Test Connection">
                    🔌 Test
                  </button>
                  <button class="btn btn-sm"
                          [class.btn-success]="!conn.isActive"
                          [class.btn-secondary]="conn.isActive"
                          (click)="setActive(conn)"
                          [disabled]="conn.isActive"
                          title="Set as active connection">
                    {{ conn.isActive ? '✓ Active' : 'Activate' }}
                  </button>
                  <button class="btn btn-sm btn-secondary" (click)="editConnection(conn)" title="Edit Connection">
                    ✏️
                  </button>
                  <button class="btn btn-sm btn-danger" (click)="deleteConnection(conn)" title="Delete Connection">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          }
        }
      </div>

      <!-- Modern Modal Form -->
      @if (showForm()) {
        <div class="modal-backdrop" (click)="closeForm()">
          <div class="modal modal-md" (click)="$event.stopPropagation()">
            <!-- Modal Header -->
            <div class="card-header">
              <h3 class="card-title m-0">
                {{ editingConnection() ? '✏️ Edit Connection' : '➕ New Connection' }}
              </h3>
            </div>

            <!-- Modal Body -->
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Connection Name *</label>
                <input class="form-input" type="text" [(ngModel)]="formData.name"
                       placeholder="My Production Database">
              </div>

              <div class="form-group">
                <label class="form-label">Database Type *</label>
                <select class="form-select" [(ngModel)]="formData.type">
                  <option value="PostgreSQL">🐘 PostgreSQL</option>
                  <option value="MySQL">🐬 MySQL</option>
                  <option value="SQLServer">🗄️ SQL Server</option>
                  <option value="Redshift">☁️ AWS Redshift</option>
                </select>
              </div>

              <div class="flex gap-md">
                <div class="form-group" style="flex: 2;">
                  <label class="form-label">Host *</label>
                  <input class="form-input" type="text" [(ngModel)]="formData.host"
                         placeholder="localhost">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label class="form-label">Port *</label>
                  <input class="form-input" type="number" [(ngModel)]="formData.port"
                         placeholder="5432">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Database Name *</label>
                <input class="form-input" type="text" [(ngModel)]="formData.database"
                       placeholder="mydb">
              </div>

              <div class="form-group">
                <label class="form-label">Username *</label>
                <input class="form-input" type="text" [(ngModel)]="formData.username"
                       placeholder="postgres">
              </div>

              <div class="form-group">
                <label class="form-label">Password *</label>
                <input class="form-input" type="password" [(ngModel)]="formData.password"
                       placeholder="••••••••">
              </div>

              <div class="alert alert-info">
                <strong>🔒 Security Note:</strong> Connections are stored securely in your browser's local storage.
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="card-footer">
              <div class="flex justify-end gap-sm">
                <button class="btn btn-secondary" (click)="closeForm()">Cancel</button>
                <button class="btn btn-primary" (click)="saveConnection()">
                  {{ editingConnection() ? '💾 Update' : '➕ Add' }} Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .connection-manager {
      padding: var(--spacing-xl);
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Connections Grid */
    .connections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: var(--spacing-lg);
    }

    /* Connection Card */
    .connection-card {
      transition: transform var(--transition-base), box-shadow var(--transition-base);
    }

    .connection-card:hover {
      transform: translateY(-2px);
    }

    .connection-active {
      border: 2px solid var(--success-500) !important;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.2) !important;
    }

    /* Database Icon */
    .db-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      border-radius: var(--radius-md);
      background: var(--bg-tertiary);
    }

    .db-icon.db-postgresql { background: rgba(51, 103, 145, 0.2); }
    .db-icon.db-mysql { background: rgba(0, 117, 143, 0.2); }
    .db-icon.db-sqlserver { background: rgba(204, 41, 39, 0.2); }
    .db-icon.db-redshift { background: rgba(255, 153, 0, 0.2); }

    /* Badge Colors for Database Types */
    .badge-postgresql { background: rgba(51, 103, 145, 0.2); color: #5a9fd4; }
    .badge-mysql { background: rgba(0, 117, 143, 0.2); color: #00a9d0; }
    .badge-sqlserver { background: rgba(204, 41, 39, 0.2); color: #e74c3c; }
    .badge-redshift { background: rgba(255, 153, 0, 0.2); color: #ff9900; }
    .badge-sm { font-size: 0.7rem; padding: 0.15rem 0.5rem; }

    /* Connection Details */
    .connection-details {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: var(--spacing-sm);
      background: var(--bg-tertiary);
      border-radius: var(--radius-sm);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .connections-grid {
        grid-template-columns: 1fr;
      }

      .connection-manager {
        padding: var(--spacing-md);
      }
    }
  `]
})
export class ConnectionManagerComponent {
  private connectionService = inject(ConnectionService);

  // Use shared connection service
  connections = this.connectionService.connections;
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

    if (this.editingConnection()) {
      // Update existing connection
      this.connectionService.updateConnection(this.editingConnection()!.id, this.formData);
    } else {
      // Add new connection
      this.connectionService.addConnection(this.formData);
    }

    this.closeForm();
  }

  deleteConnection(conn: DatabaseConnection): void {
    if (!confirm(`Delete connection "${conn.name}"?`)) return;
    this.connectionService.deleteConnection(conn.id);
  }

  setActive(conn: DatabaseConnection): void {
    this.connectionService.setActiveConnection(conn.id);
  }

  async testConnection(conn: DatabaseConnection): Promise<void> {
    try {
      const result = await this.connectionService.testConnection(conn);
      if (result) {
        alert(`✅ Connection successful!\n\nConnected to: ${conn.name}\nHost: ${conn.host}:${conn.port}`);
      } else {
        alert(`❌ Connection failed!\n\nCould not connect to: ${conn.name}`);
      }
    } catch (error) {
      alert(`❌ Connection error!\n\n${error}`);
    }
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
      password: ''
    };
  }
}
