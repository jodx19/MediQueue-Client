import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

const PAGE_SIZE = 50;

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './audit-log.component.html',
})
export class AuditLogComponent implements OnInit {
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
  private readonly http = inject(HttpClient);

  isLoading = signal(false);
  logs      = signal<any[]>([]);
  page      = signal(1);
  total     = signal(0);

  fromDate = '';
  toDate = '';

  async ngOnInit() {
    await this.loadLogs();
  }

  async loadLogs() {
    this.isLoading.set(true);
    try {
      let params = new HttpParams()
        .set('page', this.page().toString())
        .set('pageSize', PAGE_SIZE.toString());

      if (this.fromDate) {
        params = params.set('from', new Date(this.fromDate).toISOString());
      }
      if (this.toDate) {
        params = params.set('to', new Date(this.toDate).toISOString());
      }

      const response = await firstValueFrom(
        this.http.get<any>('/api/audit-logs', { params })
      );

      // The global interceptor unwraps the outer ApiResponse<T> by default in some setups,
      // but let's handle both unwrapped and wrapped structures safely.
      const data = response?.items !== undefined ? response : response?.data;
      
      this.logs.set(data?.items || []);
      this.total.set(data?.totalCount || 0);
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onFilterChange() {
    this.page.set(1);
    void this.loadLogs();
  }

  onPageChange(newPage: number) {
    this.page.set(newPage);
    void this.loadLogs();
  }
}
