import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { AppointmentsClient, ClinicalVisitsClient, AppointmentListItemDto } from '../../../core/api/mediqueue-api';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';
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
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
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
    } catch (err) {
      this.apiErrorHandler.handle(err);
      this.error.set('Failed to load queue');
    } finally {
      this.loading.set(false);
    }
  }

  async startVisit(appt: AppointmentListItemDto): Promise<void> {
    if (!appt.id) return;
    try {
      const visit = await firstValueFrom(this.visitsClient.appointment(appt.id));
      if (visit && visit.id) {
        void this.router.navigate(['/clinical-visits', visit.id]);
      }
    } catch (err) {
      this.apiErrorHandler.handle(err);
    }
  }
}
