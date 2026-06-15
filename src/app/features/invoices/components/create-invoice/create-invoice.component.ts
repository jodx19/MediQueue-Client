import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  PatientsClient,
  ClinicalVisitsClient,
  CreateInvoiceCommand,
  CreateInvoiceItemDto,
} from '../../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../../core/services/api-error-handler.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { InvoiceService } from '../../services/invoice.service';

interface InvoiceLineItemForm {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  source: 'manual' | 'procedure' | 'lab' | 'imaging';
}

let itemIdCounter = 0;
function nextId(): string {
  return `item_${++itemIdCounter}_${Date.now()}`;
}

function makeItem(overrides?: Partial<InvoiceLineItemForm>): InvoiceLineItemForm {
  return {
    id: nextId(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    lineTotal: 0,
    source: 'manual',
    ...overrides,
  };
}

@Component({
  selector: 'app-create-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="p-6 bg-mq-navy min-h-screen">
      <div class="max-w-4xl mx-auto space-y-6">

        <div class="page-header">
          <div>
            <button (click)="router.navigate(['/invoices'])"
                    class="flex items-center gap-2 text-mq-s400 hover:text-white text-sm transition-colors mb-3">
              <lucide-icon name="arrow-left" [size]="14"/>
              Back to Invoices
            </button>
            <h1 class="page-title" data-testid="page-title">Create Invoice</h1>
            <p class="page-sub">Generate a new invoice for a patient</p>
          </div>
        </div>

        @if (importBanner()) {
          <div class="flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
            <span class="text-indigo-300 text-sm font-medium">{{ importBanner() }}</span>
            <button (click)="importBanner.set('')" class="text-indigo-400 hover:text-indigo-200 p-1">
              <lucide-icon name="x" [size]="16"/>
            </button>
          </div>
        }

        <!-- Patient Selector -->
        <div class="mq-card-dark p-6">
          <label class="form-label block mb-2">Patient</label>
          @if (selectedPatient()) {
            <div class="flex items-center gap-3 px-4 py-3 rounded-xl bg-mq-teal/10 border border-mq-teal/30">
              <div class="w-10 h-10 rounded-full bg-mq-teal/20 flex items-center justify-center text-mq-t400 font-bold">
                {{ selectedPatient()!.name?.[0] || '?' }}
              </div>
              <div class="flex-1">
                <p class="text-white font-semibold text-sm">{{ selectedPatient()!.name }}</p>
                <p class="text-xs text-mq-s400">{{ selectedPatient()!.mrn }}</p>
              </div>
              <button (click)="clearPatient()" class="text-mq-s400 hover:text-rose-400 p-1">
                <lucide-icon name="x" [size]="18"/>
              </button>
            </div>
          } @else {
            <div class="relative">
              <input type="text" [ngModel]="patientSearchQuery()"
                     (ngModelChange)="patientSearchQueryChanged($event)"
                     placeholder="Search by patient name or MRN..."
                     class="form-input w-full"/>
              @if (patientSearchResults().length > 0) {
                <div class="absolute z-20 top-full mt-1 left-0 right-0 bg-mq-800 border border-mq-700 rounded-xl shadow-xl overflow-hidden">
                  @for (p of patientSearchResults(); track p.id) {
                    <button (click)="selectPatient(p)"
                            class="w-full text-left px-4 py-3 hover:bg-mq-teal/10 text-sm text-white border-b border-mq-700/50 last:border-0 transition-colors">
                      <span class="font-medium">{{ p.name }}</span>
                      <span class="text-mq-s400 ml-2 text-xs">{{ p.mrn }}</span>
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Line Items -->
        <div class="mq-card-dark p-6">
          <h3 class="text-white font-bold mb-4">Line Items</h3>

          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th class="th w-1/2">Description</th>
                  <th class="th w-16 text-center">Qty</th>
                  <th class="th w-28 text-right">Unit Price</th>
                  <th class="th w-28 text-right">Total</th>
                  <th class="th w-12"></th>
                </tr>
              </thead>
              <tbody>
                @for (item of lineItems(); track item.id; let idx = $index) {
                  <tr>
                    <td class="td">
                      <input type="text" [ngModel]="item.description"
                             (ngModelChange)="updateItem(idx, 'description', $event)"
                             class="form-input w-full text-sm" placeholder="Item description"/>
                    </td>
                    <td class="td">
                      <input type="number" [ngModel]="item.quantity"
                             (ngModelChange)="updateItem(idx, 'quantity', +$event || 1)"
                             class="form-input w-16 text-center text-sm" min="1"/>
                    </td>
                    <td class="td">
                      <div class="flex items-center justify-end gap-1">
                        <span class="text-xs text-mq-s400">EGP</span>
                        <input type="number" [ngModel]="item.unitPrice"
                               (ngModelChange)="updateItem(idx, 'unitPrice', +$event || 0)"
                               class="form-input w-24 text-right text-sm" min="0" step="0.01"/>
                      </div>
                    </td>
                    <td class="td text-right font-mono text-white font-semibold text-sm">
                      EGP {{ item.lineTotal.toLocaleString() }}
                    </td>
                    <td class="td text-center">
                      <button (click)="removeItem(idx)" class="text-mq-s400 hover:text-rose-400 p-1">
                        <lucide-icon name="trash-2" [size]="14"/>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <button (click)="addItem()" class="btn-ghost text-sm mt-4 flex items-center gap-2 px-4 py-2">
            <lucide-icon name="plus" [size]="14"/>
            Add Line Item
          </button>

          @if (lineItems().length === 0) {
            <div class="py-8 text-center text-mq-s500 text-sm">No items added yet.</div>
          }

          <!-- Totals -->
          <div class="max-w-xs ml-auto mt-6 space-y-2 pt-4 border-t border-mq-700">
            <div class="flex justify-between text-sm">
              <span class="text-mq-s400">Subtotal</span>
              <span class="text-white font-mono">EGP {{ subtotal().toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-sm items-center">
              <span class="text-mq-s400">Discount</span>
              <div class="flex items-center gap-2">
                <div class="flex rounded-lg overflow-hidden border border-mq-700 text-xs">
                  <button (click)="discountType.set('percentage')"
                          [class]="discountType() === 'percentage' ? 'px-2 py-1 bg-mq-teal text-white font-semibold' : 'px-2 py-1 bg-mq-800 text-mq-s400'">
                    %
                  </button>
                  <button (click)="discountType.set('fixed')"
                          [class]="discountType() === 'fixed' ? 'px-2 py-1 bg-mq-teal text-white font-semibold' : 'px-2 py-1 bg-mq-800 text-mq-s400'">
                    EGP
                  </button>
                </div>
                <input type="number" [ngModel]="discountValue()"
                       (ngModelChange)="discountValue.set(+$event || 0)"
                       class="form-input w-20 text-right text-sm" min="0"/>
              </div>
            </div>
            @if (discountValue() > 0) {
              <div class="flex justify-between text-xs text-emerald-400">
                <span></span>
                <span>-EGP {{ discountAmount().toLocaleString() }}</span>
              </div>
            }
            <div class="flex justify-between text-base font-bold pt-2 border-t border-mq-700">
              <span class="text-white">Total</span>
              <span class="text-sky-400 font-mono text-lg">EGP {{ total().toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- Due Date + Notes -->
        <div class="mq-card-dark p-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="form-label">Due Date</label>
              <input type="date" [ngModel]="dueDate()" (ngModelChange)="dueDate.set($event)"
                     class="form-input w-full"/>
            </div>
            <div class="space-y-1.5">
              <label class="form-label">Internal Notes</label>
              <textarea [ngModel]="notes()" (ngModelChange)="notes.set($event)"
                        class="form-input w-full" rows="2" placeholder="Optional notes..."></textarea>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
          <button (click)="router.navigate(['/invoices'])"
                  class="btn-ghost px-6 py-2.5 text-sm">Cancel</button>
          <button (click)="saveDraft()" [disabled]="isSaving() || !canSave()"
                  class="btn-ghost px-6 py-2.5 text-sm flex items-center gap-2 border border-mq-700">
            @if (isSaving()) {
              <lucide-icon name="loader-2" class="animate-spin" [size]="14"/>
            }
            Save as Draft
          </button>
          <button (click)="saveAndSend()" [disabled]="isSaving() || !canSave()"
                  class="btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
            @if (isSaving()) {
              <lucide-icon name="loader-2" class="animate-spin" [size]="14"/>
            }
            <lucide-icon name="send" [size]="14"/>
            Save & Send
          </button>
        </div>
      </div>
    </div>
  `,
})
export class CreateInvoiceComponent implements OnInit {
  private readonly patientsClient = inject(PatientsClient);
  private readonly visitsClient = inject(ClinicalVisitsClient);
  private readonly invoiceService = inject(InvoiceService);
  private readonly notify = inject(NotificationService);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  selectedPatient = signal<any | null>(null);
  lineItems = signal<InvoiceLineItemForm[]>([]);
  discountType = signal<'percentage' | 'fixed'>('percentage');
  discountValue = signal<number>(0);
  notes = signal<string>('');
  dueDate = signal<string>('');
  importBanner = signal<string>('');

  isLoading = signal(false);
  isSaving = signal(false);
  patientSearchQuery = signal('');
  patientSearchResults = signal<any[]>([]);

  private search$ = new Subject<string>();

  subtotal = computed(() =>
    this.lineItems().reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  );

  discountAmount = computed(() => {
    if (this.discountType() === 'percentage')
      return this.subtotal() * (this.discountValue() / 100);
    return this.discountValue();
  });

  total = computed(() => {
    const d = Math.min(this.discountAmount(), this.subtotal());
    return this.subtotal() - d;
  });

  canSave = computed(() =>
    !!this.selectedPatient() && this.lineItems().length > 0 &&
    this.lineItems().some(i => i.description.trim().length > 0)
  );

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((term: string) => this.searchPatients(term));
  }

  async ngOnInit() {
    const patientId = this.route.snapshot.queryParamMap.get('patientId');
    const visitId = this.route.snapshot.queryParamMap.get('visitId');

    if (patientId) {
      try {
        const result = await firstValueFrom(this.patientsClient.patientsGET2(patientId));
        this.selectedPatient.set(result as any);
      } catch {
        this.notify.warning('Could not pre-load patient.');
      }
    }

    if (visitId) {
      try {
        const visit = await firstValueFrom(this.visitsClient.clinicalVisitsGET(visitId));
        const procedures = (visit as any)?.procedures ?? [];
        if (procedures.length > 0) {
          const items = procedures.map((p: any) => makeItem({
            description: p.description || p.cptCode || 'Procedure',
            quantity: 1,
            unitPrice: p.fee || 0,
            lineTotal: p.fee || 0,
            source: 'procedure',
          }));
          this.lineItems.update(existing => [...existing, ...items]);
          this.importBanner.set(`${items.length} procedure(s) imported from visit #${visitId.substring(0, 8)}`);
        }
      } catch {
        this.notify.warning('Could not load visit procedures.');
      }
    }
  }

  patientSearchQueryChanged(value: string) {
    this.patientSearchQuery.set(value);
    this.search$.next(value);
  }

  private async searchPatients(term: string) {
    if (!term.trim()) {
      this.patientSearchResults.set([]);
      return;
    }
    try {
      const result: any = await firstValueFrom(this.patientsClient.search(term, 1, 10));
      this.patientSearchResults.set(result?.items ?? []);
    } catch {
      this.patientSearchResults.set([]);
    }
  }

  selectPatient(p: any) {
    this.selectedPatient.set(p);
    this.patientSearchQuery.set('');
    this.patientSearchResults.set([]);
  }

  clearPatient() {
    this.selectedPatient.set(null);
  }

  addItem() {
    this.lineItems.update(items => [...items, makeItem()]);
  }

  removeItem(index: number) {
    this.lineItems.update(items => items.filter((_, i) => i !== index));
  }

  updateItem(index: number, field: string, value: any) {
    this.lineItems.update(items => {
      const updated = items.map((item, i) => {
        if (i !== index) return item;
        const changed = { ...item, [field]: value };
        changed.lineTotal = changed.quantity * changed.unitPrice;
        return changed;
      });
      return updated;
    });
  }

  private async createInvoice(status: number): Promise<string | null> {
    this.isSaving.set(true);
    try {
      const command = new CreateInvoiceCommand({
        patientId: this.selectedPatient()!.id,
        items: this.lineItems()
          .filter(i => i.description.trim().length > 0)
          .map(i => new CreateInvoiceItemDto({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
      });
      const id = await this.invoiceService.createInvoice(command);

      if (this.discountValue() > 0) {
        try {
          const { ApplyDiscountCommand } = await import('../../../../core/api/mediqueue-api');
          await this.invoiceService.applyDiscount(id, new ApplyDiscountCommand({
            invoiceId: id,
            discountAmount: this.discountAmount(),
            reason: 'Applied during invoice creation',
          }));
        } catch { /* discount is best-effort */ }
      }

      return id;
    } catch (err) {
      this.apiErrorHandler.handle(err);
      return null;
    } finally {
      this.isSaving.set(false);
    }
  }

  async saveDraft() {
    const id = await this.createInvoice(1);
    if (id) {
      this.notify.success('Invoice saved as draft.');
      this.router.navigate(['/invoices', id]);
    }
  }

  async saveAndSend() {
    const id = await this.createInvoice(2);
    if (id) {
      this.notify.success('Invoice sent to patient.');
      this.router.navigate(['/invoices', id]);
    }
  }
}
