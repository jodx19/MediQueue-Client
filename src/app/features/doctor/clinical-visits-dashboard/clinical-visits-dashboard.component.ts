import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clinical-visits-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clinical-visits-dashboard.component.html'
})
export class ClinicalVisitsDashboardComponent {
  // Signals for state management
  activeTab = signal<'S' | 'O' | 'A' | 'P'>('S');
  
  queue = signal([
    { id: '1', name: 'Ahmad Ali', time: '09:00 AM', reason: 'High Fever', status: 'In Session', age: 45, gender: 'M' },
    { id: '2', name: 'Nour Youssef', time: '09:30 AM', reason: 'Routine Checkup', status: 'Waiting', age: 32, gender: 'F' },
    { id: '3', name: 'Mona Kamal', time: '10:00 AM', reason: 'Back Pain', status: 'Waiting', age: 58, gender: 'F' },
  ]);

  selectedPatient = signal<any>(this.queue()[0]);

  // Form State (Mock using signals for UI showcase)
  subjective = signal('');
  objective = signal({ hr: 82, bpSystolic: 120, bpDiastolic: 80, temp: 38.5, weight: 75 });
  assessment = signal('');
  plan = signal('');

  selectPatient(patient: any) {
    this.selectedPatient.set(patient);
    // Reset tabs when a new patient is selected
    this.activeTab.set('S');
  }

  saveNote() {
    console.log('Saved SOAP Note', {
      S: this.subjective(),
      O: this.objective(),
      A: this.assessment(),
      P: this.plan()
    });
    // Integration point: Call NSwag API client to save SOAP note
  }
}
