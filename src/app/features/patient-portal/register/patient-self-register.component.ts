import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { PatientsClient, SelfRegisterPatientCommand, Gender, BloodType } from '../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';
import { MedicalValidators } from '../../../core/validators/medical.validators';
import { FormErrorComponent } from '../../../shared/components/form-error/form-error.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-patient-self-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, FormErrorComponent],
  templateUrl: './patient-self-register.component.html',
})
export class PatientSelfRegisterComponent {
  private readonly fb = inject(FormBuilder);
  private patientsClient = inject(PatientsClient);
  private apiErrorHandler = inject(ApiErrorHandlerService);
  private router = inject(Router);

  step = signal<1|2|3>(1);
  isLoading = signal(false);
  result = signal<any>(null);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    dateOfBirth: ['', [Validators.required, MedicalValidators.pastDate()]],
    gender: ['Male', [Validators.required]],
    nationalId: ['', [Validators.required, MedicalValidators.nationalId()]],
    bloodType: ['Unknown'],
    phone: ['', [Validators.required, MedicalValidators.egyptianPhone()]],
    email: ['', [Validators.email]],
    address: [''],
  });

  genders    = ['Male','Female'];
  bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'];

  today = new Date().toISOString().split('T')[0];

  private genderMap: Record<string, Gender> = {
    'Male': Gender._1,
    'Female': Gender._2
  };

  private bloodTypeMap: Record<string, BloodType> = {
    'A+': BloodType._1, 'A-': BloodType._2,
    'B+': BloodType._3, 'B-': BloodType._4,
    'AB+': BloodType._5, 'AB-': BloodType._6,
    'O+': BloodType._7, 'O-': BloodType._8,
    'Unknown': BloodType._0
  };

  readonly step1Controls = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'nationalId', 'bloodType'] as const;
  readonly step2Controls = ['phone', 'email', 'address'] as const;

  reviewItems = computed(() => {
    const v = this.form.getRawValue();
    return [
      { label: 'Full Name', value: `${v.firstName} ${v.lastName}` },
      { label: 'Date of Birth', value: v.dateOfBirth },
      { label: 'Gender', value: v.gender },
      { label: 'National ID', value: v.nationalId },
      { label: 'Phone', value: v.phone },
      { label: 'Blood Type', value: v.bloodType },
    ];
  });

  goToStep(next: 1 | 2 | 3) {
    if (next === 2 && !this.isStepValid(this.step1Controls)) return;
    if (next === 3 && !this.isStepValid(this.step2Controls)) return;
    this.step.set(next);
  }

  private isStepValid(fields: readonly string[]): boolean {
    fields.forEach(name => this.form.get(name)?.markAsTouched());
    return fields.every(name => this.form.get(name)?.valid !== false);
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.patientsClient.selfRegister(
        new SelfRegisterPatientCommand({
          firstName:   v.firstName,
          lastName:    v.lastName,
          dateOfBirth: new Date(v.dateOfBirth),
          gender:      this.genderMap[v.gender] ?? Gender._1,
          nationalId:  v.nationalId,
          bloodType:   this.bloodTypeMap[v.bloodType] ?? BloodType._0,
          phone:       v.phone,
          email:       v.email || undefined,
          address:     v.address || undefined,
        })
      ));
      this.result.set(res);
      this.router.navigate(['/auth/patient-login'], {
        queryParams: { mrn: res.medicalRecordNumber }
      });
    } catch(e:any) {
      this.apiErrorHandler.handle(e);
    } finally {
      this.isLoading.set(false);
    }
  }

  copyMrn() {
    if (this.result()?.medicalRecordNumber) {
      navigator.clipboard.writeText(this.result().medicalRecordNumber);
    }
  }
}
