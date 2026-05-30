import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  RecordPaymentCommand, ApplyDiscountCommand,
  InvoicesClient, PaymentMethod
} from '../../../core/api/mediqueue-api';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './invoice-detail.component.html',
})
export class InvoiceDetailComponent implements OnInit {
  private readonly invoicesClient = inject(InvoicesClient);
  private readonly notify         = inject(NotificationService);
  private readonly route          = inject(ActivatedRoute);
  public  readonly router         = inject(Router);

  invoiceId = '';
  invoice   = signal<any>(null);
  isLoading = signal(true);

  payment = { amount: 0, method: PaymentMethod._1, notes: '' };
  discountValue = 0;

  paymentMethodKeys = [
    { label: 'Cash',      value: PaymentMethod._1 },
    { label: 'Card',      value: PaymentMethod._2 },
    { label: 'Insurance', value: PaymentMethod._3 },
  ];

  async ngOnInit() {
    this.invoiceId = this.route.snapshot.paramMap.get('id')!;
    await this.loadInvoice();
  }

  private async loadInvoice() {
    try {
      const result = await firstValueFrom(this.invoicesClient.invoicesGET2(this.invoiceId));
      this.invoice.set(result);
      this.payment.amount = (result as any).totalAmount ?? 0;
    } catch (err) {
      this.notify.error('Failed to load invoice');
    } finally {
      this.isLoading.set(false);
    }
  }

  async applyDiscount() {
    try {
      const command = new ApplyDiscountCommand({
        invoiceId:      this.invoiceId,
        discountAmount: this.discountValue,
        reason:         'Applied via UI',
      });
      await firstValueFrom(this.invoicesClient.discount(this.invoiceId, command));
      this.notify.success('Discount applied.');
      await this.loadInvoice();
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Failed to apply discount.');
    }
  }

  async recordPayment() {
    try {
      const command = new RecordPaymentCommand({
        invoiceId:     this.invoiceId,
        amount:        this.payment.amount,
        paymentMethod: this.payment.method as any,
        notes:         this.payment.notes,
      });
      await firstValueFrom(this.invoicesClient.payments(this.invoiceId, command));
      this.notify.success('Payment recorded successfully!');
      await this.loadInvoice();
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Failed to record payment.');
    }
  }

  statusBadgeClass(status: string | undefined): string {
    const map: Record<string, string> = {
      'Paid':      'px-3 py-1 rounded-full text-sm bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      'Pending':   'px-3 py-1 rounded-full text-sm bg-amber-500/15 text-amber-400 border border-amber-500/30',
      'Overdue':   'px-3 py-1 rounded-full text-sm bg-rose-500/15 text-rose-400 border border-rose-500/30',
      'Cancelled': 'px-3 py-1 rounded-full text-sm bg-mq-700 text-mq-s400',
    };
    return map[status ?? ''] ?? 'px-3 py-1 rounded-full text-sm bg-mq-700 text-mq-s400';
  }
}
