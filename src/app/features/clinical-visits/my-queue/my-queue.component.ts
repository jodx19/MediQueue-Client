import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { AppointmentsClient, ClinicalVisitsClient, AppointmentListItemDto } from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/auth/auth.service';
import { pageEnter, listStagger } from '../../../shared/animations/page-animations';

@Component({
  selector: 'app-my-queue',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  animations: [pageEnter, listStagger],
  templateUrl: './my-queue.component.html',
})
export class MyQueueComponent implements OnInit {
  private readonly appointmentsClient = inject(AppointmentsClient);
  private readonly visitsClient = inject(ClinicalVisitsClient);
  private readonly notify = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly queueWarning = signal<string | null>(null);
  readonly appointments = signal<AppointmentListItemDto[]>([]);

  readonly waitingCount = computed(() => this.appointments().length);

  todayLabel(): string {
    return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }

  async ngOnInit() {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.queueWarning.set(null);
    try {
      const doctorId = this.auth.currentUser()?.doctorId;
      if (!doctorId) {
        this.queueWarning.set(
          'Doctor profile not linked to your account. Contact your administrator.'
        );
        this.appointments.set([]);
        return;
      }

      const list = await firstValueFrom(this.appointmentsClient.today(doctorId));
      this.appointments.set(list ?? []);
    } catch (e: any) {
      const detail = e?.error?.detail ?? e?.message ?? 'Failed to load queue';
      this.error.set(typeof detail === 'string' ? detail : 'Failed to load queue');
      this.notify.error(this.error()!);
    } finally {
      this.loading.set(false);
    }
  }

  async startVisit(appt: AppointmentListItemDto): Promise<void> {
    if (!appt.id) return;
    try {
      // Get or Start the clinical visit for this appointment
      const visit = await firstValueFrom(this.visitsClient.appointment(appt.id));
      if (visit && visit.id) {
        void this.router.navigate(['/clinical-visits', visit.id]);
      }
    } catch (e: any) {
      const detail = e?.error?.detail ?? e?.message ?? 'Could not open visit';
      this.notify.error(typeof detail === 'string' ? detail : 'Could not open visit');
    }
  }
}
