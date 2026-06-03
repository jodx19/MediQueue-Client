import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="p-6 min-h-screen bg-mq-navy">
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header -->
        <div class="border-b border-mq-700/60 pb-6">
          <h1 class="text-3xl font-black text-white tracking-tight">Reports &amp; Analytics</h1>
          <p class="text-mq-s400 text-sm mt-1">Generate and view clinic performance reports, revenue analytics, and operational insights.</p>
        </div>

        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          @for (stat of stats; track stat.label) {
            <div class="mq-card-dark p-5">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                     [style.background]="stat.bg">
                  <lucide-icon [name]="stat.icon" [size]="18" [style.color]="stat.color"/>
                </div>
                <div>
                  <p class="text-2xl font-black text-white">{{ stat.value }}</p>
                  <p class="text-mq-s400 text-xs font-semibold uppercase tracking-wide">{{ stat.label }}</p>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Placeholder for future report cards -->
        <div class="mq-card-dark p-12 flex flex-col items-center justify-center text-center">
          <div class="w-20 h-20 rounded-2xl bg-mq-teal/10 flex items-center justify-center mb-4">
            <lucide-icon name="bar-chart-3" class="text-mq-t400" [size]="36"/>
          </div>
          <h2 class="text-xl font-bold text-white mb-2">Detailed Reports Coming Soon</h2>
          <p class="text-mq-s400 text-sm max-w-md">
            Revenue breakdowns, patient visit statistics, doctor performance metrics,
            and custom date-range reports will be available here.
          </p>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent {
  stats = [
    { label: 'Total Revenue', value: '$0.00', icon: 'dollar-sign', color: '#2DD4BF', bg: 'rgba(13,148,136,.15)' },
    { label: 'Completed Visits', value: '0', icon: 'check-circle', color: '#34D399', bg: 'rgba(16,185,129,.15)' },
    { label: 'Appointments', value: '0', icon: 'calendar', color: '#818CF8', bg: 'rgba(124,58,237,.15)' },
    { label: 'Active Patients', value: '0', icon: 'users', color: '#FCD34D', bg: 'rgba(245,158,11,.15)' },
  ];
}