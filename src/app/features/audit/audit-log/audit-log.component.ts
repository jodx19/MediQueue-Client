import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
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

  isLoading = signal(false);
  logs      = signal<any[]>([]);
  page      = signal(1);
  total     = signal(0);

  actionFilter = '';
  entityFilter = '';

  async ngOnInit() {
    await this.loadLogs();
  }

  async loadLogs() {
    this.isLoading.set(true);
    try {
      // API not yet implemented in backend. Return empty.
      this.logs.set([]);
      this.total.set(0);
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
