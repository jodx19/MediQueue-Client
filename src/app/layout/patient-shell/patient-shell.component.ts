import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule, Calendar, ClipboardList, Receipt, LayoutDashboard, LogOut } from 'lucide-angular';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-patient-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-mq-navy">
      <header class="bg-mq-800 border-b border-mq-700 px-6 h-16 flex items-center justify-between sticky top-0 z-40">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-mq-teal to-mq-teal-600 flex items-center justify-center text-white font-bold text-sm">MQ</div>
          <span class="text-white font-bold">MediQueue</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-mq-s400 text-sm">{{ currentUser()?.firstName }}</span>
          <div class="w-8 h-8 rounded-full bg-mq-teal/15 flex items-center justify-center text-mq-teal-400 text-sm font-bold">
            {{ initials() }}
          </div>
          <button (click)="logout()" class="text-mq-s400 hover:text-rose-400 transition-colors text-sm">Sign Out</button>
        </div>
      </header>

      <nav class="bg-mq-800 border-b border-mq-700 px-6">
        <div class="flex gap-1 max-w-4xl mx-auto">
          <a routerLink="/my-portal" routerLinkActive="border-b-2 border-mq-teal text-white"
             class="px-5 py-3.5 text-sm font-medium text-mq-s400 hover:text-white transition-colors">
            Overview
          </a>
          <a routerLink="/my-appointments" routerLinkActive="border-b-2 border-mq-teal text-white"
             class="px-5 py-3.5 text-sm font-medium text-mq-s400 hover:text-white transition-colors">
            Appointments
          </a>
          <a routerLink="/my-records" routerLinkActive="border-b-2 border-mq-teal text-white"
             class="px-5 py-3.5 text-sm font-medium text-mq-s400 hover:text-white transition-colors">
            Medical Records
          </a>
          <a routerLink="/my-invoices" routerLinkActive="border-b-2 border-mq-teal text-white"
             class="px-5 py-3.5 text-sm font-medium text-mq-s400 hover:text-white transition-colors">
            Invoices
          </a>
        </div>
      </nav>

      <main class="max-w-4xl mx-auto px-6 py-8">
        <router-outlet/>
      </main>
    </div>
  `
})
export class PatientShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  currentUser = this.auth.currentUser;

  initials = computed(() => {
    const u = this.currentUser();
    if (!u) return '?';
    return (u.firstName?.charAt(0) || '').toUpperCase();
  });

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
