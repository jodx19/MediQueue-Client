import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Receipt, Eye } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-my-invoices',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('500ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="space-y-6" [@pageEnter]>
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-black text-white">My Invoices</h1>
      </div>

      <div class="glass p-12 text-center">
        <lucide-icon name="receipt" class="text-mq-s400 mx-auto mb-4" [size]="48"/>
        <h3 class="text-white font-semibold text-lg mb-2">No invoices yet</h3>
        <p class="text-mq-s400 text-sm max-w-md mx-auto">
          Your invoices and payment history will appear here after your visits.
        </p>
      </div>

      <div class="mq-card-dark p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-white font-semibold">Payment Summary</h3>
        </div>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <p class="text-2xl font-black text-white">EGP 0</p>
            <p class="text-mq-s400 text-xs">Total Paid</p>
          </div>
          <div>
            <p class="text-2xl font-black text-emerald-400">EGP 0</p>
            <p class="text-mq-s400 text-xs">Outstanding</p>
          </div>
          <div>
            <p class="text-2xl font-black text-white">0</p>
            <p class="text-mq-s400 text-xs">Invoices</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MyInvoicesComponent {}
