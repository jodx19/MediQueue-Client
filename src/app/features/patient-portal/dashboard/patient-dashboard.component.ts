import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { LucideAngularModule, CalendarClock, Stethoscope, Receipt, CalendarPlus, ClipboardList, Download, Pill } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
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
      <div class="glass p-6 flex items-center gap-5">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-mq-teal to-mq-teal-600 flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
          {{ initials() }}
        </div>
        <div>
          <h1 class="text-2xl font-black text-white">Good {{ timeOfDay() }}, {{ currentUser()?.firstName }}!</h1>
          <p class="text-mq-s400 text-sm mt-1">Manage your health records, appointments, and prescriptions.</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div class="mq-card-dark p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-xl bg-mq-teal/15 flex items-center justify-center">
              <lucide-icon name="calendar-clock" class="text-mq-teal-400" [size]="18"/>
            </div>
            <span class="text-mq-s400 text-xs uppercase tracking-wider font-medium">Next Appointment</span>
          </div>
          <p class="text-white font-bold text-base">Dr. Ahmed Hassan</p>
          <p class="text-mq-teal-400 text-sm font-semibold mt-1">Tomorrow at 10:30 AM</p>
        </div>

        <div class="mq-card-dark p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <lucide-icon name="stethoscope" class="text-purple-400" [size]="18"/>
            </div>
            <span class="text-mq-s400 text-xs uppercase tracking-wider font-medium">Total Visits</span>
          </div>
          <p class="text-3xl font-black text-white">12</p>
          <p class="text-mq-s400 text-xs mt-1">since you joined</p>
        </div>

        <div class="mq-card-dark p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <lucide-icon name="receipt" class="text-amber-400" [size]="18"/>
            </div>
            <span class="text-mq-s400 text-xs uppercase tracking-wider font-medium">Outstanding</span>
          </div>
          <p class="text-3xl font-black text-emerald-400">EGP 0</p>
          <p class="text-mq-s400 text-xs mt-1">all clear</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="mq-card-dark p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-white font-semibold">Upcoming Appointments</h3>
            <a routerLink="/my-appointments" class="text-xs text-mq-teal-400 hover:underline">View all →</a>
          </div>
          <div class="space-y-3">
            <div class="flex items-center gap-3 p-3 rounded-xl bg-mq-navy/60 border border-mq-700/40">
              <div class="w-10 h-10 rounded-xl bg-mq-teal/10 flex flex-col items-center justify-center text-center flex-shrink-0">
                <span class="text-mq-teal-400 text-sm font-black leading-none">24</span>
                <span class="text-mq-s400 text-[9px] uppercase">May</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-white text-xs font-semibold truncate">Dr. Ahmed Hassan</p>
                <p class="text-mq-s400 text-[10px]">10:30 AM - Cardiology</p>
              </div>
              <span class="badge badge-info text-[10px]">Confirmed</span>
            </div>
            <div class="text-center py-4">
              <p class="text-mq-s400 text-sm mb-3">No more upcoming appointments</p>
              <a routerLink="/book" class="btn-primary !py-2 !px-4 !text-xs">Book Now →</a>
            </div>
          </div>
        </div>

        <div class="mq-card-dark p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-white font-semibold">Recent Prescriptions</h3>
            <a routerLink="/my-records" class="text-xs text-mq-teal-400 hover:underline">View all →</a>
          </div>
          <div class="space-y-2">
            <div class="flex items-center gap-3 p-3 rounded-xl bg-mq-navy/60 border border-mq-700/40">
              <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <lucide-icon name="pill" class="text-purple-400" [size]="14"/>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-white text-xs font-semibold truncate">Amoxicillin 500mg</p>
                <p class="text-mq-s400 text-[10px]">1 capsule 3x daily · 7 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="glass p-5">
        <h3 class="text-white font-semibold mb-4">Quick Actions</h3>
        <div class="grid grid-cols-4 gap-3">
          <a routerLink="/book"
             class="flex flex-col items-center gap-2 p-4 rounded-xl bg-mq-teal/10 border border-mq-teal/20 hover:border-mq-teal/50 transition-all group">
            <lucide-icon name="calendar-plus" class="text-mq-teal-400 group-hover:scale-110 transition-transform" [size]="22"/>
            <span class="text-white text-xs font-medium">Book Appointment</span>
          </a>
          <a routerLink="/my-records"
             class="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all group">
            <lucide-icon name="clipboard-list" class="text-purple-400 group-hover:scale-110 transition-transform" [size]="22"/>
            <span class="text-white text-xs font-medium">Medical Records</span>
          </a>
          <a routerLink="/my-invoices"
             class="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all group">
            <lucide-icon name="receipt" class="text-amber-400 group-hover:scale-110 transition-transform" [size]="22"/>
            <span class="text-white text-xs font-medium">My Invoices</span>
          </a>
          <button (click)="downloadHistory()"
                  class="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group text-left">
            <lucide-icon name="download" class="text-emerald-400 group-hover:scale-110 transition-transform" [size]="22"/>
            <span class="text-white text-xs font-medium">Download History</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class PatientDashboardComponent {
  private auth = inject(AuthService);

  currentUser = this.auth.currentUser;

  initials = computed(() => {
    const u = this.currentUser();
    if (!u) return '?';
    return (u.firstName?.charAt(0) || '').toUpperCase();
  });

  timeOfDay = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 18) return 'Afternoon';
    return 'Evening';
  });

  downloadHistory(): void {
    // Placeholder for PDF download
    console.log('Download medical history');
  }
}
