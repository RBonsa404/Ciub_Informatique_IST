import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div class="modal-dialog" [style.max-width]="maxWidth" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button type="button" class="modal-close-btn" (click)="close()" aria-label="Fermer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <ng-content />
          </div>
          @if (showFooter) {
            <div class="modal-footer">
              <ng-content select="[modal-actions]" />
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(10, 14, 26, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      padding: 1rem;
      animation: fadeIn 0.2s ease-out;
    }
    .modal-dialog {
      width: 100%;
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 16px;
      box-shadow: var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.2));
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow: hidden;
      animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      margin: 0;
    }
    .modal-close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted, #94a3b8);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .modal-close-btn:hover {
      color: var(--text-primary, #0f172a);
      background: rgba(0, 0, 0, 0.05);
    }
    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      color: var(--text-secondary, #475569);
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      background: rgba(0, 0, 0, 0.01);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() maxWidth = '560px';
  @Input() showFooter = true;
  @Input() closeOnBackdrop = true;

  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }
}
