import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';
import { 
  PatientsClient, 
  AppointmentsClient, 
  ClinicalVisitsClient, 
  InvoicesClient,
  PatientDetailDto,
  AppointmentDto,
  ClinicalVisitSummaryDto,
  InvoiceDto,
  InvoiceStatus,
  AppointmentStatus
} from '../../../core/api/mediqueue-api';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

const IS = InvoiceStatus;
const AS = AppointmentStatus;

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './patient-dashboard.component.html',
})
export class PatientDashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly patientsClient = inject(PatientsClient);
  private readonly appointmentsClient = inject(AppointmentsClient);
  private readonly visitsClient = inject(ClinicalVisitsClient);
  private readonly invoicesClient = inject(InvoicesClient);

  isLoading = signal(true);
  patientDetails = signal<PatientDetailDto | null>(null);
  upcomingAppointments = signal<AppointmentDto[]>([]);
  recentVisits = signal<ClinicalVisitSummaryDto[]>([]);
  invoices = signal<InvoiceDto[]>([]);

  isInvoiceUnpaid(inv: InvoiceDto): boolean {
    return inv.status === IS._2 || inv.status === IS._3 || inv.status === IS._5;
  }

  // Statistics signals
  unpaidCount = computed(() => {
    return this.invoices().filter(inv => this.isInvoiceUnpaid(inv)).length;
  });

  totalUnpaidAmount = computed(() => {
    return this.invoices()
      .filter(inv => this.isInvoiceUnpaid(inv))
      .reduce((sum, inv) => sum + (inv.remainingAmount ?? inv.totalAmount ?? 0), 0);
  });

  nextAppointment = computed(() => {
    const now = new Date();
    const future = this.upcomingAppointments()
      .filter(app => app.scheduledAt && new Date(app.scheduledAt) > now && app.status !== AS._5 && app.status !== AS._6)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
    return future[0] || null;
  });

  ngOnInit() {
    const patientId = this.auth.currentUser()?.patientId;
    if (!patientId) {
      this.isLoading.set(false);
      return;
    }

    // Parallel fetch of patient details, appointments, medical records, and invoices
    forkJoin({
      details: this.patientsClient.patientsGET2(patientId).pipe(catchError(() => of(null))),
      appointments: this.appointmentsClient.patient(patientId, 1, 10).pipe(catchError(() => of(null))),
      visits: this.visitsClient.patient2(patientId, 1, 5).pipe(catchError(() => of(null))),
      invoices: this.invoicesClient.patient3(patientId, 1, 10).pipe(catchError(() => of(null)))
    }).subscribe({
      next: (res: any) => {
        if (res.details) {
          this.patientDetails.set(res.details);
        }
        if (res.appointments && res.appointments.items) {
          this.upcomingAppointments.set(res.appointments.items);
        }
        if (res.visits && res.visits.items) {
          this.recentVisits.set(res.visits.items);
        }
        if (res.invoices && res.invoices.items) {
          this.invoices.set(res.invoices.items);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading patient dashboard data:', err);
        this.isLoading.set(false);
      }
    });
  }

  getSeverityClass(status: any): string {
    // Green: Paid, Completed, Scheduled
    if (status === IS._4 || status === AS._4 || status === AS._1) {
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    // Orange: Checked In, In Session, PartiallyPaid
    if (status === IS._3 || status === AS._2 || status === AS._3) {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
    // Red: Unpaid, Overdue, Cancelled, No Show
    if (status === IS._2 || status === IS._5 || status === AS._5 || status === AS._6) {
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    }
    return 'bg-mq-700 text-mq-s300';
  }

  getStatusLabel(status: any): string {
    if (status === IS._1) return 'Draft';
    if (status === IS._2) return 'Unpaid';
    if (status === IS._3) return 'Partial';
    if (status === IS._4) return 'Paid';
    if (status === IS._5) return 'Overdue';
    if (status === IS._6) return 'Cancelled';

    if (status === AS._1) return 'Scheduled';
    if (status === AS._2) return 'Checked In';
    if (status === AS._3) return 'In Session';
    if (status === AS._4) return 'Completed';
    if (status === AS._5) return 'Cancelled';
    if (status === AS._6) return 'No Show';

    return 'Unknown';
  }
}
