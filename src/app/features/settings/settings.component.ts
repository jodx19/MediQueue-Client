import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../core/services/notification.service';

interface WorkingDay {
  day: string;
  active: boolean;
  start: string;
  end: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  private readonly notifications = inject(NotificationService);

  activeTab = signal<'profile' | 'hours' | 'medical' | 'integrations'>('profile');
  isSaving = signal(false);

  // Clinic Profile State
  profileSettings = signal({
    clinicName: 'MediQueue Clinic Hub',
    slogan: 'Premium Multi-Specialty Electronic Health Systems',
    address: '128 Medical Center Plaza, Downtown District',
    phone: '+20 123 456 7890',
    email: 'contact@mediqueue.clinic',
    currency: 'USD',
    taxNumber: 'TX-9876-5432-EMR',
    logoGlowColor: 'teal',
  });

  // Clinical Hours State
  workingDays = signal<WorkingDay[]>([
    { day: 'Sunday', active: true, start: '09:00', end: '17:00' },
    { day: 'Monday', active: true, start: '09:00', end: '17:00' },
    { day: 'Tuesday', active: true, start: '09:00', end: '17:00' },
    { day: 'Wednesday', active: true, start: '09:00', end: '17:00' },
    { day: 'Thursday', active: true, start: '09:00', end: '17:00' },
    { day: 'Friday', active: false, start: '09:00', end: '17:00' },
    { day: 'Saturday', active: false, start: '10:00', end: '15:00' },
  ]);

  // Medical/Appointments State
  medicalSettings = signal({
    defaultDuration: 30,
    emergencyFee: 150,
    commissionRate: 15,
    customInvoiceNotes: 'Thank you for choosing MediQueue Clinic. All billing is secured & encrypted.',
    autoLockSoapNotes: true,
  });

  // Integration Keys State
  integrationKeys = signal({
    stripePublicKey: 'pk_test_51Nx...A890',
    stripeSecretKey: 'sk_test_51Nx...B123',
    paypalClientId: 'AaX_Y...P456',
    enableSMSAlerts: true,
    enableEmailReminders: true,
  });

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    try {
      const storedProfile = localStorage.getItem('mq_settings_profile');
      if (storedProfile) this.profileSettings.set(JSON.parse(storedProfile));

      const storedHours = localStorage.getItem('mq_settings_hours');
      if (storedHours) this.workingDays.set(JSON.parse(storedHours));

      const storedMedical = localStorage.getItem('mq_settings_medical');
      if (storedMedical) this.medicalSettings.set(JSON.parse(storedMedical));

      const storedIntegrations = localStorage.getItem('mq_settings_integrations');
      if (storedIntegrations) this.integrationKeys.set(JSON.parse(storedIntegrations));
    } catch (e) {
      console.error('Failed to load clinic settings from storage', e);
    }
  }

  saveSettings() {
    this.isSaving.set(true);

    setTimeout(() => {
      try {
        localStorage.setItem('mq_settings_profile', JSON.stringify(this.profileSettings()));
        localStorage.setItem('mq_settings_hours', JSON.stringify(this.workingDays()));
        localStorage.setItem('mq_settings_medical', JSON.stringify(this.medicalSettings()));
        localStorage.setItem('mq_settings_integrations', JSON.stringify(this.integrationKeys()));

        this.notifications.success('Clinic configuration settings updated successfully!');
      } catch (e) {
        console.error('Failed to save settings', e);
        this.notifications.error('Failed to save clinic configurations. Storage quota exceeded.');
      } finally {
        this.isSaving.set(false);
      }
    }, 800);
  }
}
