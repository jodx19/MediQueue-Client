import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InteractiveTableComponent, TableColumn } from '../../../shared/components/interactive-table/interactive-table.component';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, InteractiveTableComponent],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <!-- Header -->
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-bold text-mq-navy mb-1 tracking-tight">Patients Directory</h1>
          <p class="text-gray-500 font-medium">Manage patient records and clinical histories.</p>
        </div>
        <div class="flex gap-3">
          <div class="relative">
            <input type="text" placeholder="Search by name, MRN..." class="w-64 p-2 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mq-teal/50 focus:border-mq-teal outline-none transition-all shadow-sm text-sm font-medium">
            <svg class="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <button class="btn-primary flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
            Register Patient
          </button>
        </div>
      </div>

      <!-- Table -->
      <app-interactive-table
        [data]="patients()"
        [columns]="columns()"
        [loading]="isLoading()"
        (actionClick)="handleAction($event)"
      />
    </div>
  `
})
export class PatientListComponent {
  isLoading = signal(true);
  
  patients = signal([
    { mrn: 'MQ-00123', name: 'Ahmad Ali', age: 45, gender: 'Male', phone: '01012345678', lastVisit: new Date('2023-10-12'), status: 'Active' },
    { mrn: 'MQ-00124', name: 'Nour Youssef', age: 32, gender: 'Female', phone: '01112345678', lastVisit: new Date('2023-10-14'), status: 'Active' },
    { mrn: 'MQ-00125', name: 'Mona Kamal', age: 58, gender: 'Female', phone: '01212345678', lastVisit: new Date('2023-09-01'), status: 'Inactive' },
    { mrn: 'MQ-00126', name: 'Omar Hassan', age: 24, gender: 'Male', phone: '01512345678', lastVisit: new Date(), status: 'Active' },
  ]);

  columns = signal<TableColumn<any>[]>([
    { key: 'mrn', header: 'MRN', type: 'text' },
    { key: 'name', header: 'Patient Name', type: 'text' },
    { key: 'age', header: 'Age', type: 'number' },
    { key: 'gender', header: 'Gender', type: 'text' },
    { key: 'phone', header: 'Phone Number', type: 'text' },
    { key: 'lastVisit', header: 'Last Visit', type: 'date' },
    { key: 'status', header: 'Status', type: 'badge' },
    { key: 'actions', header: '', type: 'custom' }
  ]);

  constructor() {
    setTimeout(() => this.isLoading.set(false), 700);
  }

  handleAction(event: any) {
    console.log('Action:', event);
  }
}
