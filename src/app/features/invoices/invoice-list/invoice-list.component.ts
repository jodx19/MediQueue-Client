import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Client, InvoiceDto, InvoiceStatus } from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';
import { pageEnter } from '../../../shared/animations/page-animations';
import { CurrencyEgpPipe } from '../../../shared/pipes/currency-egp.pipe';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyEgpPipe],
  animations: [pageEnter],
  template: `
    <div class="min-h-full bg-mq-navy p-6" @pageEnter>
      <header class="page-header !mb-6">
        <div>
          <h1 class="page-title">Invoices</h1>
          <p class="page-sub">Clinic billing and payment status</p>
        </div>
        <button type="button" class="btn-ghost border-mq-700 text-mq-s400" (click)="load()">Retry</button>
      </header>

      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div class="h-14 rounded-xl skeleton"></div>
          }
        </div>
      } @else if (error()) {
        <div class="glass p-6 text-rose-300 text-sm">{{ error() }}</div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="metric-card">
            <span class="metric-label">Outstanding</span>
            <span class="metric-value text-mq-teal-400">{{ stats().outstanding | currencyEgp }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Collected (range)</span>
            <span class="metric-value text-emerald-400">{{ stats().collected | currencyEgp }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Invoices (range)</span>
            <span class="metric-value">{{ stats().count }}</span>
          </div>
        </div>

        <div class="overflow-x-auto rounded-2xl border border-mq-700 bg-mq-800/40">
          <table class="mq-table">
            <thead>
              <tr>
                <th class="mq-th">Invoice</th>
                <th class="mq-th">Patient</th>
                <th class="mq-th">Amount</th>
                <th class="mq-th">Status</th>
                <th class="mq-th">Issued</th>
                <th class="mq-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (inv of rows(); track inv.id) {
                <tr class="mq-tr" [routerLink]="['/invoices', inv.id]">
                  <td class="mq-td text-white font-medium">{{ inv.invoiceNumber }}</td>
                  <td class="mq-td">{{ inv.patientName || '—' }}</td>
                  <td class="mq-td text-white">{{ inv.totalAmount | currencyEgp }}</td>
                  <td class="mq-td">
                    <span class="badge-info">{{ inv.status }}</span>
                  </td>
                  <td class="mq-td">{{ inv.issuedAt | date: 'mediumDate' }}</td>
                  <td class="mq-td text-right row-actions opacity-100 md:opacity-0">
                    <span class="text-mq-teal-400 text-xs font-semibold">View →</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class InvoiceListComponent {
  private readonly api = inject(Client);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rows = signal<InvoiceDto[]>([]);
  readonly stats = signal<{ outstanding: number; collected: number; count: number }>({
    outstanding: 0,
    collected: 0,
    count: 0,
  });

  readonly statusFilter = signal<InvoiceStatus | undefined>(undefined);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const to = new Date();

      const [page, report] = await Promise.all([
        firstValueFrom(this.api.invoicesGET(1, 50, this.statusFilter() as unknown as string, from, to) as any),
        firstValueFrom(this.api.revenueReport2(from, to) as any).catch(() => null),
      ]);

      this.rows.set((page as any)?.items ?? []);
      this.stats.set({
        outstanding: (report as any)?.outstandingRevenue ?? 0,
        collected: (report as any)?.collectedRevenue ?? 0,
        count: (report as any)?.invoiceCount ?? (page as any)?.totalCount ?? 0,
      });
    } catch (e: any) {
      const detail = e?.error?.detail ?? e?.message ?? 'Failed to load invoices';
      this.error.set(typeof detail === 'string' ? detail : 'Failed to load invoices');
      this.notify.error(this.error()!);
    } finally {
      this.loading.set(false);
    }
  }
}
