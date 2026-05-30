import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-16 h-16 rounded-2xl bg-mq-teal/10 border border-mq-teal/20 flex items-center justify-center mb-5">
        <lucide-icon [name]="icon" class="text-mq-s400" [size]="28"/>
      </div>
      <h3 class="text-white font-semibold text-lg mb-2">{{ title }}</h3>
      <p class="text-mq-s400 text-sm max-w-xs mb-6">{{ description }}</p>
      @if (ctaLabel && ctaRoute) {
        <a [routerLink]="ctaRoute" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-mq-teal text-white font-semibold text-sm hover:bg-mq-teal/90 transition-all">
          {{ ctaLabel }}
        </a>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nothing here yet';
  @Input() description = '';
  @Input() ctaLabel = '';
  @Input() ctaRoute = '';
}
