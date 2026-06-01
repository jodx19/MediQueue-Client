import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { PatientsClient, PatientSummaryDto } from '../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './patient-list.component.html',
})
export class PatientListComponent implements OnInit {
  private readonly patientsClient = inject(PatientsClient);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
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
      const result = await firstValueFrom(this.patientsClient.patientsGET(1, 50));
      this.patients.set(result?.items ?? []);
    } catch (err) {
      this.apiErrorHandler.handle(err);
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
      const result = await firstValueFrom(this.patientsClient.search(q, 1, 50));
      this.patients.set(result?.items ?? []);
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }
}
