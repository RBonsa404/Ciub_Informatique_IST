import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages > 1) {
      <div class="pagination-wrapper">
        <button
          type="button"
          class="page-btn nav-btn"
          [disabled]="currentPage === 0"
          (click)="changePage(currentPage - 1)"
          aria-label="Page précédente"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        @for (page of pages; track page) {
          @if (page === -1) {
            <span class="page-ellipsis">…</span>
          } @else {
            <button
              type="button"
              class="page-btn"
              [class.active]="page === currentPage"
              (click)="changePage(page)"
            >
              {{ page + 1 }}
            </button>
          }
        }

        <button
          type="button"
          class="page-btn nav-btn"
          [disabled]="currentPage >= totalPages - 1"
          (click)="changePage(currentPage + 1)"
          aria-label="Page suivante"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    }
  `,
  styles: [`
    .pagination-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      margin-top: 2rem;
    }
    .page-btn {
      min-width: 38px;
      height: 38px;
      padding: 0 0.5rem;
      border-radius: 8px;
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-card, #ffffff);
      color: var(--text-secondary, #475569);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .page-btn:hover:not(:disabled) {
      border-color: var(--color-bleu-royal, #1b3a8c);
      color: var(--color-bleu-royal, #1b3a8c);
      background: rgba(27, 58, 140, 0.05);
    }
    .page-btn.active {
      background: var(--accent-gradient, #1b3a8c);
      color: #ffffff;
      border-color: transparent;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(27, 58, 140, 0.3);
    }
    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .page-ellipsis {
      padding: 0 0.4rem;
      color: var(--text-muted, #94a3b8);
      font-weight: bold;
    }
  `]
})
export class PaginationComponent {
  @Input() currentPage = 0;
  @Input() totalPages = 1;
  @Output() pageChanged = new EventEmitter<number>();

  get pages(): number[] {
    const list: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      for (let i = 0; i < total; i++) list.push(i);
      return list;
    }

    list.push(0);
    if (current > 2) list.push(-1);

    const start = Math.max(1, current - 1);
    const end = Math.min(total - 2, current + 1);

    for (let i = start; i <= end; i++) {
      list.push(i);
    }

    if (current < total - 3) list.push(-1);
    list.push(total - 1);

    return list;
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.pageChanged.emit(page);
    }
  }
}
