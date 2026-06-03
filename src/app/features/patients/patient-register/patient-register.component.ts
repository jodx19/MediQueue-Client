import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  RegisterPatientCommand,
  PatientsClient,
  Gender,
  BloodType,
} from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';
import { MedicalValidators } from '../../../core/validators/medical.validators';
import { FormErrorComponent } from '../../../shared/components/form-error/form-error.component';

type Step = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-patient-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, FormErrorComponent],
  templateUrl: './patient-register.component.html',
})
export class PatientRegisterComponent implements OnInit, OnDestroy {
  private readonly fb             = inject(FormBuilder);
  private readonly patientsClient = inject(PatientsClient);
  private readonly notifications  = inject(NotificationService);
  public  readonly router         = inject(Router);
  private readonly destroy$       = new Subject<void>();

  step      = signal<Step>(1);
  isLoading = signal(false);
  mrn       = signal<string | null>(null);

  // Expose enums to template
  readonly Gender    = Gender;
  readonly BloodType = BloodType;
  readonly today     = new Date().toISOString().split('T')[0];

  readonly genderOptions = [
    { label: 'Male',   value: Gender._1 },
    { label: 'Female', value: Gender._2 },
    { label: 'Other',  value: Gender._3 },
  ];

  readonly bloodTypeOptions = [
    { label: 'Unknown', value: BloodType._0 },
    { label: 'A+',  value: BloodType._1 }, { label: 'A-',  value: BloodType._2 },
    { label: 'B+',  value: BloodType._3 }, { label: 'B-',  value: BloodType._4 },
    { label: 'AB+', value: BloodType._5 }, { label: 'AB-', value: BloodType._6 },
    { label: 'O+',  value: BloodType._7 }, { label: 'O-',  value: BloodType._8 },
  ];

  readonly pregnancyStatusOptions = [
    { label: 'Not Pregnant', value: 'NotPregnant' },
    { label: 'Pregnant',     value: 'Pregnant'    },
    { label: 'Unknown',      value: 'Unknown'     },
  ];

  // ── Reactive form ─────────────────────────────────────────────────────────
  readonly form = this.fb.group({
    // Step 1 — Personal
    firstName:        ['', [Validators.required]],
    lastName:         ['', [Validators.required]],
    dateOfBirth:      ['', [Validators.required, MedicalValidators.pastDate()]],
    gender:           [Gender._1 as Gender, [Validators.required]],
    nationalId:       ['', [Validators.required, MedicalValidators.nationalId()]],
    bloodType:        [BloodType._0 as BloodType],

    // Step 2 — Contact
    phone:            ['', [Validators.required, MedicalValidators.egyptianPhone()]],
    email:            ['', [Validators.email]],
    address:          [''],
    pregnancyStatus:  [{ value: '', disabled: true }],   // enabled only for Female
  });

  // ── Convenient control accessors ──────────────────────────────────────────
  get c() { return this.form.controls; }

  // ── Step validity (checked before allowing navigation) ────────────────────
  private readonly step1Names = ['firstName', 'lastName', 'dateOfBirth', 'nationalId', 'gender'] as const;
  private readonly step2Names = ['phone', 'email'] as const;

  get step1Valid(): boolean {
    return this.step1Names.every(n => !this.c[n].invalid);
  }

  get step2Valid(): boolean {
    return this.step2Names.every(n => !this.c[n].invalid);
  }

  isFemale(): boolean {
    return this.c.gender.value === Gender._2;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Enable / disable pregnancyStatus based on gender selection
    this.c.gender.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(gender => {
        if (gender === Gender._2) {
          this.c.pregnancyStatus.enable();
        } else {
          this.c.pregnancyStatus.disable();
          this.c.pregnancyStatus.reset('');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Step navigation ───────────────────────────────────────────────────────
  nextStep1(): void {
    if (!this.step1Valid) {
      this.step1Names.forEach(n => this.c[n].markAsTouched());
      this.scrollToFirstError();
      return;
    }
    this.step.set(2);
  }

  nextStep2(): void {
    if (!this.step2Valid) {
      this.step2Names.forEach(n => this.c[n].markAsTouched());
      this.scrollToFirstError();
      return;
    }
    this.step.set(3);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.scrollToFirstError();
      return;
    }

    const v = this.form.getRawValue();
    this.isLoading.set(true);
    try {
      const command = new RegisterPatientCommand({
        firstName:   v.firstName!,
        lastName:    v.lastName!,
        dateOfBirth: new Date(v.dateOfBirth!),
        gender:      v.gender!,
        nationalId:  v.nationalId!,
        phone:       v.phone!,
        email:       v.email || undefined,
        bloodType:   v.bloodType ?? BloodType._0,
      });
      const result = await firstValueFrom(this.patientsClient.patientsPOST(command));
      const mrnVal = (result as any)?.mrn
        ?? (result as any)?.medicalRecordNumber
        ?? 'MQ-' + Date.now();
      this.mrn.set(mrnVal);
      this.step.set(4);
    } catch (err: any) {
      this.notifications.error(err?.error?.detail ?? 'Failed to register patient.');
    } finally {
      this.isLoading.set(false);
    }
  }

  copyMrn(): void {
    if (this.mrn()) {
      navigator.clipboard.writeText(this.mrn()!);
      this.notifications.success('MRN copied!');
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  /** Scroll viewport to the first invalid + touched field. */
  private scrollToFirstError(): void {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('.ng-invalid.ng-touched');
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusable = el.querySelector<HTMLElement>('input, select, textarea');
      focusable?.focus();
    });
  }

  /** CSS class helper — adds red border on invalid + touched. */
  inputClass(controlName: keyof typeof this.form.controls): string {
    const ctrl = this.c[controlName];
    return ctrl.invalid && ctrl.touched ? 'mq-input border-rose-500' : 'mq-input';
  }
}
