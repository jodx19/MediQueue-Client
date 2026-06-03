import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { InvoicesClient, InvoiceListItemDto, InvoiceStatus } from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';
import { InvoiceStatusPipe } from '../../../shared/pipes/invoice-status.pipe';
import { invoiceStatusFromNumber } from '../../../core/utils/invoice-status.utils';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

const IS = InvoiceStatus;

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, InvoiceStatusPipe, HasRoleDirective],
  templateUrl: './invoice-list.component.html',
})
export class InvoiceListComponent implements OnInit {
  private readonly invoicesClient = inject(InvoicesClient);
  private readonly notify         = inject(NotificationService);
  public  readonly router         = inject(Router);

  isLoading = signal(true);
  invoices  = signal<InvoiceListItemDto[]>([]);
  filter    = signal<InvoiceStatus | null>(null);

  get filtered() {
    const f = this.filter();
    if (f == null) return this.invoices();
    return this.invoices().filter(i => invoiceStatusFromNumber(i.status as any) === f);
  }

  get totalRevenue(): number {
    return this.invoices()
      .filter(i => invoiceStatusFromNumber(i.status as any) === IS._3)
      .reduce((sum, i) => sum + (i.totalAmount ?? 0), 0);
  }

  get pendingAmount(): number {
    return this.invoices()
      .filter(i => invoiceStatusFromNumber(i.status as any) === IS._2)
      .reduce((sum, i) => sum + (i.totalAmount ?? 0), 0);
  }

  async ngOnInit() {
    await this.loadInvoices();
  }

  async loadInvoices() {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.invoicesClient.invoicesGET(1, 50, undefined, undefined, undefined));
      const data = response?.items ?? [];
      this.invoices.set(Array.isArray(data) ? data : []);
    } catch (err) {
      this.notify.error('Failed to load invoices');
    } finally {
      this.isLoading.set(false);
    }
  }

  setFilter(value: string) {
    if (!value) { this.filter.set(null); return; }
    for (const key of Object.keys(IS)) {
      if (IS[key as keyof typeof IS] === parseInt(value)) {
        this.filter.set(parseInt(value) as InvoiceStatus);
        return;
      }
    }
    this.filter.set(null);
  }

  exportCSV() {
    const data = this.filtered;
    if (data.length === 0) {
      this.notify.warning('No invoice data available to export.');
      return;
    }
    const headers = ['Invoice #', 'Patient Name', 'Amount (EGP)', 'Status', 'Date'];
    const rows = data.map(i => [
      `"${i.invoiceNumber || ''}"`,
      `"${i.patientName || ''}"`,
      i.totalAmount ?? 0,
      `"${i.status || ''}"`,
      i.createdAt ? `"${new Date(i.createdAt).toLocaleDateString()}"` : '""'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `MediQueue_Invoices_Report_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
    this.notify.success('Invoice report CSV exported successfully!');
  }

  printPDF() {
    window.print();
  }
}
