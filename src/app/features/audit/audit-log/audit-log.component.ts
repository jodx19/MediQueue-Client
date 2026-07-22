import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { AuditClient, AuditLogDto } from '../../../core/api/mediqueue-api';
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
  private readonly auditClient = inject(AuditClient);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);

  isLoading = signal(true);
  logs      = signal<AuditLogDto[]>([]);
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
      const result = await firstValueFrom(
        this.auditClient.audit(
          undefined,
          undefined,
          this.actionFilter || undefined,
          this.entityFilter || undefined,
          undefined,
          this.page(),
          PAGE_SIZE,
        )
      );
      this.logs.set(result?.items ?? []);
      this.total.set(result?.totalCount ?? 0);
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
