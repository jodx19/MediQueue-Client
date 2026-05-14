import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  path: string;
  roles: string[];
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="w-64 min-h-screen bg-mq-navy text-mq-slate flex flex-col fixed top-0 left-0 border-r border-gray-800 shadow-2xl z-20">
      <!-- Brand -->
      <div class="flex items-center gap-3 p-6 border-b border-gray-800 mb-4">
        <div class="w-8 h-8 rounded-lg bg-mq-teal flex items-center justify-center shadow-lg shadow-mq-teal/20">
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
            <path d="M20 8C14 8 10 13 10 20C10 27 14 32 20 32C26 32 30 27 30 20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="28" cy="12" r="3" fill="white"/>
          </svg>
        </div>
        <span class="text-xl font-bold tracking-tight text-white">MediQueue</span>
      </div>

      <!-- Nav Items -->
      <nav class="flex-1 flex flex-col gap-1 px-4 overflow-y-auto">
        @for (item of visibleItems(); track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-mq-teal/10 text-mq-teal border-r-2 border-mq-teal"
            class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-200 text-sm font-medium"
          >
            <span class="w-5 h-5 flex items-center justify-center" [innerHTML]="item.icon"></span>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- SignalR Status & User -->
      <div class="p-4 border-t border-gray-800 bg-mq-navy/90 backdrop-blur-sm">
        <div class="flex items-center gap-2 mb-4 px-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" 
                  [ngClass]="isLive() ? 'bg-green-400' : 'bg-red-400'"></span>
            <span class="relative inline-flex rounded-full h-3 w-3" 
                  [ngClass]="isLive() ? 'bg-green-500' : 'bg-red-500'"></span>
          </span>
          <span class="text-xs font-medium tracking-wide" [ngClass]="isLive() ? 'text-green-400' : 'text-red-400'">
            {{ isLive() ? 'SYSTEM LIVE' : 'OFFLINE' }}
          </span>
        </div>

        <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-mq-teal to-mq-teal-dark flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg shadow-mq-teal/20">
            {{ userInitial() }}
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <span class="text-xs font-semibold text-white truncate">{{ authService.currentUser()?.email || 'Guest' }}</span>
            <span class="text-[10px] text-mq-teal-light font-medium uppercase tracking-wider">{{ authService.currentUser()?.role || 'User' }}</span>
          </div>
          <button (click)="authService.logout()" class="text-gray-400 hover:text-mq-danger hover:bg-red-500/10 transition-all p-2 rounded-lg" title="Sign out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  readonly authService = inject(AuthService);
  
  // Replace with SignalR Service indicator when available
  readonly isLive = signal(true);

  readonly userInitial = computed(() => {
    const email = this.authService.currentUser()?.email;
    return email ? email.charAt(0).toUpperCase() : 'U';
  });

  private readonly navItems: NavItem[] = [
    { label: 'Admin Dashboard', path: '/app/admin/dashboard', roles: ['Admin', 'SuperAdmin'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>` },
    { label: 'Doctors', path: '/app/admin/doctors', roles: ['Admin', 'SuperAdmin'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>` },
    { label: 'Settings', path: '/app/admin/settings', roles: ['Admin', 'SuperAdmin'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>` },
    { label: 'Patients', path: '/app/reception/patients', roles: ['Admin', 'Receptionist'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>` },
    { label: 'Appointments', path: '/app/reception/appointments', roles: ['Admin', 'Receptionist'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
    { label: 'Invoices', path: '/app/reception/invoices', roles: ['Admin', 'Receptionist'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>` },
    { label: 'My Queue', path: '/app/doctor/queue', roles: ['Doctor'], icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>` },
  ];

  visibleItems() {
    return this.navItems.filter(item =>
      this.authService.hasRole(...item.roles)
    );
  }
}
