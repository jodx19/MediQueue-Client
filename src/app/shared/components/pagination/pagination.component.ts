import {
  Component, Input, Output, EventEmitter,
  computed, WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages() > 1) {
      <div class="flex items-center justify-between
                  px-4 py-3 border-t border-mq-700">

        <!-- Info -->
        <p class="text-xs text-mq-s400">
          Showing
          <span class="text-mq-text font-medium">
            {{ from() }}–{{ to() }}
          </span>
          of
          <span class="text-mq-text font-medium">{{ total() }}</span>
        </p>

        <!-- Controls -->
        <div class="flex items-center gap-1.5">

          <!-- Prev -->
          <button
            (click)="onPageChange(currentPage() - 1)"
            [disabled]="currentPage() === 1"
            class="mq-page-btn"
            aria-label="Previous page">
            ← Prev
          </button>

          <!-- Page numbers (max 5 visible) -->
          @for (page of visiblePages(); track page) {
            @if (page === -1) {
              <span class="px-2 text-mq-s400 text-xs">...</span>
            } @else {
              <button
                (click)="onPageChange(page)"
                [class]="page === currentPage()
                  ? 'mq-page-btn-active'
                  : 'mq-page-btn'">
                {{ page }}
              </button>
            }
          }

          <!-- Next -->
          <button
            (click)="onPageChange(currentPage() + 1)"
            [disabled]="currentPage() === totalPages()"
            class="mq-page-btn"
            aria-label="Next page">
            Next →
          </button>
        </div>
      </div>
    }
  `,
})
export class PaginationComponent {
  @Input({ required: true }) total!: WritableSignal<number>;
  @Input({ required: true }) pageSize = 20;
  @Input({ required: true }) currentPage!: WritableSignal<number>;
  @Output() pageChange = new EventEmitter<number>();

  readonly totalPages = computed(() =>
    Math.ceil(this.total() / this.pageSize)
  );

  readonly from = computed(() =>
    (this.currentPage() - 1) * this.pageSize + 1
  );

  readonly to = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.total())
  );

  readonly visiblePages = computed(() => {
    const total   = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    pages.push(1);

    if (current > 3) pages.push(-1);

    const start = Math.max(2, current - 1);
    const end   = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push(-1);

    pages.push(total);

    return pages;
  });

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.pageChange.emit(page);
  }
}
