import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [class]="'toast-' + toast.type" role="alert">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              }
              @case ('error') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              }
              @case ('warning') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              }
              @default {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              }
            }
          </div>
          <div class="toast-body">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button type="button" class="toast-close" (click)="toastService.remove(toast.id)" aria-label="Fermer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 420px;
      width: calc(100% - 3rem);
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      background: var(--bg-card, #ffffff);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      border: 1px solid var(--border-color, #e2e8f0);
      backdrop-filter: blur(12px);
      animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      transition: all 0.2s ease;
    }
    .toast-icon {
      flex-shrink: 0;
      margin-top: 0.1rem;
    }
    .toast-body {
      flex: 1;
    }
    .toast-title {
      font-weight: 600;
      font-size: 0.92rem;
      margin-bottom: 0.2rem;
      color: var(--text-primary, #0f172a);
    }
    .toast-message {
      font-size: 0.85rem;
      color: var(--text-secondary, #475569);
      line-height: 1.4;
    }
    .toast-close {
      flex-shrink: 0;
      background: transparent;
      border: none;
      color: var(--text-muted, #94a3b8);
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .toast-close:hover {
      color: var(--text-primary, #0f172a);
      background: rgba(0, 0, 0, 0.05);
    }
    .toast-success {
      border-left: 4px solid var(--color-success, #22c55e);
    }
    .toast-success .toast-icon {
      color: var(--color-success, #22c55e);
    }
    .toast-error {
      border-left: 4px solid var(--color-error, #ef4444);
    }
    .toast-error .toast-icon {
      color: var(--color-error, #ef4444);
    }
    .toast-warning {
      border-left: 4px solid var(--color-amber-tech, #f5a623);
    }
    .toast-warning .toast-icon {
      color: var(--color-amber-tech, #f5a623);
    }
    .toast-info {
      border-left: 4px solid var(--color-bleu-royal, #1b3a8c);
    }
    .toast-info .toast-icon {
      color: var(--color-bleu-royal, #1b3a8c);
    }
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `]
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
}
