import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthClient, AuthResponseDto } from '../../../core/api/mediqueue-api';
import { AuthService } from '../../../core/auth/auth.service';
import { MedicalValidators } from '../../../core/validators/medical.validators';
import { FormErrorComponent } from '../../../shared/components/form-error/form-error.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-patient-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, FormErrorComponent],
  templateUrl: './patient-login.component.html',
})
export class PatientLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authClient = inject(AuthClient);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = signal(false);
  errorMsg = signal('');

  readonly form = this.fb.nonNullable.group({
    mrn: ['', [Validators.required]],
    dateOfBirth: ['', [Validators.required, MedicalValidators.pastDate()]],
  });

  features = [
    { label: 'Live Queue Status & Updates', icon: 'clock' },
    { label: 'Secure Prescription Timeline', icon: 'pill' },
    { label: 'Finalized Medical Statements', icon: 'receipt' },
    { label: 'Official EMR Timeline Access', icon: 'file-text' }
  ];

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMsg.set('Please enter your MRN and Date of Birth.');
      return;
    }

    const { mrn, dateOfBirth } = this.form.getRawValue();
    this.isLoading.set(true);
    this.errorMsg.set('');
    try {
      const dob = new Date(dateOfBirth);
      const response = await firstValueFrom(
        this.authClient.patientLogin({ mrn: mrn.trim(), dateOfBirth: dob } as any)
      );
      await this.authService.loginFromResponse(response as AuthResponseDto);
      this.router.navigate(['/my-portal']);
    } catch (err: any) {
      this.errorMsg.set(
        err?.error?.detail || err?.error || 'Invalid MRN or Date of Birth.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
