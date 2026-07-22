import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import {
  AppointmentsClient, AppointmentListItemDto,
  PatientsClient, DoctorsClient,
  BookAppointmentCommand, VisitType, AppointmentPriority,
  CancelAppointmentCommand, PatientSummaryDto, DoctorSummaryDto,
  ClinicalVisitsClient
} from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

type FilterTab = 'today' | 'upcoming' | 'past';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, PaginationComponent],
  templateUrl: './appointment-list.component.html',
})
export class AppointmentListComponent implements OnInit {
  private readonly appointmentsClient = inject(AppointmentsClient);
  private readonly patientsClient     = inject(PatientsClient);
  private readonly doctorsClient      = inject(DoctorsClient);
  private readonly visitsClient       = inject(ClinicalVisitsClient);
  private readonly notify             = inject(NotificationService);
  public  readonly router             = inject(Router);

  isLoading    = signal(true);
  allAppointments = signal<AppointmentListItemDto[]>([]);
  page         = signal(1);
  total        = signal(0);
  activeFilter = signal<FilterTab>('today');
  showModal    = signal(false);

  readonly appointments = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.allAppointments().slice(start, start + PAGE_SIZE);
  });

  // Modal state
  modalLoading    = signal(false);
  patientSearch   = signal('');
  patientResults  = signal<PatientSummaryDto[]>([]);
  selectedPatient = signal<PatientSummaryDto | null>(null);
  doctors         = signal<DoctorSummaryDto[]>([]);
  bookForm = {
    doctorId:    '',
    scheduledAt: '',
    reason:      '',
    priority:    AppointmentPriority._1,
  };

  async ngOnInit() {
    await this.loadToday();
    await this.loadDoctors();
  }

  async loadToday() {
    this.isLoading.set(true);
    this.activeFilter.set('today');
    this.page.set(1);
    try {
      const data = await firstValueFrom(this.appointmentsClient.today());
      const items = data ?? [];
      this.allAppointments.set(items);
      this.total.set(items.length);
    } catch (err) {
      this.notify.error('Failed to load appointments');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadUpcoming() {
    this.isLoading.set(true);
    this.activeFilter.set('upcoming');
    this.page.set(1);
    try {
      const data = await firstValueFrom(this.appointmentsClient.upcoming(7));
      const items = data ?? [];
      this.allAppointments.set(items);
      this.total.set(items.length);
    } catch (err) {
      this.notify.error('Failed to load upcoming');
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(newPage: number) {
    this.page.set(newPage);
  }

  private async loadDoctors() {
    try {
      const data = await firstValueFrom(this.doctorsClient.doctorsGET(1, 100));
      this.doctors.set(data?.items ?? []);
    } catch { /* silent */ }
  }

  async searchPatients(event: Event) {
    const q = (event.target as HTMLInputElement).value;
    this.patientSearch.set(q);
    if (q.length < 2) { this.patientResults.set([]); return; }
    try {
      const res = await firstValueFrom(this.patientsClient.search(q, 1, 10));
      this.patientResults.set(res?.items ?? []);
    } catch { /* silent */ }
  }

  selectPatient(p: PatientSummaryDto) {
    this.selectedPatient.set(p);
    this.patientSearch.set(p.fullName ?? '');
    this.patientResults.set([]);
  }

  async bookAppointment() {
    if (!this.selectedPatient() || !this.bookForm.doctorId || !this.bookForm.scheduledAt) {
      this.notify.error('Please fill all required fields');
      return;
    }
    this.modalLoading.set(true);
    try {
      await firstValueFrom(this.appointmentsClient.appointmentsPOST(new BookAppointmentCommand({
        patientId:   this.selectedPatient()!.id!,
        doctorId:    this.bookForm.doctorId,
        scheduledAt: new Date(this.bookForm.scheduledAt),
        visitType:   VisitType._1,
        priority:    this.bookForm.priority,
        chiefComplaint: this.bookForm.reason,
      })));
      this.notify.success('Appointment booked successfully!');
      this.showModal.set(false);
      await this.loadToday();
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Booking failed');
    } finally {
      this.modalLoading.set(false);
    }
  }

  async cancelAppt(id: string) {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await firstValueFrom(this.appointmentsClient.cancel(id, new CancelAppointmentCommand({ reason: 'Cancelled via UI' })));
      this.notify.success('Appointment cancelled');
      await this.loadToday();
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Cancel failed');
    }
  }

  async startOrViewVisit(appt: AppointmentListItemDto) {
    if (!appt.id) return;
    try {
      const visit = await firstValueFrom(this.visitsClient.appointment(appt.id));
      if (visit?.id) {
        this.router.navigate(['/clinical-visits', visit.id]);
      }
    } catch (err: any) {
      this.notify.error('Could not open visit');
    }
  }

  getStatusCount(status: string): number {
    return this.allAppointments().filter(a => (a.status as any) === status).length;
  }

  statusClass(status: any): string {
    const map: Record<string, string> = {
      'Scheduled': 'inline-flex px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30',
      'CheckedIn': 'inline-flex px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30',
      'InSession':  'inline-flex px-2 py-0.5 rounded-full text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30',
      'Completed':  'inline-flex px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      'Cancelled':  'inline-flex px-2 py-0.5 rounded-full text-xs bg-rose-500/15 text-rose-400 border border-rose-500/30',
    };
    return map[status] ?? 'inline-flex px-2 py-0.5 rounded-full text-xs bg-mq-700 text-mq-s400';
  }
}
