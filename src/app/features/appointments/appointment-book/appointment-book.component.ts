import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { debounceTime, startWith, takeUntil } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import {
  BookAppointmentCommand, AppointmentsClient, DoctorsClient,
  VisitType, AppointmentPriority,
} from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { FormErrorComponent } from '../../../shared/components/form-error/form-error.component';
import { MedicalValidators } from '../../../core/validators/medical.validators';
import { pageEnter } from '../../../shared/animations/page-animations';

@Component({
  selector: 'app-appointment-book',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, FormErrorComponent],
  animations: [pageEnter],
  template: `
    <app-page-header title="Book Appointment" subtitle="Schedule a new patient visit">
      <button class="btn-secondary" (click)="router.navigate(['/appointments'])">Cancel</button>
    </app-page-header>

    <div class="form-card" @pageEnter>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="form-grid">

          <!-- Patient -->
          <div class="field-group">
            <label class="field-label">Patient ID / MRN *</label>
            <input formControlName="patientId" type="text" class="field-input"
                   [class.error]="c.patientId.invalid && c.patientId.touched"
                   placeholder="Enter patient ID…"/>
            <app-form-error [control]="c.patientId"/>
          </div>

          <!-- Doctor -->
          <div class="field-group">
            <label class="field-label">Doctor *</label>
            <select formControlName="doctorId" class="field-input"
                    [class.error]="c.doctorId.invalid && c.doctorId.touched">
              <option value="">— Select Doctor —</option>
              @for (doc of doctors(); track doc.id) {
                <option [value]="doc.id">
                  Dr. {{ doc.firstName }} {{ doc.lastName }} — {{ doc.specialization }}
                </option>
              }
            </select>
            <app-form-error [control]="c.doctorId"/>
          </div>

          <!-- Date -->
          <div class="field-group">
            <label class="field-label">Date *</label>
            <input formControlName="date" type="date" class="field-input"
                   [class.error]="c.date.invalid && c.date.touched"
                   [min]="today"
                   data-testid="date-input"/>
            <app-form-error [control]="c.date"/>
          </div>

          <!-- Type -->
          <div class="field-group">
            <label class="field-label">Appointment Type</label>
            <select formControlName="type" class="field-input">
              @for (t of typeOptions; track t) { <option [value]="t">{{ t }}</option> }
            </select>
          </div>

          <!-- Priority -->
          <div class="field-group">
            <label class="field-label">Priority</label>
            <select formControlName="priority" class="field-input">
              @for (p of priorityOptions; track p) { <option [value]="p">{{ p }}</option> }
            </select>
          </div>

          <!-- Available Slots — full width, shown once doctor + valid date are set -->
          <div class="field-group field-group--full">
            @if (isLoadingSlots()) {
              <div style="display:flex;align-items:center;gap:8px;padding:8px 0">
                <span class="spinner"></span>
                <span class="field-label">Loading available slots…</span>
              </div>
            } @else if (c.doctorId.value && c.date.value && !c.date.invalid) {
              <label class="field-label">
                Available Slot *
                <span class="text-muted" style="font-weight:400"> — {{ c.date.value | date:'EEEE, MMM d' }}</span>
              </label>
              @if (availableSlots().length === 0) {
                <p class="text-muted" style="font-size:var(--text-sm);margin-top:8px">
                  No available slots for this date.
                </p>
              } @else {
                <div class="slots-grid" data-testid="slots-grid">
                  @for (slot of availableSlots(); track slot.startTime) {
                    <button type="button"
                            (click)="selectSlot(slot)"
                            [class]="isSelectedSlot(slot) ? 'slot-btn slot-btn--active' : 'slot-btn'">
                      {{ slot.startTime | date:'h:mm a' }}
                    </button>
                  }
                </div>
              }
              <app-form-error [control]="c.timeSlot"/>
            } @else {
              <p class="text-muted" style="font-size:var(--text-xs)">
                Select a doctor and a valid future date to see available slots.
              </p>
            }
          </div>

          <!-- Reason -->
          <div class="field-group field-group--full">
            <label class="field-label">Reason for Visit</label>
            <textarea formControlName="reason" class="field-input field-textarea"
                      placeholder="Describe the reason for this appointment…" rows="3"></textarea>
          </div>

        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary"
                  (click)="router.navigate(['/appointments'])">Cancel</button>
          <button type="submit" id="btn-book" class="btn-primary" [disabled]="isLoading()">
            @if (isLoading()) { <span class="spinner"></span> Booking… }
            @else { Book Appointment }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-card {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-xl); padding: var(--space-8); box-shadow: var(--shadow-sm);
    }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-5); }
    .field-group { display: flex; flex-direction: column; }
    .field-group--full { grid-column: 1 / -1; }
    .field-label {
      font-size: var(--text-sm); font-weight: 500;
      color: var(--color-text-primary); margin-bottom: var(--space-2);
    }
    .text-muted { color: var(--color-text-secondary); }
    .field-input {
      padding: var(--space-3) var(--space-4); border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-md); font-size: var(--text-sm); font-family: var(--font-family);
      color: var(--color-text-primary); background: var(--color-surface); outline: none;
      transition: border-color var(--duration-fast);
    }
    .field-input:focus  { border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-light); }
    .field-input.error  { border-color: var(--mq-danger, #f43f5e); }
    .field-textarea { resize: vertical; }
    .slots-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
      gap: var(--space-2); margin-top: var(--space-2);
    }
    .slot-btn {
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
      font-size: var(--text-xs); font-weight: 500; cursor: pointer;
      border: 1px solid var(--color-border-strong); color: var(--color-text-secondary);
      background: var(--color-surface); transition: all var(--duration-fast);
    }
    .slot-btn:hover { border-color: var(--color-accent); color: var(--color-text-primary); }
    .slot-btn--active {
      border-color: var(--color-accent); background: var(--color-accent-light);
      color: var(--color-accent); font-weight: 600;
    }
    .form-actions {
      display: flex; justify-content: flex-end; gap: var(--space-3);
      padding-top: var(--space-6); border-top: 1px solid var(--color-border);
      margin-top: var(--space-6);
    }
    .btn-primary {
      display: inline-flex; align-items: center; gap: var(--space-2);
      background: var(--color-accent); color: white; border: none;
      border-radius: var(--radius-md); padding: var(--space-3) var(--space-6);
      font-size: var(--text-sm); font-weight: 600; cursor: pointer; font-family: var(--font-family);
    }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary {
      background: var(--color-surface-2); color: var(--color-text-primary);
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-5); font-size: var(--text-sm);
      cursor: pointer; font-family: var(--font-family);
    }
    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.7s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class AppointmentBookComponent implements OnInit, OnDestroy {
  private readonly fb                 = inject(FormBuilder);
  private readonly appointmentsClient = inject(AppointmentsClient);
  private readonly doctorsClient      = inject(DoctorsClient);
  private readonly notifications      = inject(NotificationService);
  readonly router                     = inject(Router);
  private readonly route              = inject(ActivatedRoute);
  private readonly destroy$           = new Subject<void>();

  doctors        = signal<any[]>([]);
  availableSlots = signal<any[]>([]);
  isLoading      = signal(false);
  isLoadingSlots = signal(false);

  readonly today         = new Date().toISOString().split('T')[0];
  readonly typeOptions   = ['Regular', 'FollowUp', 'Emergency', 'Consultation', 'CheckUp'];
  readonly priorityOptions = ['Normal', 'Urgent', 'Low'];

  private readonly visitTypeMap: Record<string, VisitType> = {
    Regular: VisitType._1, FollowUp: VisitType._2, Emergency: VisitType._3,
    Consultation: VisitType._4, CheckUp: VisitType._5,
  };
  private readonly priorityMap: Record<string, AppointmentPriority> = {
    Normal: AppointmentPriority._1, Urgent: AppointmentPriority._2, Low: AppointmentPriority._3,
  };

  readonly form = this.fb.group({
    patientId: ['', [Validators.required]],
    doctorId:  ['', [Validators.required]],
    date:      ['', [Validators.required, MedicalValidators.futureDate()]],
    timeSlot:  [null as any, [Validators.required]],
    type:      ['Regular'],
    priority:  ['Normal'],
    reason:    [''],
  });

  get c() { return this.form.controls; }

  async ngOnInit(): Promise<void> {
    // Pre-fill patientId from query param (e.g. navigated from patient detail)
    const patientId = this.route.snapshot.queryParamMap.get('patientId');
    if (patientId) this.c.patientId.setValue(patientId);

    // Load doctors list
    const result = await firstValueFrom(this.doctorsClient.doctorsGET());
    this.doctors.set((result as any).items ?? result ?? []);

    // Reactively load slots whenever doctorId OR date changes
    combineLatest([
      this.c.doctorId.valueChanges.pipe(startWith(this.c.doctorId.value)),
      this.c.date.valueChanges.pipe(startWith(this.c.date.value)),
    ]).pipe(
      debounceTime(300),
      takeUntil(this.destroy$),
    ).subscribe(([doctorId, date]) => {
      // Always reset slot selection when either input changes
      if (this.c.timeSlot.value !== null) this.c.timeSlot.reset(null);
      this.availableSlots.set([]);
      if (doctorId && date && !this.c.date.invalid) {
        this.loadSlots(doctorId, date);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadSlots(doctorId: string, date: string): Promise<void> {
    this.isLoadingSlots.set(true);
    try {
      const avail = await firstValueFrom(
        this.doctorsClient.availability(doctorId, new Date(date))
      );
      this.availableSlots.set(avail?.slots ?? []);
    } catch {
      this.availableSlots.set([]);
    } finally {
      this.isLoadingSlots.set(false);
    }
  }

  selectSlot(slot: any): void {
    this.c.timeSlot.setValue(slot);
  }

  isSelectedSlot(slot: any): boolean {
    const selected = this.c.timeSlot.value as any;
    if (!selected) return false;
    return selected?.startTime?.getTime() === slot?.startTime?.getTime();
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const slot = v.timeSlot as any;
    this.isLoading.set(true);
    try {
      const command = new BookAppointmentCommand({
        patientId:      v.patientId!,
        doctorId:       v.doctorId!,
        scheduledAt:    slot?.startTime ?? new Date(),
        visitType:      this.visitTypeMap[v.type!]     ?? VisitType._1,
        priority:       this.priorityMap[v.priority!]  ?? AppointmentPriority._1,
        chiefComplaint: v.reason || undefined,
      });
      const result = await firstValueFrom(this.appointmentsClient.appointmentsPOST(command));
      this.notifications.success('Appointment booked successfully!');
      this.router.navigate(['/appointments', result.id]);
    } catch (err: any) {
      this.notifications.error(err?.error?.detail ?? 'Booking failed.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
