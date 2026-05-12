import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, Filter, Plus, MoreVertical, Eye, Edit, CalendarPlus, UserPlus } from 'lucide-angular';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './patient-list.component.html'
})
export class PatientListComponent {
  readonly LucideIcons = { Search, Filter, Plus, MoreVertical, Eye, Edit, CalendarPlus, UserPlus };

  isLoading = signal(false);
  filter = signal<'All' | 'Active' | 'Inactive'>('All');
  searchQuery = signal('');

  patients = signal([
    { id: 1, name: 'Omar Tarek', mrn: 'MRN-2023-001', phone: '01012345678', bloodType: 'O+', lastVisit: '12 May 2026', status: 'Active' },
    { id: 2, name: 'Sara Ali', mrn: 'MRN-2023-002', phone: '01298765432', bloodType: 'A-', lastVisit: '10 May 2026', status: 'Active' },
    { id: 3, name: 'Khaled Hassan', mrn: 'MRN-2022-145', phone: '01122334455', bloodType: 'B+', lastVisit: '01 Jan 2026', status: 'Inactive' },
  ]);

  setFilter(f: 'All' | 'Active' | 'Inactive') {
    this.filter.set(f);
    // trigger mock load
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 800);
  }

  onSearch(val: string) {
    this.searchQuery.set(val);
    // Mock debounce logic
  }
}
