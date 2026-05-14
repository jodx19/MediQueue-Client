import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InteractiveTableComponent, TableColumn } from '../../../shared/components/interactive-table/interactive-table.component';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, InteractiveTableComponent],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <!-- Header -->
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-bold text-mq-navy mb-1 tracking-tight">Clinical Staff</h1>
          <p class="text-gray-500 font-medium">Manage doctors, specialists, and schedules.</p>
        </div>
        <div class="flex gap-3">
          <button class="btn-primary flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
            Add Doctor
          </button>
        </div>
      </div>

      <!-- Table -->
      <app-interactive-table
        [data]="doctors()"
        [columns]="columns()"
        [loading]="isLoading()"
        (actionClick)="handleAction($event)"
      />
    </div>
  `
})
export class DoctorListComponent {
  isLoading = signal(true);
  
  doctors = signal([
    { id: 'DOC-01', name: 'Dr. Sarah Ahmad', specialty: 'Cardiology', patients: 120, status: 'Active' },
    { id: 'DOC-02', name: 'Dr. Tarek Youssef', specialty: 'Neurology', patients: 85, status: 'Active' },
    { id: 'DOC-03', name: 'Dr. Hany Kamal', specialty: 'Pediatrics', patients: 200, status: 'On Leave' },
  ]);

  columns = signal<TableColumn<any>[]>([
    { key: 'name', header: 'Doctor Name', type: 'text' },
    { key: 'specialty', header: 'Specialty', type: 'text' },
    { key: 'patients', header: 'Assigned Patients', type: 'number' },
    { key: 'status', header: 'Status', type: 'badge' },
    { key: 'actions', header: '', type: 'custom' }
  ]);

  constructor() {
    setTimeout(() => this.isLoading.set(false), 600);
  }

  handleAction(event: any) {
    console.log('Action:', event);
  }
}
