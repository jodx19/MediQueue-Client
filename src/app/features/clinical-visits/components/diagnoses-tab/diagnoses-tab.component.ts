import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import {
  ClinicalVisitsClient,
  AddDiagnosisCommand,
  DiagnosisType,
} from '../../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../../core/services/api-error-handler.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-diagnoses-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, EmptyStateComponent, LoadingSkeletonComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-white font-bold text-base flex items-center gap-2">
          <lucide-icon name="stethoscope" class="text-purple-400" [size]="18"/>
          Diagnoses
        </h3>
        @if (!readonly) {
          <button (click)="isAdding.set(!isAdding())"
                  class="btn-primary text-sm flex items-center gap-2 px-4 py-2">
            <lucide-icon name="plus" [size]="14"/>
            Add Diagnosis
          </button>
        }
      </div>

      @if (isLoading()) {
        <app-loading-skeleton type="table" [count]="3"/>
      } @else if (diagnoses().length === 0 && !isAdding()) {
        <app-empty-state icon="stethoscope" title="No diagnoses"
                         description="Add the first diagnosis for this visit."/>
      } @else {
        @if (isAdding()) {
          <div class="mq-card-dark p-6 border-l-4 border-purple-500 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="mq-label">ICD Code</label>
                <input type="text" [(ngModel)]="form.icdCode" class="mq-input" placeholder="A00.0"/>
              </div>
              <div class="space-y-1.5 sm:col-span-2">
                <label class="mq-label">Description <span class="text-rose-400">*</span></label>
                <input type="text" [(ngModel)]="form.description" class="mq-input" placeholder="Diagnosis description"/>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="mq-label">Type</label>
                <select [(ngModel)]="form.type" class="mq-input mq-select">
                  <option [value]="DT._1">Primary</option>
                  <option [value]="DT._2">Secondary</option>
                  <option [value]="DT._3">Differential</option>
                  <option [value]="DT._4">Complication</option>
                  <option [value]="DT._5">Other</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="mq-label">Notes</label>
                <input type="text" [(ngModel)]="form.notes" class="mq-input" placeholder="Optional notes"/>
              </div>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <button (click)="confirmAdd()" [disabled]="!form.description.trim()"
                      class="btn-primary px-5 py-2.5 text-sm">Save</button>
              <button (click)="cancelAdd()" class="btn-ghost px-5 py-2.5 text-sm">Cancel</button>
            </div>
          </div>
        }

        <div class="space-y-3">
          @for (d of diagnoses(); track d.id) {
            <div class="flex items-start justify-between p-4 mq-card-dark border-l-2 border-purple-500/50 list-item">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3">
                  @if (d.icD10Code) {
                    <span class="font-mono text-purple-400 text-xs font-bold px-2 py-0.5 rounded bg-purple-500/10">{{ d.icD10Code }}</span>
                  }
                  <span class="text-white font-medium text-sm">{{ d.codeDescription }}</span>
                </div>
                @if (d.type) {
                  <span class="text-mq-s400 text-[11px] mt-1 block">{{ d.type }}</span>
                }
                @if (d.notes) {
                  <p class="text-mq-s400 text-xs mt-1">{{ d.notes }}</p>
                }
              </div>
              @if (!readonly && d.id) {
                <div class="flex-shrink-0 ml-4">
                  @if (deletingId() === d.id) {
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-rose-400 font-semibold">Confirm?</span>
                      <button (click)="deleteDiagnosis(d.id!)" class="text-xs text-rose-400 hover:text-rose-300 font-bold">Yes</button>
                      <button (click)="deletingId.set(null)" class="text-xs text-mq-s400 hover:text-white">No</button>
                    </div>
                  } @else {
                    <button (click)="deletingId.set(d.id!)"
                            class="text-mq-s400 hover:text-rose-400 transition-colors p-1">
                      <lucide-icon name="trash-2" [size]="14"/>
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class DiagnosesTabComponent {
  @Input({ required: true }) visitId!: string;
  @Input() readonly = false;
  @Input() set visitData(v: any) { if (v) this.loadFromVisit(v); }

  readonly DT = DiagnosisType;

  private readonly client = inject(ClinicalVisitsClient);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
  private readonly notify = inject(NotificationService);

  diagnoses = signal<any[]>([]);
  isLoading = signal(false);
  isAdding = signal(false);
  deletingId = signal<string | null>(null);

  form = { icdCode: '', description: '', type: this.DT._1, notes: '' };

  loadFromVisit(visit: any) {
    this.diagnoses.set(visit?.diagnoses ?? []);
  }

  cancelAdd() {
    this.isAdding.set(false);
    this.form = { icdCode: '', description: '', type: this.DT._1, notes: '' };
  }

  async confirmAdd() {
    if (!this.form.description.trim()) return;
    this.isLoading.set(true);
    try {
      const command = new AddDiagnosisCommand({
        visitId: this.visitId,
        icD10Code: this.form.icdCode || undefined,
        codeDescription: this.form.description,
        diagnosisType: this.form.type,
        notes: this.form.notes || undefined,
      });
      await firstValueFrom(this.client.diagnoses(this.visitId, command));
      this.notify.success('Diagnosis added');
      this.cancelAdd();
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteDiagnosis(id: string) {
    this.notify.info('Delete endpoint not yet available — remove in future step');
    this.deletingId.set(null);
  }
}
