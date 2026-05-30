import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { PatientsClient, PatientSummaryDto } from '../../../core/api/mediqueue-api';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './patient-list.component.html',
})
export class PatientListComponent implements OnInit {
  private readonly patientsClient = inject(PatientsClient);
  public readonly router = inject(Router);

  isLoading = signal(true);
  patients  = signal<PatientSummaryDto[]>([]);
  searchTerm = '';

  async ngOnInit() {
    await this.loadPatients();
  }

  async loadPatients() {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.patientsClient.patientsGET(1, 50));
      const data = response?.data?.items ?? [];
      this.patients.set(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSearch() {
    const q = this.searchTerm.trim();
    if (q.length > 0 && q.length < 2) return;
    this.isLoading.set(true);
    try {
      if (!q) {
        await this.loadPatients();
        return;
      }
      const response = await firstValueFrom(this.patientsClient.search(q, 1, 50));
      const data = response?.items ?? [];
      this.patients.set(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      this.isLoading.set(false);
    }
  }
}
