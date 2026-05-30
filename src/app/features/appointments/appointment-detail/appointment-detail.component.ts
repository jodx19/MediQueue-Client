import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { AppointmentsClient, AppointmentDto, AppointmentStatus } from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';
import { ClinicalVisitsClient } from '../../../core/api/mediqueue-api';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './appointment-detail.component.html',
})
export class AppointmentDetailComponent implements OnInit {
  private readonly appointmentsClient = inject(AppointmentsClient);
  private readonly visitsClient       = inject(ClinicalVisitsClient);
  private readonly notify             = inject(NotificationService);
  private readonly route              = inject(ActivatedRoute);
  public  readonly router             = inject(Router);

  appointment = signal<AppointmentDto | null>(null);
  isLoading   = signal(true);
  id          = '';

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
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
