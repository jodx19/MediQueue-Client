import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { ClinicSettingsDto, UpdateSettingsCommand } from '../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../core/services/api-error-handler.service';
import { FormErrorComponent } from '../../shared/components/form-error/form-error.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule,
    LucideAngularModule,
    FormErrorComponent,
    LoadingSkeletonComponent
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private notificationService = inject(NotificationService);
  private apiErrorHandler = inject(ApiErrorHandlerService);
  private fb = inject(FormBuilder);

  // TODO Step 10: this component will read tenantId
  // from AuthService.currentUser().tenantId
  // and display tenant-specific settings only

  activeTab = signal<'profile' | 'hours' | 'medical' | 'specialties' | 'notifications' | 'integrations'>('profile');
  isLoading = signal(false);
  isSaving = signal(false);
  currentSettings = signal<ClinicSettingsDto | null>(null);
  integrationKeys = signal({ stripePublicKey: '', stripeSecretKey: '', paypalClientId: '', enableSMSAlerts: false, enableEmailReminders: false });
  
  profileSettings = signal({
    clinicName: '', slogan: '', address: '', phone: '', email: '', taxNumber: '', currency: 'USD', logoGlowColor: 'teal'
  });
  workingDays = signal([
    { day: 'Monday', active: true, start: '09:00', end: '17:00' },
    { day: 'Tuesday', active: true, start: '09:00', end: '17:00' },
    { day: 'Wednesday', active: true, start: '09:00', end: '17:00' },
    { day: 'Thursday', active: true, start: '09:00', end: '17:00' },
    { day: 'Friday', active: true, start: '09:00', end: '17:00' },
    { day: 'Saturday', active: false, start: '09:00', end: '14:00' },
    { day: 'Sunday', active: false, start: '', end: '' },
  ]);
  medicalSettings = signal({
    defaultDuration: 30, emergencyFee: 150, commissionRate: 40, autoLockSoapNotes: true, customInvoiceNotes: ''
  });
  specialties = signal<string[]>(['General Practice', 'Cardiology', 'Pediatrics']);
  notificationPrefs = signal([
    { id: '1', label: 'Email Confirmations', desc: 'Send email when booked', enabled: true },
    { id: '2', label: 'SMS Reminders', desc: 'Send SMS 24h before', enabled: true },
  ]);

  removeSpecialty(index: number) {
    this.specialties.update(s => s.filter((_, i) => i !== index));
  }
  
  addSpecialty() {
    this.specialties.update(s => [...s, 'New Specialty']);
  }
  
  saveSettings() {
    this.onSave();
  }

  form = this.fb.group({
    clinicName:    ['', [Validators.required, Validators.maxLength(200)]],
    clinicPhone:   ['', [Validators.required]],
    clinicEmail:   ['', [Validators.email]],
    clinicAddress: [''],
    workStartTime: ['08:00', [Validators.required, Validators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
    workEndTime:   ['17:00', [Validators.required, Validators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
    appointmentDurationMinutes: [30, [Validators.required, Validators.min(10), Validators.max(120)]],
    currency:     ['USD', [Validators.required, Validators.maxLength(3)]],
    timeZone:     ['Egypt Standard Time'],
    allowOnlineBooking:        [true],
    requireDepositForBooking:  [false],
    depositAmount: [0, [Validators.min(0)]],
  });

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      const settings = await firstValueFrom(this.settingsService.getSettings());
      this.currentSettings.set(settings);
      this.form.patchValue({
        clinicName:    settings.clinicName,
        clinicPhone:   settings.clinicPhone,
        clinicEmail:   settings.clinicEmail,
        clinicAddress: settings.clinicAddress,
        workStartTime: settings.workStartTime,
        workEndTime:   settings.workEndTime,
        appointmentDurationMinutes: settings.appointmentDurationMinutes,
        currency:      settings.currency,
        timeZone:      settings.timeZone,
        allowOnlineBooking:       settings.allowOnlineBooking,
        requireDepositForBooking: settings.requireDepositForBooking,
        depositAmount: settings.depositAmount,
      });
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    try {
      const v = this.form.getRawValue();
      const updated = await firstValueFrom(
        this.settingsService.updateSettings({
          clinicName:    v.clinicName!,
          clinicPhone:   v.clinicPhone!,
          clinicEmail:   v.clinicEmail ?? '',
          clinicAddress: v.clinicAddress ?? '',
          workStartTime: v.workStartTime!,
          workEndTime:   v.workEndTime!,
          appointmentDurationMinutes: v.appointmentDurationMinutes!,
          currency:      v.currency!,
          timeZone:      v.timeZone!,
          allowOnlineBooking:       v.allowOnlineBooking ?? true,
          requireDepositForBooking: v.requireDepositForBooking ?? false,
          depositAmount: v.depositAmount ?? 0,
        } as UpdateSettingsCommand)
      );
      this.currentSettings.set(updated);
      this.notificationService.success('تم حفظ الإعدادات بنجاح ✓');
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isSaving.set(false);
    }
  }
}
