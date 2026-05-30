import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { InvoicesClient, InvoiceListItemDto } from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './invoice-list.component.html',
})
export class InvoiceListComponent implements OnInit {
  private readonly invoicesClient = inject(InvoicesClient);
  private readonly notify         = inject(NotificationService);
  public  readonly router         = inject(Router);

  isLoading = signal(true);
  invoices  = signal<InvoiceListItemDto[]>([]);
  filter    = signal<string>('');

  get filtered() {
    const f = this.filter();
    if (!f) return this.invoices();
    return this.invoices().filter(i => (i.status as any) === f);
  }

  get totalRevenue(): number {
    return this.invoices()
      .filter(i => (i.status as any) === 'Paid')
      .reduce((sum, i) => sum + (i.totalAmount ?? 0), 0);
  }

  get pendingAmount(): number {
    return this.invoices()
      .filter(i => (i.status as any) === 'Pending')
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

  statusClass(status: any): string {
    const map: Record<string, string> = {
      'Paid':     'inline-flex px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      'Pending':  'inline-flex px-2.5 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30',
      'Overdue':  'inline-flex px-2.5 py-0.5 rounded-full text-xs bg-rose-500/15 text-rose-400 border border-rose-500/30',
      'Cancelled':'inline-flex px-2.5 py-0.5 rounded-full text-xs bg-mq-700/50 text-mq-s400 border border-mq-700',
    };
    return map[status] ?? 'inline-flex px-2.5 py-0.5 rounded-full text-xs bg-mq-700 text-mq-s400';
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
