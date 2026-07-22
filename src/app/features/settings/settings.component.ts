import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { ClinicSettingsDto, UpdateSettingsCommand } from '../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../core/services/api-error-handler.service';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';

type Tab = 'general' | 'hours' | 'notifications' | 'appearance';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    LoadingSkeletonComponent,
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  private readonly settingsService     = inject(SettingsService);
  private readonly notificationService = inject(NotificationService);
  private readonly apiErrorHandler     = inject(ApiErrorHandlerService);
  private readonly fb                 = inject(FormBuilder);

  // ── View state ───────────────────────────────────────────────────────
  activeTab  = signal<Tab>('general');
  isLoading = signal(false);
  isSaving  = signal(false);
  current   = signal<ClinicSettingsDto | null>(null);

  // Currency options for the selectors — centralised so both General and
  // Appearance tabs stay in sync without a separate source of truth.
  readonly currencies: ReadonlyArray<{ code: string; label: string }> = [
    { code: 'EGP', label: 'EGP — Egyptian Pound' },
    { code: 'USD', label: 'USD — US Dollar' },
    { code: 'EUR', label: 'EUR — Euro' },
    { code: 'SAR', label: 'SAR — Saudi Riyal' },
    { code: 'AED', label: 'AED — UAE Dirham' },
  ];

  // Common Egypt-only timezone list. The server stores IANA / Windows IDs;
  // we expose the friendly subset the operators actually pick from.
  readonly timezones: ReadonlyArray<string> = [
    'Egypt Standard Time',
    'UTC',
    'Arabian Standard Time',
    'Israel Standard Time',
    'GMT Standard Time',
  ];

  // Approximate duration presets for the appearance slider. Stored on the
  // server as an int (minutes); the slider snaps to these discrete values.
  readonly durationSteps = [15, 30, 45, 60];

  // ── Reactive form (single source of truth mirroring the API) ────────
  // Every field here maps 1:1 to UpdateSettingsCommand properties. The
  // four tabs all read/write this same form so a Save in any tab persists
  // the entire settings document atomically via PUT /api/settings.
  form = this.fb.group({
    // General tab
    clinicName:    ['', [Validators.required, Validators.maxLength(200)]],
    clinicPhone:   ['', [Validators.required]],
    clinicEmail:   ['', [Validators.email]],
    clinicAddress: [''],
    // Working hours tab
    workStartTime:  ['08:00', [Validators.required, Validators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
    workEndTime:    ['17:00', [Validators.required, Validators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
    appointmentDurationMinutes: [30, [Validators.required, Validators.min(10), Validators.max(120)]],
    allowOnlineBooking:       [true],
    // Notifications tab (server-side toggles — no separate sms/email fields yet)
    requireDepositForBooking: [false],
    depositAmount: [0, [Validators.min(0)]],
    // Appearance tab
    currency: ['EGP', [Validators.required, Validators.maxLength(3)]],
    timeZone: ['Egypt Standard Time', [Validators.required]],
  });

  ngOnInit(): void {
    void this.load();
  }

  // ── Data ────────────────────────────────────────────────────────────
  async load() {
    this.isLoading.set(true);
    try {
      const settings = await firstValueFrom(this.settingsService.getSettings());
      this.current.set(settings);
      this.form.patchValue({
        clinicName:    settings.clinicName    ?? '',
        clinicPhone:   settings.clinicPhone   ?? '',
        clinicEmail:   settings.clinicEmail    ?? '',
        clinicAddress: settings.clinicAddress  ?? '',
        workStartTime: settings.workStartTime  ?? '08:00',
        workEndTime:   settings.workEndTime    ?? '17:00',
        appointmentDurationMinutes: settings.appointmentDurationMinutes ?? 30,
        allowOnlineBooking:       settings.allowOnlineBooking       ?? true,
        requireDepositForBooking: settings.requireDepositForBooking ?? false,
        depositAmount: settings.depositAmount ?? 0,
        currency: settings.currency ?? 'EGP',
        timeZone: settings.timeZone ?? 'Egypt Standard Time',
      });
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.warning('Please fix the highlighted fields before saving.');
      return;
    }

    this.isSaving.set(true);
    try {
      const v = this.form.getRawValue();
      // Compose the typed payload sent to PUT /api/settings. Every property
      // below is backed by an UpdateSettingsCommand field on the server.
      // NSwag generates UpdateSettingsCommand as a class (not a literal
      // interface), so we must instantiate it via its constructor.
      const payload = new UpdateSettingsCommand({
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
      });

      const updated = await firstValueFrom(this.settingsService.updateSettings(payload));
      this.current.set(updated);
      this.notificationService.success('Settings saved successfully ✓');
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isSaving.set(false);
    }
  }
}
