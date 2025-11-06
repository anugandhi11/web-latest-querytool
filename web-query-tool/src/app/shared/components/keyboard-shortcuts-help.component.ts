import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Keyboard Shortcuts Help Component
 *
 * Shows all available keyboard shortcuts
 * Triggered by pressing '?' key
 */
@Component({
  selector: 'app-keyboard-shortcuts-help',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible()) {
      <div class="modal-backdrop" (click)="close()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header">
            <h2 class="modal-title">⌨️ Keyboard Shortcuts</h2>
            <button class="btn-close" (click)="close()">✕</button>
          </div>

          <!-- Shortcuts List -->
          <div class="modal-body">
            <!-- Editor Shortcuts -->
            <div class="shortcuts-section">
              <h3 class="section-title">SQL Editor</h3>
              <div class="shortcuts-list">
                <div class="shortcut-item">
                  <span class="shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
                  </span>
                  <span class="shortcut-desc">Execute Query</span>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-keys">
                    <kbd>Shift</kbd> + <kbd>Alt</kbd> + <kbd>F</kbd>
                  </span>
                  <span class="shortcut-desc">Format SQL</span>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>/</kbd>
                  </span>
                  <span class="shortcut-desc">Toggle Comment</span>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>Space</kbd>
                  </span>
                  <span class="shortcut-desc">IntelliSense / Autocomplete</span>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>F</kbd>
                  </span>
                  <span class="shortcut-desc">Find in Query</span>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>H</kbd>
                  </span>
                  <span class="shortcut-desc">Find and Replace</span>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-keys">
                    <kbd>Alt</kbd> + <kbd>Click</kbd>
                  </span>
                  <span class="shortcut-desc">Multi-cursor Editing</span>
                </div>
              </div>
            </div>

            <!-- Navigation Shortcuts -->
            <div class="shortcuts-section">
              <h3 class="section-title">Navigation</h3>
              <div class="shortcuts-list">
                <div class="shortcut-item">
                  <span class="shortcut-keys">
                    <kbd>?</kbd>
                  </span>
                  <span class="shortcut-desc">Show Keyboard Shortcuts (this panel)</span>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-keys">
                    <kbd>Esc</kbd>
                  </span>
                  <span class="shortcut-desc">Close Modal / Cancel</span>
                </div>
              </div>
            </div>

            <!-- Tips -->
            <div class="shortcuts-section">
              <h3 class="section-title">💡 Pro Tips</h3>
              <div class="tips-list">
                <div class="tip-item">
                  <span class="tip-icon">🎯</span>
                  <span class="tip-text">Select text and press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to run only the selected query</span>
                </div>
                <div class="tip-item">
                  <span class="tip-icon">📜</span>
                  <span class="tip-text">Access query history by clicking "📜 Show History" button</span>
                </div>
                <div class="tip-item">
                  <span class="tip-icon">💾</span>
                  <span class="tip-text">All executed queries are automatically saved to history</span>
                </div>
                <div class="tip-item">
                  <span class="tip-icon">🔍</span>
                  <span class="tip-text">Use filters in query history to find success/failed queries</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <span class="footer-note">Press <kbd>?</kbd> anytime to toggle this help</span>
            <button class="btn btn-primary" (click)="close()">Got it!</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: var(--spacing-lg);
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-content {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-xl);
      max-width: 700px;
      width: 100%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-xl);
      animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--border-primary);
    }

    .modal-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-inverse);
    }

    .btn-close {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: var(--text-secondary);
      cursor: pointer;
      padding: var(--spacing-xs);
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
    }

    .btn-close:hover {
      background: var(--bg-hover);
      color: var(--text-inverse);
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-lg);
    }

    .shortcuts-section {
      margin-bottom: var(--spacing-xl);
    }

    .shortcuts-section:last-child {
      margin-bottom: 0;
    }

    .section-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--spacing-md);
    }

    .shortcuts-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .shortcut-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--bg-tertiary);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }

    .shortcut-item:hover {
      background: var(--bg-hover);
    }

    .shortcut-keys {
      display: flex;
      gap: var(--spacing-xs);
      align-items: center;
    }

    kbd {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 0.75rem;
      color: var(--text-inverse);
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-sm);
      box-shadow: 0 2px 0 var(--border-primary);
    }

    .shortcut-desc {
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .tips-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .tip-item {
      display: flex;
      gap: var(--spacing-sm);
      align-items: flex-start;
      padding: var(--spacing-sm);
      background: var(--bg-tertiary);
      border-left: 3px solid var(--primary-500);
      border-radius: var(--radius-sm);
    }

    .tip-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .tip-text {
      color: var(--text-primary);
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg);
      border-top: 1px solid var(--border-primary);
    }

    .footer-note {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .btn {
      padding: var(--spacing-sm) var(--spacing-lg);
      border: none;
      border-radius: var(--radius-md);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .btn-primary {
      background: var(--primary-500);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-600);
    }

    /* Scrollbar */
    .modal-body::-webkit-scrollbar {
      width: 8px;
    }

    .modal-body::-webkit-scrollbar-track {
      background: var(--bg-secondary);
    }

    .modal-body::-webkit-scrollbar-thumb {
      background: var(--border-primary);
      border-radius: 4px;
    }

    .modal-body::-webkit-scrollbar-thumb:hover {
      background: var(--text-tertiary);
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .modal-content {
        max-width: 100%;
        max-height: 90vh;
      }

      .shortcut-item {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-xs);
      }
    }
  `]
})
export class KeyboardShortcutsHelpComponent {
  isVisible = signal(false);

  /**
   * Listen for '?' key press globally
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Press '?' to toggle (Shift + / on US keyboards)
    if (event.key === '?' && !event.ctrlKey && !event.altKey && !event.metaKey) {
      // Don't trigger if typing in an input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        event.preventDefault();
        this.toggle();
      }
    }

    // Press Esc to close
    if (event.key === 'Escape' && this.isVisible()) {
      this.close();
    }
  }

  toggle(): void {
    this.isVisible.set(!this.isVisible());
  }

  close(): void {
    this.isVisible.set(false);
  }

  show(): void {
    this.isVisible.set(true);
  }
}
