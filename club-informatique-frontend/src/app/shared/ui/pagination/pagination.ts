import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/** Pagination côté serveur. Les numéros de page sont des repères de navigation, non des statistiques. */
@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    @if (totalPages() > 1) {
      <nav class="pagination" [attr.aria-label]="label()">
        <button type="button" class="pagination-btn" [disabled]="page() <= 0" aria-label="Page précédente" (click)="go(page() - 1)">
          <app-icon name="chevron-left" [size]="16" />
        </button>
        @for (item of items(); track $index) {
          @if (item === null) {
            <span aria-hidden="true">…</span>
          } @else {
            <button
              type="button"
              class="pagination-btn"
              [attr.aria-current]="item === page() ? 'page' : null"
              [attr.aria-label]="'Page ' + (item + 1)"
              (click)="go(item)"
            >
              {{ item + 1 }}
            </button>
          }
        }
        <button type="button" class="pagination-btn" [disabled]="page() >= totalPages() - 1" aria-label="Page suivante" (click)="go(page() + 1)">
          <app-icon name="chevron-right" [size]="16" />
        </button>
      </nav>
    }
  `,
})
export class Pagination {
  /** Index de page, à partir de zéro. */
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly label = input('Pagination');
  readonly pageChange = output<number>();

  protected readonly items = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    const wanted = new Set([0, total - 1, current - 1, current, current + 1].filter((p) => p >= 0 && p < total));
    const sorted = [...wanted].sort((a, b) => a - b);
    const result: (number | null)[] = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) result.push(null);
      result.push(p);
    });
    return result;
  });

  protected go(page: number): void {
    if (page >= 0 && page < this.totalPages() && page !== this.page()) this.pageChange.emit(page);
  }
}
