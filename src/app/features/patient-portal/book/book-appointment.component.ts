import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { PatientsClient, DoctorsClient, AppointmentsClient, BookAppointmentCommand, VisitType, AppointmentPriority } from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';
import { firstValueFrom } from 'rxjs';

interface BookingState {
  step: 1|2|3|4;
  patient: any|null;
  mrn: string;
  specialty: string;
  doctor: any|null;
  slot: any|null;
  reason: string;
}

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './book-appointment.component.html',
})
export class BookAppointmentComponent {
  private patientsClient = inject(PatientsClient);
  private doctorsClient  = inject(DoctorsClient);
  private apptClient     = inject(AppointmentsClient);
  private notify         = inject(NotificationService);
  private router         = inject(Router);

  state = signal<BookingState>({
    step:1, patient:null, mrn:'', specialty:'',
    doctor:null, slot:null, reason:''
  });

  isLoading  = signal(false);
  doctors    = signal<any[]>([]);
  slots      = signal<any[]>([]);
  confirmed  = signal<any>(null);
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  specialties = [
    'General Medicine','Cardiology','Dermatology',
    'Orthopedics','Pediatrics','Gynecology',
    'Neurology','ENT','Ophthalmology','Dentistry'
  ];

  setStep(step: 1|2|3|4) {
    this.state.update(s => ({ ...s, step }));
  }

  setSlot(slot: any) {
    this.state.update(s => ({ ...s, slot }));
  }

  updateReason(val: string) {
    this.state.update(s => ({ ...s, reason: val }));
  }

  async findPatient() {
    const mrn = this.state().mrn.trim();
    if (!mrn) return;
    this.isLoading.set(true);
    try {
      const p = await firstValueFrom(this.patientsClient.mrn(mrn));
      this.state.update(s => ({ ...s, patient: p }));
      this.notify.success(`Welcome back, ${p.fullName || 'Patient'}!`);
    } catch {
      this.notify.error('Patient not found. Register first.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async selectSpecialty(spec: string) {
    this.state.update(s => ({ ...s, specialty: spec, step: 2 }));
    this.isLoading.set(true);
    try {
      const docs = await firstValueFrom(this.doctorsClient.specialty(spec as any));
      this.doctors.set(docs ?? []);
    } finally {
      this.isLoading.set(false);
    }
  }

  async selectDoctor(doc: any) {
    this.state.update(s => ({ ...s, doctor: doc, slot: null }));
    await this.loadSlots();
    this.state.update(s => ({ ...s, step: 3 }));
  }

  onDateSelect(date: string) {
    this.selectedDate.set(date);
    this.state.update(s => ({ ...s, slot: null }));
    this.loadSlots();
  }

  async loadSlots() {
    const doc = this.state().doctor;
    if (!doc) return;
    this.isLoading.set(true);
    try {
      const avail = await firstValueFrom(this.doctorsClient.availability(doc.id, new Date(this.selectedDate())));
      this.slots.set(avail?.slots ?? []);
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Failed to load slots');
    } finally {
      this.isLoading.set(false);
    }
  }

  async confirmBooking() {
    this.isLoading.set(true);
    try {
      const s = this.state();
      const result = await firstValueFrom(this.apptClient.appointmentsPOST(new BookAppointmentCommand({
        patientId:   s.patient.id,
        doctorId:    s.doctor.id,
        scheduledAt: s.slot!.startTime, // using startTime of AvailableSlotDto
        visitType:   VisitType._1,
        priority:    AppointmentPriority._1,
        chiefComplaint: s.reason,
      })));
      this.confirmed.set({
        referenceNumber: result.id?.substring(0,8).toUpperCase(),
        doctorName: `Dr. ${s.doctor.firstName} ${s.doctor.lastName}`,
        scheduledAt: result.scheduledAt
      });
      this.state.update(s => ({ ...s, step: 4 }));
    } catch(e:any) {
      this.notify.error(e?.error?.detail ?? 'Booking failed');
    } finally {
      this.isLoading.set(false);
    }
  }
}
