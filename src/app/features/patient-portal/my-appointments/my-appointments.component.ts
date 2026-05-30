import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';
import { 
  AppointmentsClient, 
  DoctorsClient, 
  AppointmentDto, 
  DoctorSummaryDto,
  BookAppointmentCommand,
  CancelAppointmentCommand,
  VisitType,
  AppointmentPriority,
  AppointmentStatus
} from '../../../core/api/mediqueue-api';

const AS = AppointmentStatus;

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './my-appointments.component.html',
})
export class MyAppointmentsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly appointmentsClient = inject(AppointmentsClient);
  private readonly doctorsClient = inject(DoctorsClient);

  isLoading = signal(true);
  appointments = signal<AppointmentDto[]>([]);
  doctors = signal<DoctorSummaryDto[]>([]);
  activeFilter = signal<'all' | 'upcoming' | 'past' | 'cancelled'>('all');

  // Booking Modal State
  showBookModal = signal(false);
  isSubmitting = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  // Booking Form FormModel
  bookingForm = {
    doctorId: '',
    dateTime: '',
    visitType: '1', // 1 = General
    priority: '1',  // 1 = Routine
    chiefComplaint: '',
    notes: ''
  };

  // Filtered appointments list
  filteredAppointments = computed(() => {
    const list = this.appointments();
    const filter = this.activeFilter();
    const now = new Date();

    return list.filter(app => {
      if (!app.scheduledAt) return true;
      const appTime = new Date(app.scheduledAt);
      const isPast = appTime < now;
      const isCancelled = app.status === AS._5;

      if (filter === 'upcoming') {
        return !isPast && !isCancelled && app.status !== AS._4 && app.status !== AS._6;
      }
      if (filter === 'past') {
        return (isPast || app.status === AS._4) && !isCancelled;
      }
      if (filter === 'cancelled') {
        return isCancelled;
      }
      return true; // 'all'
    }).sort((a, b) => new Date(b.scheduledAt!).getTime() - new Date(a.scheduledAt!).getTime());
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const patientId = this.auth.currentUser()?.patientId;
    if (!patientId) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);

    // Load appointments and doctors in parallel
    this.appointmentsClient.patient(patientId, 1, 100).subscribe({
      next: (res: any) => {
        if (res && res.items) {
          this.appointments.set(res.items);
        }
        this.loadDoctors();
      },
      error: (err: any) => {
        console.error('Failed to load appointments:', err);
        this.loadDoctors();
      }
    });
  }

  loadDoctors() {
    this.doctorsClient.doctorsGET(1, 100).subscribe({
      next: (res: any) => {
        if (res && res.items) {
          this.doctors.set(res.items);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load doctors list:', err);
        this.isLoading.set(false);
      }
    });
  }

  openBookingModal() {
    this.bookingForm = {
      doctorId: this.doctors().length > 0 ? this.doctors()[0].id! : '',
      dateTime: '',
      visitType: '1',
      priority: '1',
      chiefComplaint: '',
      notes: ''
    };
    this.errorMsg.set('');
    this.successMsg.set('');
    this.showBookModal.set(true);
  }

  closeBookingModal() {
    this.showBookModal.set(false);
  }

  async onBookSubmit() {
    const patientId = this.auth.currentUser()?.patientId;
    if (!patientId) {
      this.errorMsg.set('Invalid session. Please login again.');
      return;
    }

    if (!this.bookingForm.doctorId || !this.bookingForm.dateTime || !this.bookingForm.chiefComplaint.trim()) {
      this.errorMsg.set('Please fill out all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMsg.set('');

    const command = new BookAppointmentCommand({
      patientId: patientId,
      doctorId: this.bookingForm.doctorId,
      scheduledAt: new Date(this.bookingForm.dateTime),
      durationMinutes: 30,
      visitType: Number(this.bookingForm.visitType) as VisitType,
      priority: Number(this.bookingForm.priority) as AppointmentPriority,
      chiefComplaint: this.bookingForm.chiefComplaint.trim(),
      notes: this.bookingForm.notes.trim() || undefined
    });

    this.appointmentsClient.appointmentsPOST(command).subscribe({
      next: () => {
        this.successMsg.set('Your appointment request was booked successfully!');
        setTimeout(() => {
          this.showBookModal.set(false);
          this.loadData();
        }, 1500);
      },
      error: (err: any) => {
        console.error('Failed to book appointment:', err);
        this.errorMsg.set(err?.error?.detail || err?.error || 'An error occurred while booking. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  cancelAppointment(id: string) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    this.appointmentsClient.cancel(id, new CancelAppointmentCommand({ reason: 'Patient cancelled' })).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err: any) => {
        console.error('Failed to cancel appointment:', err);
        alert('Could not cancel appointment. It may already be in progress.');
      }
    });
  }

  getStatusLabel(status: AppointmentStatus | undefined): string {
    switch (status) {
      case AS._1: return 'Scheduled';
      case AS._2: return 'Checked In';
      case AS._3: return 'In Session';
      case AS._4: return 'Completed';
      case AS._5: return 'Cancelled';
      case AS._6: return 'No Show';
      default: return 'Unknown';
    }
  }

  getSeverityClass(status: AppointmentStatus | undefined): string {
    switch (status) {
      case AS._1: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case AS._2: return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case AS._3: return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case AS._4: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case AS._5: return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case AS._6: return 'bg-mq-700 text-mq-s400';
      default: return 'bg-mq-700 text-mq-s300';
    }
  }

  canCancel(status: AppointmentStatus | undefined): boolean {
    return status === AS._1 || status === AS._2;
  }
}
