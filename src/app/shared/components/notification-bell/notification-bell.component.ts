import { Component, inject, signal, computed, effect, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { SignalRService, AppNotification } from '../../../core/services/signalr.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './notification-bell.component.html',
  animations: [
    trigger('dropdownAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px) scale(0.97)' }),
        animate('200ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-8px) scale(0.97)' }))
      ])
    ])
  ]
})
export class NotificationBellComponent {
  private signalR = inject(SignalRService);
  private el = inject(ElementRef);
  isOpen = signal(false);
  notifications = signal<AppNotification[]>([]);
  readonly unread = computed(() => this.notifications().filter(n => !n.isRead).length);

  constructor() {
    effect(() => {
      const events = this.signalR.recentEvents();
      if (events.length) { this.notifications.update(prev => [...events, ...prev].slice(0, 50)); }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent) {
    if (this.isOpen() && !this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  trackById(_: number, item: AppNotification): string { return item.id; }

  toggleDropdown() { this.isOpen.update(v => !v); if (this.isOpen()) this.markAllRead(); }
  markAllRead() { this.notifications.update(list => list.map(n => ({ ...n, isRead: true }))); }
  clearAll() { this.notifications.set([]); this.isOpen.set(false); }

  notifIcon(type: string): string {
    return ({ appointment: 'calendar', visit: 'stethoscope', invoice: 'receipt', system: 'bell' })[type] ?? 'bell';
  }

  notifColor(type: string): string {
    return ({ appointment: 'text-mq-teal-400', visit: 'text-purple-400', invoice: 'text-emerald-400', system: 'text-amber-400' })[type] ?? 'text-mq-s400';
  }

  timeAgo(date: Date): string {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }
}
