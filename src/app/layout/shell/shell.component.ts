import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import {
  LucideAngularModule,
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  Receipt,
  Shield,
  ListOrdered,
  Clipboard,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
} from 'lucide-angular';
import { AuthService } from '../../core/auth/auth.service';
import { SignalRService } from '../../core/services/signalr.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './shell.component.html',
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('500ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('500ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class ShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly signalR = inject(SignalRService);
  private readonly router = inject(Router);

  collapsed = signal(false);
  mobileMenuOpen = signal(false);

  readonly userRole = computed(() => this.auth.userRole());
  readonly currentUser = this.auth.currentUser;
  readonly signalRConnected = computed(() => this.signalR.connectionState() === 'connected');
  readonly notificationCount = this.signalR.notificationCount;

  readonly LucideIcons = {
    LayoutDashboard,
    Users,
    Stethoscope,
    Calendar,
    Receipt,
    Shield,
    ListOrdered,
    Clipboard,
    Search,
    Bell,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Menu,
  };

  adminNav = [
    { label: 'Dashboard', icon: 'LayoutDashboard', route: '/dashboard' },
    { label: 'Patients', icon: 'Users', route: '/patients/list' },
    { label: 'Doctors', icon: 'Stethoscope', route: '/doctors' },
    { label: 'Appointments', icon: 'Calendar', route: '/appointments' },
    { label: 'Invoices', icon: 'Receipt', route: '/invoices' },
    { label: 'Super Admin', icon: 'Shield', route: '/super-admin' },
  ];

  doctorNav = [
    { label: 'My Queue', icon: 'ListOrdered', route: '/my-queue' },
    { label: 'Patients', icon: 'Users', route: '/patients/list' },
  ];

  receptionistNav = [
    { label: 'Patients', icon: 'Users', route: '/patients/list' },
    { label: 'Appointments', icon: 'Calendar', route: '/appointments' },
    { label: 'Invoices', icon: 'Receipt', route: '/invoices' },
  ];

  readonly currentNav = computed(() => {
    switch (this.userRole()) {
      case 'Admin':
        return this.adminNav;
      case 'Doctor':
        return this.doctorNav;
      case 'Receptionist':
        return this.receptionistNav;
      default:
        return [];
    }
  });

  async ngOnInit(): Promise<void> {
    await this.signalR.connect();
  }

  toggleSidebar() {
    this.collapsed.set(!this.collapsed());
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  prepareRoute(outlet: any) {
    return outlet?.activatedRouteData?.['animation'];
  }

  logout(): void {
    this.auth.logout();
    void this.signalR.disconnect();
    void this.router.navigateByUrl('/auth/login');
  }
}
