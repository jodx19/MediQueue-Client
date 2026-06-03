import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  InvoicesClient,
  CreateInvoiceCommand,
  RecordPaymentCommand,
  ApplyDiscountCommand,
  InvoiceDto,
} from '../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly client = inject(InvoicesClient);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);

  async createInvoice(dto: CreateInvoiceCommand): Promise<string> {
    const result: InvoiceDto = await firstValueFrom(this.client.invoicesPOST(dto));
    return result.id!;
  }

  async recordPayment(invoiceId: string, dto: RecordPaymentCommand): Promise<void> {
    await firstValueFrom(this.client.payments(invoiceId, dto));
  }

  async applyDiscount(invoiceId: string, dto: ApplyDiscountCommand): Promise<void> {
    await firstValueFrom(this.client.discount(invoiceId, dto));
  }

  isFullyPaid(invoice: any): boolean {
    const total = invoice?.totalAmount ?? 0;
    const paid = invoice?.paidAmount ?? 0;
    return total > 0 && paid >= total;
  }

  getRemainingBalance(invoice: any): number {
    const total = invoice?.totalAmount ?? 0;
    const paid = invoice?.paidAmount ?? 0;
    return Math.max(0, total - paid);
  }

  generateRevenueCSV(report: any): string {
    const headers = ['Metric', 'Value'];
    const rows: string[][] = [
      ['Total Revenue', report?.totalRevenue?.toString() ?? '0'],
      ['Collected Revenue', report?.collectedRevenue?.toString() ?? '0'],
      ['Outstanding Revenue', report?.outstandingRevenue?.toString() ?? '0'],
      ['Invoice Count', report?.invoiceCount?.toString() ?? '0'],
    ];
    const daily = report?.dailyRevenue ?? [];
    if (daily.length > 0) {
      rows.push(['--- Daily Breakdown ---', '']);
      for (const d of daily) {
        rows.push([d.date ? new Date(d.date).toLocaleDateString() : '', d.amount?.toString() ?? '0']);
      }
    }
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csvContent;
  }
}
