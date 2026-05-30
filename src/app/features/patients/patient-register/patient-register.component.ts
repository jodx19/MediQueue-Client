import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { RegisterPatientCommand, PatientsClient, Gender, BloodType } from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';

type Step = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-patient-register',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './patient-register.component.html',
})
export class PatientRegisterComponent {
  private readonly patientsClient = inject(PatientsClient);
  private readonly notifications  = inject(NotificationService);
  public  readonly router         = inject(Router);

  step      = signal<Step>(1);
  isLoading = signal(false);
  mrn       = signal<string | null>(null);

  today = new Date().toISOString().split('T')[0];

  genderOptions = [
    { label: 'Male',   value: Gender._1 },
    { label: 'Female', value: Gender._2 },
    { label: 'Other',  value: Gender._3 },
  ];

  bloodTypeOptions = [
    { label: 'Unknown', value: BloodType._0 },
    { label: 'A+',  value: BloodType._1 }, { label: 'A-',  value: BloodType._2 },
    { label: 'B+',  value: BloodType._3 }, { label: 'B-',  value: BloodType._4 },
    { label: 'AB+', value: BloodType._5 }, { label: 'AB-', value: BloodType._6 },
    { label: 'O+',  value: BloodType._7 }, { label: 'O-',  value: BloodType._8 },
  ];

  form = {
    firstName:   '',
    lastName:    '',
    dateOfBirth: '',
    gender:      Gender._1,
    nationalId:  '',
    phone:       '',
    email:       '',
    bloodType:   BloodType._0,
    address:     '',
  };

  step1Valid(): boolean {
    return !!(this.form.firstName && this.form.lastName && this.form.dateOfBirth && this.form.nationalId);
  }

  step2Valid(): boolean {
    return !!this.form.phone;
  }

  async onSubmit() {
    this.isLoading.set(true);
    try {
      const command = new RegisterPatientCommand({
        firstName:   this.form.firstName,
        lastName:    this.form.lastName,
        dateOfBirth: new Date(this.form.dateOfBirth),
        gender:      this.form.gender,
        nationalId:  this.form.nationalId,
        phone:       this.form.phone,
        email:       this.form.email || undefined,
        bloodType:   this.form.bloodType,
      });
      const result = await firstValueFrom(this.patientsClient.patientsPOST(command));
      const mrnVal = (result as any)?.mrn ?? (result as any)?.medicalRecordNumber ?? 'MQ-' + Date.now();
      this.mrn.set(mrnVal);
      this.step.set(4);
    } catch (err: any) {
      this.notifications.error(err?.error?.detail ?? 'Failed to register patient.');
    } finally {
      this.isLoading.set(false);
    }
  }

  copyMrn() {
    if (this.mrn()) {
      navigator.clipboard.writeText(this.mrn()!);
      this.notifications.success('MRN copied!');
    }
  }
}
