import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { PatientsClient, PatientSummaryDto } from '../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
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
    this.page.set(1);
    void this.performSearch(query);
  });

  isLoading = signal(true);
  patients  = signal<PatientSummaryDto[]>([]);
  page      = signal(1);
  total     = signal(0);
  search    = signal('');
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
      const q = this.search().trim();
      const result = q
        ? await firstValueFrom(this.patientsClient.search(q, this.page(), PAGE_SIZE))
        : await firstValueFrom(this.patientsClient.patientsGET(this.page(), PAGE_SIZE));
      this.patients.set(result?.items ?? []);
      this.total.set(result?.totalCount ?? 0);
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onSearchInput(value: string) {
    this.searchTerm = value;
    this.search.set(value.trim());
    this.searchSubject.next(value.trim());
  }

  onPageChange(newPage: number) {
    this.page.set(newPage);
    void this.loadPatients();
  }

  private async performSearch(q: string) {
    if (q.length > 0 && q.length < 2) return;
    await this.loadPatients();
  }
}
