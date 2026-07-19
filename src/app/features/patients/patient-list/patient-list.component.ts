import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { PatientsClient, PatientSummaryDto } from '../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './patient-list.component.html',
})
export class PatientListComponent implements OnInit, OnDestroy {
  private readonly patientsClient = inject(PatientsClient);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
  public readonly router = inject(Router);

  private readonly searchSubject = new Subject<string>();
  private readonly searchSubscription = this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
  ).subscribe((query) => {
    void this.performSearch(query);
  });

  isLoading = signal(true);
  patients  = signal<PatientSummaryDto[]>([]);
  searchTerm = '';

  async ngOnInit() {
    await this.loadPatients();
  }

  ngOnDestroy() {
    this.searchSubscription.unsubscribe();
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

  onSearchInput(value: string) {
    this.searchTerm = value;
    this.searchSubject.next(value.trim());
  }

  private async performSearch(q: string) {
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
