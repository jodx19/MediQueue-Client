import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { Client, AppointmentDto } from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';
import { pageEnter, listStagger } from '../../../shared/animations/page-animations';

@Component({
  selector: 'app-my-queue',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  animations: [pageEnter, listStagger],
  templateUrl: './my-queue.component.html',
})
export class MyQueueComponent {
  private readonly api = inject(Client);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly appointments = signal<AppointmentDto[]>([]);

  readonly waitingCount = computed(() => this.appointments().length);

  todayLabel(): string {
    return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const list = (await firstValueFrom(this.api.today(undefined) as any)) as AppointmentDto[];
      this.appointments.set(list ?? []);
    } catch (e: any) {
      const detail = e?.error?.detail ?? e?.message ?? 'Failed to load queue';
      this.error.set(typeof detail === 'string' ? detail : 'Failed to load queue');
      this.notify.error(this.error()!);
    } finally {
      this.loading.set(false);
    }
  }

  async startVisit(appt: AppointmentDto): Promise<void> {
    if (!appt.id) return;
    try {
      const visit = await firstValueFrom(this.api.appointment(appt.id));
      if (visit.id) {
        void this.router.navigate(['/clinical-visits', visit.id]);
      }
    } catch (e: any) {
      const detail = e?.error?.detail ?? e?.message ?? 'Could not open visit';
      this.notify.error(typeof detail === 'string' ? detail : 'Could not open visit');
    }
  }
}
