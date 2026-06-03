import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  RecordPaymentCommand, ApplyDiscountCommand,
  InvoicesClient, PaymentMethod, InvoiceStatus
} from '../../../core/api/mediqueue-api';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';
import { InvoiceStatusPipe } from '../../../shared/pipes/invoice-status.pipe';
import { InvoiceService } from '../services/invoice.service';

const IS = InvoiceStatus;

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, InvoiceStatusPipe],
  templateUrl: './invoice-detail.component.html',
})
export class InvoiceDetailComponent implements OnInit {
  private readonly invoicesClient = inject(InvoicesClient);
  private readonly notify = inject(NotificationService);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly route = inject(ActivatedRoute);
  public readonly router = inject(Router);

  readonly IS = IS;

  invoiceId = '';
  invoice = signal<any>(null);
  isLoading = signal(true);
  isProcessingPayment = signal(false);
  isApplyingDiscount = signal(false);

  showPaymentForm = signal(false);
  paymentAmount = signal<number>(0);
  paymentMethod = signal<PaymentMethod>(PaymentMethod._1);
  paymentDate = signal<string>('');
  paymentNote = signal<string>('');

  discountAmount = signal<number>(0);
  isDraft = computed(() => this.invoice()?.status === IS._1);
  isSent = computed(() => this.invoice()?.status === IS._2);
  isPaid = computed(() => this.invoice()?.status === IS._3);
  isPartial = computed(() => this.invoice()?.status === IS._4);
  isOverdue = computed(() => this.invoice()?.status === IS._5);
  isCancelled = computed(() => this.invoice()?.status === IS._6);
  canRecordPayment = computed(() => !this.isPaid() && !this.isCancelled());
  canApplyDiscount = computed(() => this.isDraft());

  paymentMethodKeys = [
    { label: 'Cash', value: PaymentMethod._1 },
    { label: 'Card', value: PaymentMethod._2 },
    { label: 'Transfer', value: PaymentMethod._4 },
    { label: 'Insurance', value: PaymentMethod._3 },
  ];

  async ngOnInit() {
    this.invoiceId = this.route.snapshot.paramMap.get('id')!;
    await this.loadInvoice();
  }

  private async loadInvoice() {
    this.isLoading.set(true);
    try {
      const result = await firstValueFrom(this.invoicesClient.invoicesGET2(this.invoiceId));
      this.invoice.set(result);
      this.paymentAmount.set((result as any).totalAmount ?? 0);
      this.paymentDate.set(new Date().toISOString().substring(0, 10));
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onApplyDiscount() {
    if (!this.discountAmount() || this.discountAmount() <= 0) return;
    this.isApplyingDiscount.set(true);
    try {
      const command = new ApplyDiscountCommand({
        invoiceId: this.invoiceId,
        discountAmount: this.discountAmount(),
        reason: 'Applied via UI',
      });
      await this.invoiceService.applyDiscount(this.invoiceId, command);
      this.notify.success('Discount applied.');
      this.discountAmount.set(0);
      await this.loadInvoice();
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isApplyingDiscount.set(false);
    }
  }

  async onRecordPayment() {
    if (!this.paymentAmount() || this.paymentAmount() <= 0) return;
    this.isProcessingPayment.set(true);
    try {
      const command = new RecordPaymentCommand({
        invoiceId: this.invoiceId,
        amount: this.paymentAmount(),
        paymentMethod: this.paymentMethod(),
        notes: this.paymentNote() || undefined,
      });
      await this.invoiceService.recordPayment(this.invoiceId, command);
      await this.loadInvoice();
      if (this.invoiceService.isFullyPaid(this.invoice())) {
        this.notify.success('Invoice fully paid.');
      } else {
        const remaining = this.invoiceService.getRemainingBalance(this.invoice());
        this.notify.info(`Partial payment recorded — EGP ${remaining.toLocaleString()} remaining.`);
      }
      this.showPaymentForm.set(false);
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isProcessingPayment.set(false);
    }
  }

  async sendInvoice() {
    this.notify.info('Send invoice — will be implemented in a future step.');
  }

  async cancelInvoice() {
    if (!confirm('Cancel this invoice? This action cannot be undone.')) return;
    this.notify.info('Cancel invoice — will be implemented in a future step.');
  }

  downloadPdf() {
    this.notify.info('PDF download — will be implemented in a future step.');
  }
}
