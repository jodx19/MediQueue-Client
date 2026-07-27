import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { LucideAngularModule, Receipt, Search, Filter, Printer, Download, Plus, CheckCircle, Clock } from 'lucide-angular';
import { InvoicesClient, InvoiceListItemDto } from '../../core/api/mediqueue-api';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './invoices.component.html',
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class InvoicesComponent {
  readonly LucideIcons = { Receipt, Search, Filter, Printer, Download, Plus, CheckCircle, Clock };

  filter = signal<'All' | 'Pending' | 'Paid' | 'Cancelled'>('All');
  invoices = signal<InvoiceListItemDto[]>([]);
  isLoading = signal(false);

  private invoicesClient = inject(InvoicesClient);

  constructor() {
    this.loadInvoices();
  }

  setFilter(f: 'All' | 'Pending' | 'Paid' | 'Cancelled') {
    this.filter.set(f);
    this.loadInvoices();
  }

  loadInvoices() {
    this.isLoading.set(true);
    const statusFilter = this.filter() === 'All' ? undefined : this.filter();
    this.invoicesClient.invoicesGET(1, 50, statusFilter, undefined, undefined).subscribe({
      next: (res) => {
        this.invoices.set(res.items || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  get filteredInvoices() {
    return this.invoices();
  }
}
