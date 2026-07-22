import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import {
  AppointmentsClient, AppointmentDto, AppointmentStatus,
  RescheduleAppointmentCommand,
} from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';
import { ClinicalVisitsClient } from '../../../core/api/mediqueue-api';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './appointment-detail.component.html',
})
export class AppointmentDetailComponent implements OnInit {
  private readonly appointmentsClient = inject(AppointmentsClient);
  private readonly visitsClient       = inject(ClinicalVisitsClient);
  private readonly notify             = inject(NotificationService);
  private readonly route              = inject(ActivatedRoute);
  public  readonly router             = inject(Router);

  appointment     = signal<AppointmentDto | null>(null);
  isLoading       = signal(true);
  isSubmitting    = signal(false);
  id              = '';

  // ── Reschedule ────────────────────────────────────────────────────────
  // Only appointments still in the "Scheduled" state can be rescheduled —
  // once the patient has checked in or the encounter has begun, the time
  // is no longer movable. RescheduleAppointmentCommand carries only the
  // new timestamp + appointmentId (no reason field on the backend), so we
  // don't expose one in the UI.
  showReschedule = signal(false);
  newScheduledAt = '';

  // Earliest selectable time = now + 30 min, formatted as the yyyy-MM-ddTHH:mm
  // value a datetime-local input expects. This guards against rescheduling
  // to a time in the past or in the immediate buffer window.
  readonly minDate = computed(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  });

  // Only Scheduled (_1) appointments are reschedulable. Other statuses are
  // either already in progress, completed, or cancelled and would silently
  // fail on the server.
  readonly canReschedule = computed(() =>
    this.appointment()?.status === AppointmentStatus._1
  );

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    await this.loadAppointment();
  }

  async loadAppointment() {
    this.isLoading.set(true);
    try {
      const result = await firstValueFrom(this.appointmentsClient.appointmentsGET(this.id));
      this.appointment.set(result);
    } catch (err) {
      this.notify.error('Failed to load appointment');
    } finally {
      this.isLoading.set(false);
    }
  }

  async checkIn() {
    try {
      const result = await firstValueFrom(this.appointmentsClient.checkIn(this.id));
      this.appointment.set(result);
      this.notify.success('Patient checked in!');
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Check-in failed');
    }
  }

  async startVisit() {
    try {
      const visit = await firstValueFrom(this.visitsClient.appointment(this.id));
      if (visit?.id) {
        this.router.navigate(['/clinical-visits', visit.id]);
      }
    } catch (err: any) {
      this.notify.error('Could not open visit');
    }
  }

  async rescheduleAppointment() {
    if (!this.newScheduledAt) return;
    this.isSubmitting.set(true);
    try {
      await firstValueFrom(this.appointmentsClient.reschedule(
        this.id,
        new RescheduleAppointmentCommand({
          appointmentId:   this.id,
          newScheduledAt:  new Date(this.newScheduledAt),
        }),
      ));
      this.notify.success('Appointment rescheduled');
      this.showReschedule.set(false);
      this.newScheduledAt = '';
      await this.loadAppointment();
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Failed to reschedule');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  AppointmentStatus = AppointmentStatus;

  getStatusName(status?: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus._1: return 'Scheduled';
      case AppointmentStatus._2: return 'Checked In';
      case AppointmentStatus._3: return 'In Session';
      case AppointmentStatus._4: return 'Completed';
      case AppointmentStatus._5: return 'Cancelled';
      case AppointmentStatus._6: return 'No Show';
      default: return 'Unknown';
    }
  }

  statusClass(status?: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus._1: return 'px-3 py-1 rounded-full text-sm bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case AppointmentStatus._2: return 'px-3 py-1 rounded-full text-sm bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case AppointmentStatus._3: return 'px-3 py-1 rounded-full text-sm bg-purple-500/15 text-purple-400 border border-purple-500/30';
      case AppointmentStatus._4: return 'px-3 py-1 rounded-full text-sm bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case AppointmentStatus._5: return 'px-3 py-1 rounded-full text-sm bg-rose-500/15 text-rose-400 border border-rose-500/30';
      case AppointmentStatus._6: return 'px-3 py-1 rounded-full text-sm bg-mq-700 text-mq-s400';
      default: return 'px-3 py-1 rounded-full text-sm bg-mq-700 text-mq-s400';
    }
  }
}
