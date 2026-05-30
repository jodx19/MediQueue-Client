import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';
import { 
  InvoicesClient, 
  InvoiceDto, 
  InvoiceStatus,
  RecordPaymentCommand,
  PaymentMethod
} from '../../../core/api/mediqueue-api';

// InvoiceStatus numeric enum: 1=Draft, 2=Pending/Unpaid, 3=PartiallyPaid, 4=Paid, 5=Overdue, 6=Cancelled
const IS = InvoiceStatus;

@Component({
  selector: 'app-my-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './my-invoices.component.html',
})
export class MyInvoicesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly invoicesClient = inject(InvoicesClient);

  isLoading = signal(true);
  invoices = signal<InvoiceDto[]>([]);
  activeFilter = signal<'all' | 'unpaid' | 'paid'>('all');

  // Payment Modal State
  showPayModal = signal(false);
  selectedInvoice = signal<InvoiceDto | null>(null);
  isSubmitting = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  paymentForm = {
    cardHolder: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  };

  private isUnpaid(inv: InvoiceDto): boolean {
    return inv.status === IS._2 || inv.status === IS._3 || inv.status === IS._5;
  }

  private isPaid(inv: InvoiceDto): boolean {
    return inv.status === IS._4;
  }

  private getOutstanding(inv: InvoiceDto): number {
    return inv.remainingAmount ?? ((inv.totalAmount ?? 0) - (inv.paidAmount ?? 0));
  }

  totalOutstanding = computed(() =>
    this.invoices()
      .filter(inv => this.isUnpaid(inv))
      .reduce((sum, inv) => sum + this.getOutstanding(inv), 0)
  );

  unpaidCount = computed(() =>
    this.invoices().filter(inv => this.isUnpaid(inv)).length
  );

  paidCount = computed(() =>
    this.invoices().filter(inv => this.isPaid(inv)).length
  );

  filteredInvoices = computed(() => {
    const list = this.invoices();
    const filter = this.activeFilter();
    return list.filter(inv => {
      if (filter === 'unpaid') return this.isUnpaid(inv);
      if (filter === 'paid')   return this.isPaid(inv);
      return true;
    }).sort((a, b) => new Date(b.dueDate!).getTime() - new Date(a.dueDate!).getTime());
  });

  ngOnInit() { this.loadInvoices(); }

  loadInvoices() {
    const patientId = this.auth.currentUser()?.patientId;
    if (!patientId) { this.isLoading.set(false); return; }
    this.isLoading.set(true);
    this.invoicesClient.patient3(patientId, 1, 100).subscribe({
      next: (res: any) => {
        if (res?.items) this.invoices.set(res.items);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openPaymentModal(invoice: InvoiceDto) {
    this.selectedInvoice.set(invoice);
    this.paymentForm = { cardHolder: '', cardNumber: '', expiry: '', cvv: '' };
    this.errorMsg.set('');
    this.successMsg.set('');
    this.showPayModal.set(true);
  }

  closePaymentModal() {
    this.showPayModal.set(false);
    this.selectedInvoice.set(null);
  }

  /** Returns amount still owed for a given invoice */
  getOutstandingAmount(inv: InvoiceDto): number {
    return this.getOutstanding(inv);
  }

  /** Returns true when invoice still needs payment */
  needsPayment(inv: InvoiceDto): boolean {
    return this.isUnpaid(inv);
  }

  onPaySubmit() {
    const inv = this.selectedInvoice();
    if (!inv?.id) return;

    if (!this.paymentForm.cardHolder.trim() || !this.paymentForm.cardNumber.trim()
      || !this.paymentForm.expiry.trim() || !this.paymentForm.cvv.trim()) {
      this.errorMsg.set('Please fill in all credit card details.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMsg.set('');

    const command = new RecordPaymentCommand({
      invoiceId: inv.id,
      amount: this.getOutstanding(inv),
      paymentMethod: PaymentMethod._2,
      referenceNumber: 'TXN-' + Math.floor(Math.random() * 899999 + 100000),
      notes: 'Digital Portal checkout by patient: ' + this.paymentForm.cardHolder.trim()
    });

    this.invoicesClient.payments(inv.id, command).subscribe({
      next: () => {
        this.successMsg.set('Payment approved! Invoice updated.');
        setTimeout(() => { this.showPayModal.set(false); this.loadInvoices(); }, 1500);
      },
      error: (err: any) => {
        this.errorMsg.set(err?.error?.detail || err?.error || 'Payment failed. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  getStatusLabel(status: InvoiceStatus | undefined): string {
    switch (status) {
      case IS._1: return 'Draft';
      case IS._2: return 'Unpaid';
      case IS._3: return 'Partial';
      case IS._4: return 'Paid';
      case IS._5: return 'Overdue';
      case IS._6: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  getSeverityClass(status: InvoiceStatus | undefined): string {
    switch (status) {
      case IS._4: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case IS._3: return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case IS._2:
      case IS._5: return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case IS._6: return 'bg-mq-700/50 text-mq-s400 border border-mq-700';
      default: return 'bg-mq-700 text-mq-s300';
    }
  }
}
