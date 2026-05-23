import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (type) {
      @case ('table') {
        <div class="space-y-3">
          @for (i of rows(); track i) {
            <div class="flex items-center gap-4 px-4 py-3 bg-mq-800 rounded-xl border border-mq-700">
              <div class="w-9 h-9 rounded-full skeleton flex-shrink-0"></div>
              <div class="flex-1 space-y-2">
                <div class="h-3 skeleton rounded w-1/3"></div>
                <div class="h-2.5 skeleton rounded w-1/4"></div>
              </div>
              <div class="h-3 skeleton rounded w-16"></div>
              <div class="h-6 skeleton rounded-full w-16"></div>
            </div>
          }
        </div>
      }
      @case ('cards') {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (i of rows(); track i) {
            <div class="mq-card-dark p-5 rounded-2xl border border-mq-700 space-y-3">
              <div class="h-10 w-10 skeleton rounded-xl"></div>
              <div class="h-3 skeleton rounded w-3/4"></div>
              <div class="h-8 skeleton rounded w-1/2"></div>
              <div class="h-2.5 skeleton rounded w-2/3"></div>
            </div>
          }
        </div>
      }
      @case ('detail') {
        <div class="flex flex-col md:flex-row gap-6">
          <div class="w-full md:w-64 flex-shrink-0 space-y-4">
            <div class="h-16 w-16 skeleton rounded-2xl mx-auto"></div>
            <div class="h-3 skeleton rounded w-3/4 mx-auto"></div>
            @for (i of [1,2,3,4,5]; track i) {
              <div class="h-2.5 skeleton rounded"></div>
            }
          </div>
          <div class="flex-1 space-y-4">
            <div class="flex gap-2">
              @for (i of [1,2,3,4]; track i) {
                <div class="h-10 skeleton rounded-xl flex-1"></div>
              }
            </div>
            @for (i of [1,2,3,4,5]; track i) {
              <div class="h-16 skeleton rounded-xl"></div>
            }
          </div>
        </div>
      }
      @case ('dashboard') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="h-32 skeleton rounded-2xl"></div>
          }
          <div class="col-span-1 md:col-span-2 lg:col-span-3 h-64 skeleton rounded-2xl"></div>
          <div class="h-64 skeleton rounded-2xl"></div>
        </div>
      }
      @default {
        <div class="space-y-3">
          @for (i of rows(); track i) {
            <div class="h-16 skeleton rounded-xl"></div>
          }
        </div>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .skeleton {
      background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class LoadingSkeletonComponent {
  @Input() type: 'table' | 'cards' | 'detail' | 'dashboard' | 'default' | 'metric-card' = 'table';
  @Input() count = 5;
  readonly rows = computed(() => Array.from({ length: this.count }, (_, i) => i));
}
