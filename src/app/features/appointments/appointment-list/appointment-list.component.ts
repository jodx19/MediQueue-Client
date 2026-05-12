import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppointmentsClient, AppointmentSummaryDto } from '../../../core/api/api-facade.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { pageEnter } from '../../../shared/animations/page-animations';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, LoadingSkeletonComponent, BadgeComponent, EmptyStateComponent],
  animations: [pageEnter],
  template: `
    <app-page-header title="Appointments" subtitle="Today's schedule">
      <button class="btn-primary" id="btn-book-appointment" (click)="router.navigate(['/appointments/book'])">
        + Book Appointment
      </button>
    </app-page-header>

    @if (isLoading()) {
      <app-loading-skeleton [count]="5" />
    } @else if (appointments().length === 0) {
      <app-empty-state title="No appointments" message="Book the first appointment for today." actionLabel="Book Appointment" />
    } @else {
      <div class="appointment-list" @pageEnter>
        @for (appt of appointments(); track appt.id) {
          <div class="appointment-row" (click)="open(appt.id!)">
            <div class="appointment-time">
              {{ appt.scheduledAt | date:'shortTime' }}
            </div>
            <div class="appointment-info">
              <div class="appointment-patient">{{ appt.patientName }}</div>
              <div class="appointment-doctor">Dr. {{ appt.doctorName }}</div>
            </div>
            <div class="appointment-meta">
              <app-badge [label]="appt.status ?? 'Scheduled'" [variant]="statusVariant(appt.status)" />
              <span class="appointment-type">{{ appt.type }}</span>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .btn-primary {
      display: inline-flex; align-items: center; gap: var(--space-2);
      background: var(--color-accent); color: white; border: none;
      border-radius: var(--radius-md); padding: var(--space-2) var(--space-5);
      font-size: var(--text-sm); font-weight: 600; cursor: pointer; font-family: var(--font-family);
    }
    .appointment-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .appointment-row {
      display: flex; align-items: center; gap: var(--space-5);
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5);
      cursor: pointer; transition: all var(--duration-fast);
    }
    .appointment-row:hover { border-color: var(--color-accent); box-shadow: var(--shadow-sm); }
    .appointment-time {
      font-size: var(--text-lg); font-weight: 700; color: var(--color-accent);
      min-width: 80px; font-family: var(--font-mono);
    }
    .appointment-info { flex: 1; }
    .appointment-patient { font-weight: 600; font-size: var(--text-base); color: var(--color-text-primary); }
    .appointment-doctor { font-size: var(--text-sm); color: var(--color-text-secondary); }
    .appointment-meta { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-1); }
    .appointment-type { font-size: var(--text-xs); color: var(--color-text-tertiary); }
  `],
})
export class AppointmentListComponent implements OnInit {
  private readonly appointmentsClient = inject(AppointmentsClient);
  readonly router = inject(Router);

  appointments = signal<AppointmentSummaryDto[]>([]);
  isLoading = signal(true);

  async ngOnInit() {
    try {
      const result = await this.appointmentsClient.getToday();
      this.appointments.set(result ?? []);
    } finally {
      this.isLoading.set(false);
    }
  }

  open(id: string) {
    this.router.navigate(['/appointments', id]);
  }

  statusVariant(status: string | undefined): 'success' | 'warning' | 'danger' | 'info' | 'default' {
    const map: Record<string, any> = {
      'Completed': 'success', 'Cancelled': 'danger',
      'InProgress': 'info', 'Scheduled': 'warning',
    };
    return map[status ?? ''] ?? 'default';
  }
}
