import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { 
  DashboardClient, 
  AppointmentsClient, 
  ClinicStatsDto, 
  AppointmentListItemDto 
} from '../../core/api/mediqueue-api';
import { InteractiveTableComponent, TableColumn } from '../../shared/components/interactive-table/interactive-table.component';
import { ApiErrorHandlerService } from '../../core/services/api-error-handler.service';
import { CurrencyEgpPipe } from '../../shared/pipes/currency-egp.pipe';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

interface MetricStat {
  label: string;
  value: string | number;
  change: string;
  positive: boolean;
  icon: string;
  color: string;
  glowColor: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    LucideAngularModule, 
    InteractiveTableComponent, 
    CurrencyEgpPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  animations: [
    trigger('dashboardEnter', [
      transition(':enter', [
        query('.stagger-item', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('500ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardClient = inject(DashboardClient);
  private readonly appointmentsClient = inject(AppointmentsClient);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
  private readonly router = inject(Router);

  // State Signals
  isLoading = signal(true);
  isLoadingAppointments = signal(true);
  stats = signal<ClinicStatsDto | null>(null);
  todayAppointments = signal<AppointmentListItemDto[]>([]);
  
  // Real-time Simulation
  readonly liveRevenue = signal(0);
  private revenueInterval: any;

  // Mock data for charts
  revenueBars = signal([40, 70, 45, 90, 65, 80, 55, 60, 40, 85, 50, 75]);
  
  appointmentColumns: TableColumn<AppointmentListItemDto>[] = [
    { key: 'patientName', header: 'Patient', type: 'text' },
    { key: 'scheduledAt', header: 'Time', type: 'date' },
    { key: 'status', header: 'Status', type: 'badge' },
    { key: 'actions', header: '', type: 'custom' }
  ];

  metricStats = computed((): MetricStat[] => {
    const s = this.stats();
    return [
      {
        label: 'Total Patients',
        value: (s?.totalPatients ?? 0).toLocaleString(),
        change: '+12%',
        positive: true,
        icon: 'users',
        color: '#2dd4bf',
        glowColor: 'rgba(45, 212, 191, 0.2)'
      },
      {
        label: 'Revenue (MTD)',
        value: `EGP ${(s?.revenueMonthToDate ?? 0).toLocaleString()}`,
        change: '+8.4%',
        positive: true,
        icon: 'banknote',
        color: '#fbbf24',
        glowColor: 'rgba(251, 191, 36, 0.2)'
      },
      {
        label: "Today's Queue",
        value: s?.appointmentsToday ?? 0,
        change: 'Live',
        positive: true,
        icon: 'calendar',
        color: '#818cf8',
        glowColor: 'rgba(129, 140, 248, 0.2)'
      },
      {
        label: 'Pending Billing',
        value: s?.pendingInvoices ?? 0,
        change: '-12%',
        positive: true,
        icon: 'receipt',
        color: '#f43f5e',
        glowColor: 'rgba(244, 63, 94, 0.2)'
      }
    ];
  });

  ngOnInit() {
    this.refreshStats();
    this.loadAppointments();
    
    // Simulate real-time data updates
    this.revenueInterval = setInterval(() => {
      this.revenueBars.update(bars => {
        const newBars = [...bars.slice(1), Math.floor(Math.random() * 60) + 30];
        return newBars;
      });
    }, 5000);
  }

  ngOnDestroy() {
    if (this.revenueInterval) clearInterval(this.revenueInterval);
  }

  async refreshStats() {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(this.dashboardClient.stats());
      this.stats.set(data ?? null);
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadAppointments() {
    this.isLoadingAppointments.set(true);
    try {
      const data = await firstValueFrom(this.appointmentsClient.today());
      this.todayAppointments.set(data?.slice(0, 6) ?? []);
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoadingAppointments.set(false);
    }
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  onAppointmentClick(appointment: AppointmentListItemDto) {
    this.router.navigate(['/appointments', appointment.id]);
  }
}
