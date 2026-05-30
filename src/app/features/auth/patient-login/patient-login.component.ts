import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthClient, AuthResponseDto } from '../../../core/api/mediqueue-api';
import { AuthService } from '../../../core/auth/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-patient-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './patient-login.component.html',
})
export class PatientLoginComponent {
  private readonly authClient = inject(AuthClient);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  mrn = '';
  dateOfBirth = '';
  isLoading = signal(false);
  errorMsg = signal('');

  features = [
    { label: 'Live Queue Status & Updates', icon: 'clock' },
    { label: 'Secure Prescription Timeline', icon: 'pill' },
    { label: 'Finalized Medical Statements', icon: 'receipt' },
    { label: 'Official EMR Timeline Access', icon: 'file-text' }
  ];

  async onSubmit() {
    if (!this.mrn.trim() || !this.dateOfBirth) {
      this.errorMsg.set('Please enter your MRN and Date of Birth.');
      return;
    }
    this.isLoading.set(true);
    this.errorMsg.set('');
    try {
      const dob = new Date(this.dateOfBirth);
      const response = await firstValueFrom(
        this.authClient.patientLogin({ mrn: this.mrn.trim(), dateOfBirth: dob } as any)
      );
      // Manually build session from response
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
