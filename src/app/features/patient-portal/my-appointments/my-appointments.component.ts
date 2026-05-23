import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Calendar, Clock, XCircle, Eye } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('500ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="space-y-6" [@pageEnter]>
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-black text-white">My Appointments</h1>
      </div>

      <div class="flex gap-2 mb-6">
        <button (click)="activeTab.set('upcoming')"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                [class.bg-mq-teal]="activeTab() === 'upcoming'"
                [class.text-white]="activeTab() === 'upcoming'"
                [class.text-mq-s400]="activeTab() !== 'upcoming'"
                [class.bg-mq-700]="activeTab() !== 'upcoming'">
          Upcoming
        </button>
        <button (click)="activeTab.set('past')"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                [class.bg-mq-teal]="activeTab() === 'past'"
                [class.text-white]="activeTab() === 'past'"
                [class.text-mq-s400]="activeTab() !== 'past'"
                [class.bg-mq-700]="activeTab() !== 'past'">
          Past
        </button>
      </div>

      @if (activeTab() === 'upcoming') {
        <div class="glass p-8 text-center">
          <lucide-icon name="calendar" class="text-mq-s400 mx-auto mb-3" [size]="40"/>
          <h3 class="text-white font-semibold mb-1">No upcoming appointments</h3>
          <p class="text-mq-s400 text-sm mb-4">Book an appointment with one of our specialists</p>
          <a routerLink="/book" class="btn-primary !py-2 !px-4 !text-sm inline-block">Book Now</a>
        </div>
      }

      @if (activeTab() === 'past') {
        <div class="glass p-8 text-center">
          <lucide-icon name="clock" class="text-mq-s400 mx-auto mb-3" [size]="40"/>
          <h3 class="text-white font-semibold mb-1">No past appointments</h3>
          <p class="text-mq-s400 text-sm">Your visit history will appear here</p>
        </div>
      }
    </div>
  `
})
export class MyAppointmentsComponent {
  activeTab = signal<'upcoming' | 'past'>('upcoming');
}
