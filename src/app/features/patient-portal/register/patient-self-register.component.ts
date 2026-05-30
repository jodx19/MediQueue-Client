import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { PatientsClient, SelfRegisterPatientCommand, Gender, BloodType } from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-patient-self-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './patient-self-register.component.html',
})
export class PatientSelfRegisterComponent {
  private patientsClient = inject(PatientsClient);
  private notify         = inject(NotificationService);

  step = signal<1|2|3>(1);
  isLoading = signal(false);
  result = signal<any>(null);

  form = {
    // Step 1
    firstName: '', lastName: '',
    dateOfBirth: '', gender: 'Male',
    nationalId: '', bloodType: 'Unknown',
    // Step 2
    phone: '', email: '', address: '',
  };

  genders    = ['Male','Female'];
  bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'];

  today = new Date().toISOString().split('T')[0];

  // Map string labels to NSwag enums
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

  reviewItems = computed(() => [
    { label: 'Full Name', value: `${this.form.firstName} ${this.form.lastName}` },
    { label: 'Date of Birth', value: this.form.dateOfBirth },
    { label: 'Gender', value: this.form.gender },
    { label: 'National ID', value: this.form.nationalId },
    { label: 'Phone', value: this.form.phone },
    { label: 'Blood Type', value: this.form.bloodType },
  ]);

  async submit() {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.patientsClient.selfRegister(
        new SelfRegisterPatientCommand({
          firstName:   this.form.firstName,
          lastName:    this.form.lastName,
          dateOfBirth: new Date(this.form.dateOfBirth),
          gender:      this.genderMap[this.form.gender] ?? Gender._1,
          nationalId:  this.form.nationalId,
          bloodType:   this.bloodTypeMap[this.form.bloodType] ?? BloodType._0,
          phone:       this.form.phone,
          email:       this.form.email || undefined,
          address:     this.form.address || undefined,
        })
      ));
      // NSwag might return the object directly or wrapped
      this.result.set((res as any)?.data ?? res);
    } catch(e:any) {
      this.notify.error(e?.error?.detail ?? 'Registration failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  copyMrn() {
    if (this.result()?.mrn) {
      navigator.clipboard.writeText(this.result().mrn);
      this.notify.success('MRN copied to clipboard');
    }
  }
}
