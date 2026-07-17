import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InteractiveTableComponent, TableColumn } from '../../../shared/components/interactive-table/interactive-table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, InteractiveTableComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  // Global Signals representation
  stats = signal({
    patientsToday: 42,
    activeDoctors: 12,
    revenue: 12450,
  });

  isLoading = signal(true);

  // Table Configuration and Signal State
  recentPatients = signal([
    { id: '1', name: 'Ahmad Ali', time: '09:00 AM', doctor: 'Dr. Sarah', status: 'Waiting' },
    { id: '2', name: 'Nour Youssef', time: '09:30 AM', doctor: 'Dr. Tarek', status: 'In Session' },
    { id: '3', name: 'Mona Kamal', time: '10:00 AM', doctor: 'Dr. Sarah', status: 'Completed' },
    { id: '4', name: 'Omar Hassan', time: '10:15 AM', doctor: 'Dr. Hany', status: 'Waiting' },
  ]);

  patientColumns = signal<TableColumn<any>[]>([
    { key: 'name', header: 'Patient Name', type: 'text' },
    { key: 'time', header: 'Appointment Time', type: 'text' },
    { key: 'doctor', header: 'Assigned Doctor', type: 'text' },
    { key: 'status', header: 'Status', type: 'badge' },
    { key: 'actions', header: '', type: 'custom' }
  ]);

  constructor() {
    // Simulate loading to show skeleton effect
    setTimeout(() => this.isLoading.set(false), 1200);
  }

  handleAction(event: { action: string; row: any }) {
    // In real app: Navigate or open modal based on event.action
  }
}
