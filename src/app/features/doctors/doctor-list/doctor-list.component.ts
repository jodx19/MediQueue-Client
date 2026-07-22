import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { DoctorsClient, DoctorSummaryDto } from '../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, PaginationComponent],
  templateUrl: './doctor-list.component.html',
})
export class DoctorListComponent implements OnInit {
  private readonly doctorsClient = inject(DoctorsClient);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
  public  readonly router        = inject(Router);

  isLoading = signal(true);
  doctors   = signal<DoctorSummaryDto[]>([]);
  page      = signal(1);
  total     = signal(0);

  async ngOnInit() {
    await this.loadDoctors();
  }

  async loadDoctors() {
    this.isLoading.set(true);
    try {
      const result = await firstValueFrom(this.doctorsClient.doctorsGET(this.page(), PAGE_SIZE));
      this.doctors.set(result?.items ?? []);
      this.total.set(result?.totalCount ?? 0);
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(newPage: number) {
    this.page.set(newPage);
    void this.loadDoctors();
  }

  getInitials(d: DoctorSummaryDto): string {
    return `${(d.fullName ?? 'D')[0]}`.toUpperCase();
  }
}
