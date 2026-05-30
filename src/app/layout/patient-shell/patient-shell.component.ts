import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth/auth.service';
import { SignalRService } from '../../core/services/signalr.service';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-patient-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, ToastComponent],
  templateUrl: './patient-shell.component.html',
  styleUrls: ['./patient-shell.component.scss'],
  animations: [
    trigger('sidebarToggle', [
      state('expanded', style({ width: '260px' })),
      state('collapsed', style({ width: '80px' })),
      transition('expanded <=> collapsed', animate('250ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ])
  ]
})
export class PatientShellComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly signalr = inject(SignalRService);
  private readonly router = inject(Router);

  collapsed = signal(false);
  sidebarState = computed(() => this.collapsed() ? 'collapsed' : 'expanded');
  
  user = computed(() => this.auth.currentUser());
  role = computed(() => this.auth.userRole());
  initials = computed(() => this.user()?.name?.[0]?.toUpperCase() || 'P');
  
  connected = computed(() => this.signalr.connectionState() === 'connected');
  notifCount = computed(() => this.signalr.notificationCount());
  showNotifs = signal(false);

  pageTitle = computed(() => {
    const url = this.router.url;
    if (url.includes('/my-portal')) return 'Patient Dashboard';
    if (url.includes('/my-appointments')) return 'My Appointments';
    if (url.includes('/my-records')) return 'My Medical Records';
    if (url.includes('/my-invoices')) return 'My Invoices & Payments';
    return 'Patient Portal';
  });

  navItems = [
    { label: 'Portal Dashboard', path: '/my-portal',      icon: 'layout-dashboard' },
    { label: 'My Appointments',  path: '/my-appointments',  icon: 'calendar' },
    { label: 'Medical History',  path: '/my-records',       icon: 'file-text' },
    { label: 'Invoices & Bills', path: '/my-invoices',      icon: 'receipt' },
  ];

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
    this.router.navigate(['/patient-login']);
  }
}
