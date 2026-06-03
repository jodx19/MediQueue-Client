import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom, Subject, combineLatest, of } from 'rxjs';
import { debounceTime, filter, tap, switchMap, catchError, finalize, takeUntil } from 'rxjs/operators';
import {
  PatientsClient,
  DoctorsClient,
  AppointmentsClient,
  BookAppointmentCommand,
  VisitType,
  AppointmentPriority,
  DoctorSummaryDto,
  AvailableSlotDto,
} from '../../../core/api/mediqueue-api';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';
import { MedicalValidators } from '../../../core/validators/medical.validators';
import { FormErrorComponent } from '../../../shared/components/form-error/form-error.component';

type Step = 1 | 2 | 3 | 4;

interface PatientLookup {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  mrn?: string;
}

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, FormErrorComponent],
  templateUrl: './book-appointment.component.html',
  styleUrl: './book-appointment.component.scss',
})
export class BookAppointmentComponent implements OnInit, OnDestroy {
  private readonly fb               = inject(FormBuilder);
  private readonly patientsClient   = inject(PatientsClient);
  private readonly doctorsClient    = inject(DoctorsClient);
  private readonly apptClient       = inject(AppointmentsClient);
  private readonly authService      = inject(AuthService);
  private readonly notify           = inject(NotificationService);
  private readonly apiErrorHandler  = inject(ApiErrorHandlerService);
  private readonly router           = inject(Router);
  private readonly destroy$         = new Subject<void>();

  // ── UI state ────────────────────────────────────────────────────────────────
  step             = signal<Step>(1);
  isLoadingPatient = signal(false);
  isLoadingDoctors = signal(false);
  isLoadingSlots   = signal(false);
  isSaving         = signal(false);

  // ── Data signals ────────────────────────────────────────────────────────────
  foundPatient  = signal<PatientLookup | null>(null);
  doctors       = signal<DoctorSummaryDto[]>([]);
  slots         = signal<AvailableSlotDto[]>([]);
  selectedDoctor = signal<DoctorSummaryDto | null>(null);
  confirmed     = signal<{ referenceNumber: string; doctorName: string; scheduledAt: Date } | null>(null);

  // ── Computed helpers ─────────────────────────────────────────────────────────
  readonly specialties = [
    'General Medicine', 'Cardiology', 'Dermatology',
    'Orthopedics', 'Pediatrics', 'Gynecology',
    'Neurology', 'ENT', 'Ophthalmology', 'Dentistry',
  ];

  readonly tomorrow = computed(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  // ── Reactive form ────────────────────────────────────────────────────────────
  // MRN lookup form (step 1)
  readonly mrnForm = this.fb.group({
    mrn: ['', Validators.required],
  });

  // Specialty selection (step 2) — tracked by signal, no form control needed
  selectedSpecialty = signal<string>('');

  // Doctor + Slot form (step 3)
  readonly slotForm = this.fb.group({
    doctorId: ['', Validators.required],
    date:     ['', [Validators.required, MedicalValidators.futureDate()]],
    timeSlot: ['', Validators.required],
  });

  // Reason form (step 3 sub-section)
  readonly detailForm = this.fb.group({
    chiefComplaint: [''],
    notes:          [''],
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Auto-fill patient if logged in as Patient role
    const user = this.authService.currentUser();
    if (user?.role === 'Patient' && user.patientId) {
      this.foundPatient.set({ id: user.patientId, fullName: user.name });
      this.step.set(2);
    }

    // Reactive slot loading: doctorId + date → availability
    combineLatest([
      this.slotForm.controls.doctorId.valueChanges,
      this.slotForm.controls.date.valueChanges,
    ]).pipe(
      filter(([doctorId, date]) => !!doctorId && !!date),
      debounceTime(300),
      tap(() => {
        this.isLoadingSlots.set(true);
        this.slots.set([]);
        this.slotForm.controls.timeSlot.reset('');
      }),
      switchMap(([doctorId, date]) =>
        // NSwag: availability(id: string, date?: Date) → Observable<DoctorAvailabilityDto>
        this.doctorsClient.availability(doctorId!, new Date(date!)).pipe(
          catchError(err => {
            this.apiErrorHandler.handle(err);
            return of(null);
          }),
          finalize(() => this.isLoadingSlots.set(false)),
        )
      ),
      takeUntil(this.destroy$),
    ).subscribe(avail => {
      // DoctorAvailabilityDto.slots: AvailableSlotDto[] — filter out booked slots
      this.slots.set(avail?.slots?.filter(s => !s.isBooked) ?? []);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Step 1: Patient lookup ────────────────────────────────────────────────────
  async findPatient(): Promise<void> {
    const mrn = this.mrnForm.controls.mrn.value?.trim();
    if (!mrn) return;
    this.isLoadingPatient.set(true);
    try {
      const p = await firstValueFrom(this.patientsClient.mrn(mrn));
      this.foundPatient.set(p as PatientLookup);
      this.notify.success(`Welcome back, ${(p as any).firstName ?? (p as any).fullName ?? 'Patient'}!`);
    } catch {
      this.notify.error('Patient not found. Register first.');
    } finally {
      this.isLoadingPatient.set(false);
    }
  }

  // ── Step 2: Specialty → load doctors ─────────────────────────────────────────
  async selectSpecialty(spec: string): Promise<void> {
    this.selectedSpecialty.set(spec);
    this.step.set(3);
    this.isLoadingDoctors.set(true);
    try {
      // NSwag: doctorsGET(page?, size?) → PagedResult with .items: DoctorSummaryDto[]
      const result = await firstValueFrom(this.doctorsClient.doctorsGET(1, 100));
      this.doctors.set(result?.items ?? []);
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoadingDoctors.set(false);
    }
  }

  // ── Step 3: Doctor selection ──────────────────────────────────────────────────
  selectDoctor(doc: DoctorSummaryDto): void {
    this.selectedDoctor.set(doc);
    this.slotForm.controls.doctorId.setValue(doc.id ?? '');
    // Reset date + slot when doctor changes
    this.slotForm.controls.date.reset('');
    this.slotForm.controls.timeSlot.reset('');
    this.slots.set([]);
  }

  selectSlot(time: string): void {
    this.slotForm.controls.timeSlot.setValue(time);
  }

  onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.slotForm.controls.date.setValue(value);
    this.slotForm.controls.date.markAsTouched();
  }

  setStep(s: Step): void {
    this.step.set(s);
  }

  // ── Step 4: Submit ────────────────────────────────────────────────────────────
  async confirmBooking(): Promise<void> {
    if (this.slotForm.invalid) {
      this.slotForm.markAllAsTouched();
      return;
    }

    if (this.isLoadingSlots()) {
      this.notify.info('جاري تحميل المواعيد...');
      return;
    }

    const patient = this.foundPatient();
    if (!patient) {
      this.notify.error('No patient selected.');
      return;
    }

    this.isSaving.set(true);
    try {
      const sv = this.slotForm.getRawValue();
      const dv = this.detailForm.getRawValue();
      const doc = this.selectedDoctor();

      // NSwag: BookAppointmentCommand — scheduledAt: Date, visitType: VisitType, priority: AppointmentPriority
      const command = new BookAppointmentCommand({
        patientId:      patient.id,
        doctorId:       sv.doctorId!,
        scheduledAt:    new Date(`${sv.date}T${sv.timeSlot}:00`),
        visitType:      VisitType._1,
        priority:       AppointmentPriority._1,
        chiefComplaint: dv.chiefComplaint || undefined,
        notes:          dv.notes || undefined,
      });

      // NSwag: appointmentsPOST(body) → Observable<AppointmentDto>
      const result = await firstValueFrom(this.apptClient.appointmentsPOST(command));

      this.confirmed.set({
        referenceNumber: result.id?.substring(0, 8).toUpperCase() ?? 'N/A',
        doctorName:      `Dr. ${doc?.fullName ?? ''}`,
        scheduledAt:     result.scheduledAt ?? new Date(`${sv.date}T${sv.timeSlot}:00`),
      });
      this.step.set(4);
      this.notify.success('تم حجز الموعد بنجاح ✓');
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isSaving.set(false);
    }
  }
}
