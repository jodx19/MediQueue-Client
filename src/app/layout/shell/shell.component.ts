import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth/auth.service';
import { SignalRService } from '../../core/services/signalr.service';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { CmdKComponent } from '../../shared/components/cmd-k/cmd-k.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, ToastComponent, CmdKComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  animations: [
    trigger('sidebarToggle', [
      state('expanded', style({ width: '260px' })),
      state('collapsed', style({ width: '80px' })),
      transition('expanded <=> collapsed', animate('250ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ])
  ]
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly signalr = inject(SignalRService);
  private readonly router = inject(Router);

  collapsed = signal(false);
  sidebarState = computed(() => this.collapsed() ? 'collapsed' : 'expanded');
  
  user = computed(() => this.auth.currentUser());
  role = computed(() => this.auth.userRole());
  initials = computed(() => this.user()?.name?.[0]?.toUpperCase() || 'U');
  
  connected = computed(() => this.signalr.connectionState() === 'connected');
  notifCount = computed(() => this.signalr.notificationCount());
  showNotifs = signal(false);

  pageTitle = signal('Dashboard');

  navItems = computed(() => {
    const role = this.role();
    const items = [
      { label: 'Dashboard',   path: '/dashboard',     icon: 'layout-dashboard', roles: ['Admin'] },
      { label: 'My Queue',    path: '/my-queue',      icon: 'activity',         roles: ['Doctor'] },
      { label: 'Appointments', path: '/appointments', icon: 'calendar',         roles: ['Admin', 'Receptionist'] },
      { label: 'Patients',    path: '/patients',      icon: 'users',            roles: ['Admin', 'Doctor', 'Receptionist'] },
      { label: 'Doctors',     path: '/doctors',       icon: 'stethoscope',      roles: ['Admin', 'Receptionist'] },
      { label: 'Invoices',    path: '/invoices',      icon: 'receipt',          roles: ['Admin', 'Receptionist'] },
      { label: 'Reports',     path: '/reports',       icon: 'bar-chart-3',       roles: ['Admin', 'Doctor'] },
      { label: 'Staff Admin', path: '/super-admin',   icon: 'shield-check',     roles: ['Admin'] },
      { label: 'Settings',    path: '/settings',      icon: 'settings',         roles: ['Admin'] },
    ];
    return items.filter(item => role && item.roles.includes(role));
  });

  async ngOnInit() {
    await this.signalr.connect();
  }

  async ngOnDestroy() {
    await this.signalr.disconnect();
  }

  toggleSidebar() {
    this.collapsed.update(v => !v);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
