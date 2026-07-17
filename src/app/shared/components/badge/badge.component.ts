import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClass()">{{ label }}</span>
  `,
})
export class BadgeComponent {
  @Input() label = '';
  @Input() set variant(value: BadgeVariant) {
    this._variant.set(value);
  }
  private _variant = signal<BadgeVariant>('default');

  badgeClass = computed(() => {
    const map: Record<BadgeVariant, string> = {
      success: 'badge-success',
      warning: 'badge-warning',
      danger:  'badge-danger',
      info:    'badge-info',
      default: 'badge-neutral',
    };
    return map[this._variant()] ?? 'badge-neutral';
  });
}
