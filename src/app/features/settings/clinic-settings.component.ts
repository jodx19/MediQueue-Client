import { Component, inject, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-clinic-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, NgClass],
  template: `
    <div class="p-6 bg-mq-navy min-h-screen" [@pageEnter]>
      <div class="mb-6">
        <h1 class="text-2xl font-black text-white">Clinic Settings</h1>
        <p class="text-mq-s400 text-sm mt-1">Manage your clinic configuration</p>
      </div>
      <div class="flex gap-1 mb-6 p-1 bg-mq-800 rounded-2xl border border-mq-700 w-fit">
        @for (tab of tabs; track tab.id) {
          <button (click)="activeTab.set(tab.id)"
                  class="px-4 py-2 text-sm font-medium rounded-xl transition-all"
                  [class.bg-mq-teal]="activeTab() === tab.id"
                  [class.text-white]="activeTab() === tab.id"
                  [class.text-mq-s400]="activeTab() !== tab.id"
                  [class.hover:text-white]="activeTab() !== tab.id">
            {{ tab.label }}
          </button>
        }
      </div>
      @if (activeTab() === 'general') {
        <div class="mq-card-dark p-6 rounded-2xl border border-mq-700 space-y-5 max-w-2xl">
          <h3 class="text-white font-semibold">General Information</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="text-xs text-mq-s400 block mb-1">Clinic Name</label>
              <input type="text" [(ngModel)]="general.name" class="w-full bg-mq-800 border border-mq-700 rounded-xl px-4 py-2.5 text-white text-sm"/>
            </div>
            <div class="col-span-2">
              <label class="text-xs text-mq-s400 block mb-1">Address</label>
              <input type="text" [(ngModel)]="general.address" class="w-full bg-mq-800 border border-mq-700 rounded-xl px-4 py-2.5 text-white text-sm"/>
            </div>
            <div>
              <label class="text-xs text-mq-s400 block mb-1">Phone</label>
              <input type="text" [(ngModel)]="general.phone" class="w-full bg-mq-800 border border-mq-700 rounded-xl px-4 py-2.5 text-white text-sm"/>
            </div>
            <div>
              <label class="text-xs text-mq-s400 block mb-1">Email</label>
              <input type="email" [(ngModel)]="general.email" class="w-full bg-mq-800 border border-mq-700 rounded-xl px-4 py-2.5 text-white text-sm"/>
            </div>
          </div>
          <button (click)="saveGeneral()" class="btn-primary px-6 py-2.5 text-sm">Save Changes</button>
        </div>
      }
      @if (activeTab() === 'hours') {
        <div class="mq-card-dark p-6 rounded-2xl border border-mq-700 max-w-2xl">
          <h3 class="text-white font-semibold mb-4">Working Hours</h3>
          <div class="space-y-3">
            @for (day of workingDays; track day.name) {
              <div class="flex items-center gap-4 p-4 bg-mq-800 rounded-xl border border-mq-700">
                <div class="w-28 text-white text-sm font-medium">{{ day.name }}</div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [(ngModel)]="day.isOpen" class="sr-only peer"/>
                  <div class="w-10 h-5 bg-mq-700 rounded-full peer-checked:bg-mq-teal transition-colors"></div>
                  <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </label>
                @if (day.isOpen) {
                  <input type="time" [(ngModel)]="day.startTime" class="bg-mq-900 border border-mq-700 rounded-xl px-3 py-2 text-white text-xs w-32"/>
                  <span class="text-mq-s400">to</span>
                  <input type="time" [(ngModel)]="day.endTime" class="bg-mq-900 border border-mq-700 rounded-xl px-3 py-2 text-white text-xs w-32"/>
                } @else {
                  <span class="text-mq-s400 text-sm italic">Closed</span>
                }
              </div>
            }
          </div>
        </div>
      }
      @if (activeTab() === 'specialties') {
        <div class="mq-card-dark p-6 rounded-2xl border border-mq-700 max-w-lg">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-white font-semibold">Specialties</h3>
            <button (click)="addSpecialty()" class="flex items-center gap-1 text-xs text-mq-teal-400 hover:text-mq-teal-300">
              <lucide-icon name="plus" [size]="14"/> Add
            </button>
          </div>
          <div class="space-y-2">
            @for (spec of specialties; track spec; let i = $index) {
              <div class="flex items-center justify-between p-3 bg-mq-800 rounded-xl border border-mq-700">
                <span class="text-white text-sm">{{ spec }}</span>
                <button (click)="removeSpecialty(i)" class="text-rose-400 hover:text-rose-300 text-xs">Delete</button>
              </div>
            }
          </div>
          @if (specialties.length === 0) {
            <p class="text-mq-s400 text-sm text-center py-4">No specialties added yet</p>
          }
        </div>
      }
      @if (activeTab() === 'notifications') {
        <div class="mq-card-dark p-6 rounded-2xl border border-mq-700 max-w-lg space-y-4">
          <h3 class="text-white font-semibold mb-4">Notification Preferences</h3>
          @for (pref of notificationPrefs; track pref.id) {
            <div class="flex items-center justify-between p-4 bg-mq-800 rounded-xl">
              <div>
                <p class="text-white text-sm font-medium">{{ pref.label }}</p>
                <p class="text-mq-s400 text-xs">{{ pref.desc }}</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" [(ngModel)]="pref.enabled" class="sr-only peer"/>
                <div class="w-10 h-5 bg-mq-700 rounded-full peer-checked:bg-mq-teal transition-colors"></div>
                <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </label>
            </div>
          }
        </div>
      }
    </div>
  `,
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('500ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class ClinicSettingsComponent {
  private notify = inject(NotificationService);

  activeTab = signal<'general' | 'hours' | 'specialties' | 'notifications'>('general');

  readonly tabs = [
    { id: 'general' as const, label: 'General' },
    { id: 'hours' as const, label: 'Working Hours' },
    { id: 'specialties' as const, label: 'Specialties' },
    { id: 'notifications' as const, label: 'Notifications' },
  ];

  general = { name: 'MediQueue Clinic', address: '123 Medical Street', phone: '+201234567890', email: 'info@mediqueue.com' };

  workingDays = [
    { name: 'Monday', isOpen: true, startTime: '09:00', endTime: '17:00' },
    { name: 'Tuesday', isOpen: true, startTime: '09:00', endTime: '17:00' },
    { name: 'Wednesday', isOpen: true, startTime: '09:00', endTime: '17:00' },
    { name: 'Thursday', isOpen: true, startTime: '09:00', endTime: '17:00' },
    { name: 'Friday', isOpen: false, startTime: '09:00', endTime: '17:00' },
    { name: 'Saturday', isOpen: true, startTime: '10:00', endTime: '14:00' },
    { name: 'Sunday', isOpen: true, startTime: '10:00', endTime: '14:00' },
  ];

  specialties = ['General Medicine', 'Cardiology', 'Pediatrics', 'Dermatology', 'Orthopedics'];

  notificationPrefs = [
    { id: 'sms_appointment', label: 'SMS on appointment booked', desc: 'Send SMS when a patient books', enabled: true },
    { id: 'email_invoice', label: 'Email on invoice paid', desc: 'Send receipt via email', enabled: true },
    { id: 'sms_reminder', label: 'SMS reminder 24h before', desc: 'Remind patients of upcoming appointments', enabled: false },
  ];

  saveGeneral() {
    this.notify.success('Settings saved successfully!');
  }

  addSpecialty() {
    const name = prompt('Enter specialty name:');
    if (name?.trim()) {
      this.specialties = [...this.specialties, name.trim()];
    }
  }

  removeSpecialty(index: number) {
    this.specialties = this.specialties.filter((_, i) => i !== index);
  }
}
