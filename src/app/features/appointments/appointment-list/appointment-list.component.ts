import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InteractiveTableComponent, TableColumn } from '../../../shared/components/interactive-table/interactive-table.component';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, InteractiveTableComponent],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <!-- Header -->
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-bold text-mq-navy mb-1 tracking-tight">Appointments</h1>
          <p class="text-gray-500 font-medium">Manage and schedule patient appointments.</p>
        </div>
        <div class="flex gap-3">
          <div class="relative">
            <input type="text" placeholder="Search appointments..." class="w-64 p-2 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mq-teal/50 focus:border-mq-teal outline-none transition-all shadow-sm text-sm font-medium">
            <svg class="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <button class="btn-primary flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
            Book Appointment
          </button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div class="w-12 h-12 rounded-xl bg-teal-50 text-mq-teal flex items-center justify-center"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
          <div><p class="text-xs text-gray-400 font-bold uppercase tracking-wider">Today</p><p class="text-2xl font-black text-mq-navy">42</p></div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
          <div><p class="text-xs text-gray-400 font-bold uppercase tracking-wider">Upcoming</p><p class="text-2xl font-black text-mq-navy">128</p></div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div class="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
          <div><p class="text-xs text-gray-400 font-bold uppercase tracking-wider">Waiting</p><p class="text-2xl font-black text-mq-navy">15</p></div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div class="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div>
          <div><p class="text-xs text-gray-400 font-bold uppercase tracking-wider">Completed</p><p class="text-2xl font-black text-mq-navy">24</p></div>
        </div>
      </div>

      <!-- Table -->
      <app-interactive-table
        [data]="appointments()"
        [columns]="columns()"
        [loading]="isLoading()"
        (actionClick)="handleAction($event)"
      />
    </div>
  `
})
export class AppointmentListComponent {
  isLoading = signal(true);
  
  appointments = signal([
    { id: 'APT-001', patient: 'Ahmad Ali', doctor: 'Dr. Sarah', date: new Date(), time: '09:00 AM', status: 'Waiting' },
    { id: 'APT-002', patient: 'Nour Youssef', doctor: 'Dr. Tarek', date: new Date(), time: '09:30 AM', status: 'In Session' },
    { id: 'APT-003', patient: 'Mona Kamal', doctor: 'Dr. Sarah', date: new Date(), time: '10:00 AM', status: 'Completed' },
    { id: 'APT-004', patient: 'Omar Hassan', doctor: 'Dr. Hany', date: new Date(), time: '10:15 AM', status: 'Pending' },
  ]);

  columns = signal<TableColumn<any>[]>([
    { key: 'id', header: 'Appt ID', type: 'text' },
    { key: 'patient', header: 'Patient Name', type: 'text' },
    { key: 'doctor', header: 'Doctor', type: 'text' },
    { key: 'date', header: 'Date', type: 'date' },
    { key: 'time', header: 'Time', type: 'text' },
    { key: 'status', header: 'Status', type: 'badge' },
    { key: 'actions', header: '', type: 'custom' }
  ]);

  constructor() {
    setTimeout(() => this.isLoading.set(false), 800);
  }

  handleAction(event: any) {
    console.log('Action:', event);
  }
}
