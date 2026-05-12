import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InvoicesClient, InvoiceSummaryDto } from '../../../core/api/api-facade.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { CurrencyEgpPipe } from '../../../shared/pipes/currency-egp.pipe';
import { pageEnter } from '../../../shared/animations/page-animations';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, LoadingSkeletonComponent, BadgeComponent, EmptyStateComponent, CurrencyEgpPipe],
  animations: [pageEnter],
  template: `
    <app-page-header title="Invoices" subtitle="Billing & payments" [hasActions]="false" />

    @if (isLoading()) {
      <app-loading-skeleton [count]="5" />
    } @else if (invoices().length === 0) {
      <app-empty-state title="No invoices" message="Invoices are created automatically when visits are finalized." />
    } @else {
      <div class="invoice-table" @pageEnter>
        <div class="table-header">
          <span>Invoice #</span>
          <span>Patient</span>
          <span>Date</span>
          <span>Amount</span>
          <span>Status</span>
        </div>
        @for (inv of invoices(); track inv.id) {
          <div class="table-row" (click)="open(inv.id!)">
            <span class="inv-number">#{{ inv.invoiceNumber }}</span>
            <span class="patient-name">{{ inv.patientName }}</span>
            <span class="text-secondary">{{ inv.issuedAt | date:'mediumDate' }}</span>
            <span class="amount">{{ inv.totalAmount | currencyEgp }}</span>
            <app-badge [label]="inv.status ?? 'Pending'" [variant]="statusVariant(inv.status)" />
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .invoice-table { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
    .table-header {
      display: grid; grid-template-columns: 130px 1fr 140px 160px 100px;
      padding: var(--space-3) var(--space-5); background: var(--color-surface-2);
      font-size: var(--text-xs); font-weight: 600; color: var(--color-text-secondary);
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .table-row {
      display: grid; grid-template-columns: 130px 1fr 140px 160px 100px;
      padding: var(--space-4) var(--space-5); border-top: 1px solid var(--color-border);
      font-size: var(--text-sm); cursor: pointer; transition: background var(--duration-fast);
      align-items: center;
    }
    .table-row:hover { background: var(--color-surface-2); }
    .inv-number { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-accent); font-weight: 600; }
    .patient-name { font-weight: 500; color: var(--color-text-primary); }
    .text-secondary { color: var(--color-text-secondary); }
    .amount { font-weight: 600; font-family: var(--font-mono); font-size: var(--text-xs); }
  `],
})
export class InvoiceListComponent implements OnInit {
  private readonly invoicesClient = inject(InvoicesClient);
  readonly router = inject(Router);

  invoices = signal<InvoiceSummaryDto[]>([]);
  isLoading = signal(true);

  async ngOnInit() {
    try {
      const result = await this.invoicesClient.getAll();
      this.invoices.set(result ?? []);
    } finally {
      this.isLoading.set(false);
    }
  }

  open(id: string) { this.router.navigate(['/invoices', id]); }

  statusVariant(status: string | undefined): any {
    const map: Record<string, any> = { 'Paid': 'success', 'Overdue': 'danger', 'Pending': 'warning' };
    return map[status ?? ''] ?? 'default';
  }
}
