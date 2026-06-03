import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { InvoicesClient } from '../../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../../core/services/api-error-handler.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-revenue-report',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="p-6 bg-mq-navy min-h-screen">
      <div class="max-w-5xl mx-auto space-y-6">

        <div class="page-header">
          <div>
            <button (click)="router.navigate(['/invoices'])"
                    class="flex items-center gap-2 text-mq-s400 hover:text-white text-sm transition-colors mb-3">
              <lucide-icon name="arrow-left" [size]="14"/>
              Back to Invoices
            </button>
            <h1 class="page-title">Revenue Report</h1>
            <p class="page-sub">View revenue metrics and trends</p>
          </div>
        </div>

        <!-- Date Range -->
        <div class="mq-card-dark p-6">
          <div class="flex items-end gap-4 flex-wrap">
            <div class="space-y-1.5">
              <label class="form-label">From</label>
              <input type="date" [ngModel]="dateFrom()" (ngModelChange)="dateFrom.set($event)"
                     class="form-input"/>
            </div>
            <div class="space-y-1.5">
              <label class="form-label">To</label>
              <input type="date" [ngModel]="dateTo()" (ngModelChange)="dateTo.set($event)"
                     class="form-input"/>
            </div>
            <button (click)="generateReport()" [disabled]="isLoading()"
                    class="btn-primary flex items-center gap-2 px-6 py-2.5">
              @if (isLoading()) {
                <lucide-icon name="loader-2" class="animate-spin" [size]="14"/>
              }
              <lucide-icon name="bar-chart-3" [size]="14"/>
              Generate Report
            </button>
            @if (reportData()) {
              <button (click)="exportCSV()" class="btn-ghost flex items-center gap-2 px-4 py-2.5 text-sm border border-mq-700">
                <lucide-icon name="download" [size]="14"/>
                Export CSV
              </button>
            }
          </div>
        </div>

        @if (isLoading()) {
          <div class="grid grid-cols-4 gap-4">
            @for (i of [1,2,3,4]; track i) {
              <div class="h-28 rounded-xl bg-mq-800/80 animate-pulse"></div>
            }
          </div>
        }

        @if (reportData()) {
          <!-- Metric Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="metric-card border-l-4 border-emerald-500">
              <p class="text-mq-s400 text-xs uppercase tracking-wider mb-1">Total Revenue</p>
              <p class="text-2xl font-black text-emerald-400">EGP {{ (reportData()!.totalRevenue ?? 0).toLocaleString() }}</p>
            </div>
            <div class="metric-card border-l-4 border-mq-teal">
              <p class="text-mq-s400 text-xs uppercase tracking-wider mb-1">Collected</p>
              <p class="text-2xl font-black text-mq-t400">EGP {{ (reportData()!.collectedRevenue ?? 0).toLocaleString() }}</p>
            </div>
            <div class="metric-card border-l-4 border-amber-500">
              <p class="text-mq-s400 text-xs uppercase tracking-wider mb-1">Outstanding</p>
              <p class="text-2xl font-black text-amber-400">EGP {{ (reportData()!.outstandingRevenue ?? 0).toLocaleString() }}</p>
            </div>
            <div class="metric-card border-l-4 border-purple-500">
              <p class="text-mq-s400 text-xs uppercase tracking-wider mb-1">Invoice Count</p>
              <p class="text-2xl font-black text-white">{{ reportData()!.invoiceCount ?? 0 }}</p>
            </div>
          </div>

          <!-- Daily Breakdown -->
          @if ((reportData()!.dailyRevenue ?? []).length > 0) {
            <div class="mq-card-dark p-6">
              <h3 class="text-white font-bold mb-4">Daily Revenue Breakdown</h3>
              <div class="table-wrap">
                <table class="table">
                  <thead>
                    <tr>
                      <th class="th text-left">Date</th>
                      <th class="th text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (d of reportData()!.dailyRevenue!; track $index) {
                      <tr>
                        <td class="td text-white text-sm">{{ d.date | date:'MMM d, y' }}</td>
                        <td class="td text-right font-mono text-white font-semibold">
                          EGP {{ (d.amount ?? 0).toLocaleString() }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        }

        @if (!isLoading() && !reportData()) {
          <div class="flex flex-col items-center justify-center py-20 mq-card-dark text-center">
            <lucide-icon name="bar-chart-3" class="text-mq-s400 mb-3" [size]="36"/>
            <p class="text-white font-medium">Select a date range and generate a report</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class RevenueReportComponent {
  private readonly invoicesClient = inject(InvoicesClient);
  private readonly invoiceService = inject(InvoiceService);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
  private readonly notify = inject(NotificationService);
  readonly router = inject(Router);

  reportData = signal<any | null>(null);
  dateFrom = signal<string>('');
  dateTo = signal<string>('');
  isLoading = signal(false);

  constructor() {
    const now = new Date();
    this.dateTo.set(now.toISOString().substring(0, 10));
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    this.dateFrom.set(firstDay.toISOString().substring(0, 10));
  }

  async generateReport() {
    if (!this.dateFrom() || !this.dateTo()) {
      this.notify.warning('Please select both dates.');
      return;
    }
    this.isLoading.set(true);
    try {
      const from = new Date(this.dateFrom());
      const to = new Date(this.dateTo());
      const result = await firstValueFrom(this.invoicesClient.revenueReport2(from, to));
      this.reportData.set(result as any);
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  exportCSV() {
    const data = this.reportData();
    if (!data) {
      this.notify.warning('No report data to export.');
      return;
    }
    const csv = this.invoiceService.generateRevenueCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `revenue-report-${this.dateFrom()}-${this.dateTo()}.csv`;
    link.click();
    this.notify.success('CSV exported successfully.');
  }
}
