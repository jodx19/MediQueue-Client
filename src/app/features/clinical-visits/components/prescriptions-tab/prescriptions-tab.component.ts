import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import {
  ClinicalVisitsClient,
  CreatePrescriptionCommand,
  PrescriptionItemDto,
} from '../../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../../core/services/api-error-handler.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-prescriptions-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, EmptyStateComponent, LoadingSkeletonComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-white font-bold text-base flex items-center gap-2">
          <lucide-icon name="pill" class="text-emerald-400" [size]="18"/>
          Prescriptions
        </h3>
        @if (!readonly) {
          <button (click)="isAdding.set(!isAdding())"
                  class="btn-primary text-sm flex items-center gap-2 px-4 py-2">
            <lucide-icon name="plus" [size]="14"/>
            Add Prescription
          </button>
        }
      </div>

      <!-- Drug interaction warning placeholder -->
      @if (interactionWarning()) {
        <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-start gap-3">
          <lucide-icon name="alert-triangle" class="flex-shrink-0 mt-0.5" [size]="16"/>
          <span>{{ interactionWarning() }}</span>
        </div>
      }

      @if (isLoading()) {
        <app-loading-skeleton type="table" [count]="3"/>
      } @else if (prescriptions().length === 0 && !isAdding()) {
        <app-empty-state icon="pill" title="No prescriptions"
                         description="No medications prescribed yet for this visit."/>
      } @else {
        @if (isAdding()) {
          <div class="mq-card-dark p-6 border-l-4 border-emerald-500 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="mq-label">Medication Name <span class="text-rose-400">*</span></label>
                <input type="text" [(ngModel)]="form.medicationName" class="mq-input" placeholder="e.g. Amoxicillin"/>
              </div>
              <div class="space-y-1.5">
                <label class="mq-label">Dosage <span class="text-rose-400">*</span></label>
                <input type="text" [(ngModel)]="form.dosage" class="mq-input" placeholder="e.g. 500mg"/>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="mq-label">Frequency</label>
                <select [(ngModel)]="form.frequency" class="mq-input mq-select">
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Four times daily">Four times daily</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="mq-label">Duration</label>
                <input type="text" [(ngModel)]="form.duration" class="mq-input" placeholder="e.g. 7 days"/>
              </div>
              <div class="space-y-1.5">
                <label class="mq-label">Quantity</label>
                <input type="number" [(ngModel)]="form.quantity" class="mq-input" placeholder="30"/>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="mq-label">Instructions</label>
              <textarea [(ngModel)]="form.instructions" class="mq-input" rows="2" placeholder="Take with food..."></textarea>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <button (click)="confirmAdd()" [disabled]="!form.medicationName.trim() || !form.dosage.trim()"
                      class="btn-primary px-5 py-2.5 text-sm">Save</button>
              <button (click)="cancelAdd()" class="btn-ghost px-5 py-2.5 text-sm">Cancel</button>
            </div>
          </div>
        }

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (rx of prescriptions(); track rx.id) {
            <div class="mq-card-dark p-5 border border-mq-700/60 card">
              <div class="flex items-start justify-between mb-3">
                <div>
                  @if (rx.prescriptionNumber) {
                    <span class="text-[10px] text-mq-s400 font-mono">{{ rx.prescriptionNumber }}</span>
                  }
                  <h4 class="text-white font-bold text-sm mt-1">Prescription</h4>
                </div>
                <button (click)="printPrescription(rx)"
                        class="text-mq-s400 hover:text-mq-t400 transition-colors p-1"
                        title="Print">
                  <lucide-icon name="printer" [size]="14"/>
                </button>
              </div>
              <div class="space-y-2">
                @for (item of rx.items; track $index) {
                  <div class="p-3 rounded-xl bg-mq-navy/40 border border-mq-700/30">
                    <div class="flex items-center justify-between">
                      <span class="text-white font-semibold text-sm">{{ item.medicationName }}</span>
                      <span class="text-mq-t400 text-xs font-bold">{{ item.dosage }}</span>
                    </div>
                    <div class="flex items-center gap-3 mt-1.5 text-[11px] text-mq-s400">
                      <span>{{ item.frequency }}</span>
                      @if (item.duration) {
                        <span class="flex items-center gap-1">
                          <span class="w-1 h-1 rounded-full bg-mq-600"></span>
                          <span>{{ item.duration }}</span>
                        </span>
                      }
                    </div>
                    @if (item.instructions) {
                      <p class="text-mq-s400 text-[11px] mt-1.5 italic">{{ item.instructions }}</p>
                    }
                  </div>
                }
              </div>
              <div class="flex items-center justify-between mt-3 pt-3 border-t border-mq-700/40 text-[10px] text-mq-s400">
                <span>Issued: {{ rx.issuedAt | date:'MMM d, y' }}</span>
                @if (rx.validUntil) {
                  <span>Valid until: {{ rx.validUntil | date:'MMM d, y' }}</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class PrescriptionsTabComponent {
  @Input({ required: true }) visitId!: string;
  @Input() readonly = false;
  @Input() set visitData(v: any) { if (v) this.loadFromVisit(v); }

  private readonly client = inject(ClinicalVisitsClient);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
  private readonly notify = inject(NotificationService);

  prescriptions = signal<any[]>([]);
  isLoading = signal(false);
  isAdding = signal(false);
  interactionWarning = signal<string | null>(null);

  form = { medicationName: '', dosage: '', frequency: 'Twice daily', duration: '', quantity: 0, instructions: '' };

  loadFromVisit(visit: any) {
    this.prescriptions.set(visit?.prescriptions ?? []);
  }

  cancelAdd() {
    this.isAdding.set(false);
    this.form = { medicationName: '', dosage: '', frequency: 'Twice daily', duration: '', quantity: 0, instructions: '' };
  }

  async confirmAdd() {
    if (!this.form.medicationName.trim() || !this.form.dosage.trim()) return;
    this.isLoading.set(true);

    /** TODO Step 8 (AI features): call drug-interaction check API and set interactionWarning() */
    try {
      const item = new PrescriptionItemDto({
        medicationName: this.form.medicationName,
        dosage: this.form.dosage,
        frequency: this.form.frequency,
        duration: this.form.duration || undefined,
        quantity: this.form.quantity || undefined,
        instructions: this.form.instructions || undefined,
      });
      const command = new CreatePrescriptionCommand({
        visitId: this.visitId,
        items: [item],
      });
      await firstValueFrom(this.client.prescriptions(this.visitId, command));
      this.notify.success('Prescription added');
      this.cancelAdd();
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  printPrescription(rx: any) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Prescription</title>
      <style>
        body { font-family: monospace; padding: 40px; }
        .print-only { display: block; }
        @media print { body { margin: 0; padding: 20px; } }
      </style></head><body>
      <h2>Prescription #${rx.prescriptionNumber || ''}</h2>
      <p>Issued: ${new Date(rx.issuedAt).toLocaleDateString()}</p>
      <hr/>
      ${(rx.items ?? []).map((item: any) => `
        <div style="margin-bottom:16px">
          <strong>${item.medicationName}</strong> — ${item.dosage}<br/>
          ${item.frequency} ${item.duration ? 'for ' + item.duration : ''}<br/>
          ${item.instructions ? '<em>' + item.instructions + '</em>' : ''}
        </div>
      `).join('')}
      <hr/>
      <p style="color:#666;font-size:12px">Digitally signed by MediQueue EMR</p>
      <script>window.print();window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  }
}
