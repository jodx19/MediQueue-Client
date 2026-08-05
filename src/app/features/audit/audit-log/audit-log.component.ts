import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

const PAGE_SIZE = 50;

interface AuditLogDto {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  timestamp: string;
  isSuccess: boolean;
  errorMessage: string | null;
}

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './audit-log.component.html',
})
export class AuditLogComponent implements OnInit {
  private readonly http             = inject(HttpClient);
  private readonly apiErrorHandler  = inject(ApiErrorHandlerService);

  isLoading = signal(false);
  logs      = signal<AuditLogDto[]>([]);
  page      = signal(1);
  total     = signal(0);

  actionFilter = '';
  fromFilter   = '';
  toFilter     = '';

  get pageSize() { return PAGE_SIZE; }
  get totalPages() { return Math.ceil(this.total() / PAGE_SIZE); }

  async ngOnInit() {
    await this.loadLogs();
  }

  async loadLogs() {
    this.isLoading.set(true);
    try {
      let params = new HttpParams()
        .set('page', this.page().toString())
        .set('pageSize', PAGE_SIZE.toString());

      if (this.fromFilter) params = params.set('from', this.fromFilter);
      if (this.toFilter)   params = params.set('to',   this.toFilter);

      const response = await firstValueFrom(
        this.http.get<{ items: AuditLogDto[]; totalCount: number }>('/api/audit-logs', { params })
      );

      // Filter by action client-side since backend doesn't have action filter yet
      const filtered = this.actionFilter
        ? (response.items ?? []).filter(l => l.action.toLowerCase().includes(this.actionFilter.toLowerCase()))
        : (response.items ?? []);

      this.logs.set(filtered);
      this.total.set(response.totalCount ?? 0);
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

  statusBadge(isSuccess: boolean): string {
    return isSuccess
      ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400'
      : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400';
  }
}
