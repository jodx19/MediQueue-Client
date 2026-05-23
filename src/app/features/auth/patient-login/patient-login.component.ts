import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, HeartPulse, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-patient-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-mq-navy grid grid-cols-1 lg:grid-cols-2">
      <div class="hidden lg:flex flex-col justify-center items-center relative overflow-hidden p-16 bg-mq-navy"
           style="background: radial-gradient(ellipse at 60% 50%, rgba(13,148,136,.15) 0%,transparent 70%)">
        <div class="relative z-10 text-center">
          <div class="w-24 h-24 rounded-3xl bg-mq-teal/15 border border-mq-teal/30 flex items-center justify-center mx-auto mb-8">
            <lucide-icon name="heart-pulse" class="text-mq-teal-400" [size]="48"/>
          </div>
          <h1 class="text-3xl font-black text-white mb-3">Patient Portal</h1>
          <p class="text-mq-s400 max-w-xs">Access your appointments, medical records, and prescriptions securely.</p>
          <div class="mt-10 space-y-3 text-left">
            <div class="flex items-center gap-3 text-mq-s400 text-sm">
              <span class="w-6 h-6 rounded-full bg-mq-teal/15 flex items-center justify-center text-mq-teal-400 text-xs">✓</span>
              View upcoming appointments
            </div>
            <div class="flex items-center gap-3 text-mq-s400 text-sm">
              <span class="w-6 h-6 rounded-full bg-mq-teal/15 flex items-center justify-center text-mq-teal-400 text-xs">✓</span>
              Download prescriptions & reports
            </div>
            <div class="flex items-center gap-3 text-mq-s400 text-sm">
              <span class="w-6 h-6 rounded-full bg-mq-teal/15 flex items-center justify-center text-mq-teal-400 text-xs">✓</span>
              Track invoices & payments
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col justify-center items-center bg-mq-800 p-8 lg:p-16">
        <div class="w-full max-w-sm">
          <a routerLink="/" class="flex items-center gap-2 text-mq-s400 hover:text-mq-teal-400 text-sm mb-10 group">
            <lucide-icon name="arrow-left" [size]="16"/>
            Back to Home
          </a>

          <h2 class="text-3xl font-black text-white mb-2">Welcome back</h2>
          <p class="text-mq-s400 text-sm mb-8">Sign in with your MRN</p>

          @if (errorMsg()) {
            <div class="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm mb-6">
              <lucide-icon name="alert-circle" [size]="16"/>
              {{ errorMsg() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label class="mq-label">Medical Record Number (MRN)</label>
              <input type="text" name="mrn" [(ngModel)]="mrn"
                     class="mq-input font-mono tracking-wider"
                     placeholder="MRN-20260523-XXXX" required/>
            </div>
            <div>
              <label class="mq-label">Date of Birth</label>
              <input type="date" name="dob" [(ngModel)]="dateOfBirth"
                     class="mq-input" required/>
            </div>
            <button type="submit"
                    class="btn-primary w-full flex items-center justify-center gap-2 !py-4"
                    [disabled]="isLoading()">
              @if (isLoading()) {
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Signing in...
              } @else {
                Access My Records
                <lucide-icon name="arrow-right" [size]="16"/>
              }
            </button>
          </form>

          <div class="mt-8 text-center text-sm text-mq-s400">
            Don't have an MRN?
            <a routerLink="/register" class="text-mq-teal-400 font-semibold hover:underline ml-1">Register here</a>
          </div>
          <div class="mt-4 text-center">
            <a routerLink="/auth/login" class="text-mq-s400 text-xs hover:text-mq-teal-400 transition-colors">
              Staff Login →
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PatientLoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  mrn = '';
  dateOfBirth = '';
  isLoading = signal(false);
  errorMsg = signal('');

  async onSubmit() {
    if (!this.mrn || !this.dateOfBirth) return;
    this.isLoading.set(true);
    this.errorMsg.set('');

    try {
      await this.auth.patientLogin(this.mrn, this.dateOfBirth);
      await this.router.navigateByUrl('/my-portal');
    } catch {
      this.errorMsg.set('Invalid MRN or Date of Birth. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
